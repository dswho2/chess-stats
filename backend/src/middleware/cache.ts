import { Request, Response, NextFunction } from 'express';
import { cacheService, TTL } from '../services/cache.service';
import { logger } from '../utils/logger';

/**
 * Cache Middleware Factory
 *
 * Creates Express middleware that caches API responses
 * Future: Will integrate with Redis + PostgreSQL for persistence
 */

interface CacheOptions {
  /** Time-to-live in milliseconds (or null for permanent cache) */
  ttl?: number | null;
  /** Custom cache key generator function */
  keyGenerator?: (req: Request) => string;
  /** Whether to include query params in cache key */
  includeQuery?: boolean;
  /** Cache only successful responses (2xx status codes) */
  successOnly?: boolean;
}

/**
 * Default cache key generator
 * Uses request path + query string
 */
function defaultKeyGenerator(req: Request, includeQuery: boolean = true): string {
  const base = req.originalUrl || req.url;

  if (includeQuery) {
    return `api:${base}`;
  }

  // Remove query string
  return `api:${req.path}`;
}

/**
 * Cache middleware for API routes
 *
 * Usage:
 * ```
 * router.get('/tournaments', cache({ ttl: TTL.MEDIUM }), handler)
 * ```
 */
export function cache(options: CacheOptions = {}) {
  const {
    ttl = TTL.MEDIUM,
    keyGenerator,
    includeQuery = true,
    successOnly = true
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator
      ? keyGenerator(req)
      : defaultKeyGenerator(req, includeQuery);

    try {
      // Try to get from cache
      const cached = await cacheService.get<any>(cacheKey);

      if (cached) {
        logger.debug('Cache middleware: HIT', { key: cacheKey });

        // Add cache headers
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);

        // Return cached response
        return res.json(cached);
      }

      logger.debug('Cache middleware: MISS', { key: cacheKey });

      // Cache miss - intercept response
      const originalJson = res.json.bind(res);

      res.json = function(body: any) {
        // Check if we should cache this response
        const shouldCache = !successOnly || (res.statusCode >= 200 && res.statusCode < 300);

        if (shouldCache) {
          // Cache the response asynchronously (don't block)
          cacheService.set(cacheKey, body, ttl).catch(err => {
            logger.error('Failed to cache response', { error: err, key: cacheKey });
          });
        }

        // Add cache headers
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-Key', cacheKey);

        // Send original response
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', { error, key: cacheKey });
      // Continue without caching on error
      next();
    }
  };
}

/**
 * Specialized cache middleware for tournament data
 *
 * Automatically determines TTL based on tournament status
 * - Ongoing tournaments: 5 min TTL
 * - Completed tournaments: Permanent cache
 */
export function cacheTournament() {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const platform = req.baseUrl.includes('lichess') ? 'lichess' : 'unknown';
    const tournamentId = req.params.id;

    if (!tournamentId) {
      return next();
    }

    const cacheKey = cacheService.tournamentKey(platform, tournamentId);

    try {
      const cached = await cacheService.get<any>(cacheKey);

      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        return res.json(cached);
      }

      // Intercept response to determine TTL
      const originalJson = res.json.bind(res);

      res.json = function(body: any) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Determine TTL based on tournament status
          const tournament = body.data || body;
          const isFinished = tournament.isFinished || tournament.status === 'completed';

          const ttl = isFinished ? TTL.PERMANENT : TTL.LIVE;

          cacheService.set(cacheKey, body, ttl).catch(err => {
            logger.error('Failed to cache tournament', { error: err, key: cacheKey });
          });

          logger.info('Cached tournament', {
            tournamentId,
            platform,
            ttl: ttl === null ? 'permanent' : `${ttl}ms`,
            status: tournament.status
          });
        }

        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-Key', cacheKey);

        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error('Tournament cache middleware error', { error, tournamentId });
      next();
    }
  };
}

/**
 * Cache middleware for player data
 */
export function cachePlayer(ttl: number | null = TTL.LONG) {
  return cache({
    ttl,
    keyGenerator: (req) => {
      const platform = req.baseUrl.includes('lichess')
        ? 'lichess'
        : req.baseUrl.includes('fide')
        ? 'fide'
        : 'unknown';

      const playerId = req.params.id || req.params.username;
      return cacheService.playerKey(platform, playerId);
    }
  });
}

/**
 * Cache middleware for rankings/top players
 */
export function cacheRankings(ttl: number = TTL.MEDIUM) {
  return cache({
    ttl,
    keyGenerator: (req) => {
      const platform = req.baseUrl.includes('lichess')
        ? 'lichess'
        : req.baseUrl.includes('fide')
        ? 'fide'
        : 'chess-com';

      const type = req.params.perfType || req.params.type || 'standard';
      const count = req.query.count as string;

      return cacheService.rankingsKey(platform, type, count ? parseInt(count) : undefined);
    }
  });
}

/**
 * Cache middleware for current tournaments list
 */
export function cacheCurrentTournaments(ttl: number = TTL.LIVE) {
  return cache({
    ttl,
    keyGenerator: (req) => {
      const platform = req.baseUrl.includes('lichess') ? 'lichess' : 'chess-com';
      return cacheService.currentTournamentsKey(platform);
    }
  });
}

/**
 * Conditional cache middleware
 * Only caches if condition function returns true
 */
export function cacheIf(
  condition: (req: Request) => boolean,
  options: CacheOptions = {}
) {
  const cacheMiddleware = cache(options);

  return (req: Request, res: Response, next: NextFunction) => {
    if (condition(req)) {
      return cacheMiddleware(req, res, next);
    }
    next();
  };
}
