import { logger } from '../utils/logger';

/**
 * Cache Service - Abstraction layer for future Redis integration
 *
 * Current: In-memory cache (development/passthrough)
 * Future: Redis cache with PostgreSQL fallback
 *
 * This service is designed to support the future architecture where:
 * 1. Redis will store hot data (short/medium TTL)
 * 2. PostgreSQL will store persistent data
 * 3. Background jobs will refresh cache
 */

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number | null; // null = never expires
}

export type CacheTTL = {
  /** Historical/immutable data - never expires */
  PERMANENT: null;
  /** Live tournament data - 5 minutes */
  LIVE: number;
  /** Frequently accessed data - 30 minutes */
  MEDIUM: number;
  /** Player profiles - 1 hour */
  LONG: number;
  /** Search results - 10 minutes */
  SHORT: number;
};

export const TTL: CacheTTL = {
  PERMANENT: null,
  LIVE: 5 * 60 * 1000,        // 5 minutes
  MEDIUM: 30 * 60 * 1000,     // 30 minutes
  LONG: 60 * 60 * 1000,       // 1 hour
  SHORT: 10 * 60 * 1000       // 10 minutes
};

export class CacheService {
  // In-memory cache (temporary - will be replaced with Redis)
  private cache: Map<string, CacheEntry<any>> = new Map();

  // Metrics
  private hits: number = 0;
  private misses: number = 0;

  /**
   * Get data from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      logger.debug('Cache miss', { key });
      return null;
    }

    // Check if expired
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      logger.debug('Cache expired', { key });
      return null;
    }

    this.hits++;
    logger.debug('Cache hit', { key });
    return entry.data as T;
  }

  /**
   * Set data in cache with TTL
   */
  async set<T>(key: string, data: T, ttl: number | null = TTL.MEDIUM): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      cachedAt: Date.now(),
      expiresAt: ttl !== null ? Date.now() + ttl : null
    };

    this.cache.set(key, entry);

    logger.debug('Cache set', {
      key,
      ttl: ttl === null ? 'permanent' : `${ttl}ms`,
      expiresAt: entry.expiresAt ? new Date(entry.expiresAt).toISOString() : 'never'
    });
  }

  /**
   * Delete specific key from cache
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    logger.debug('Cache invalidated', { key });
  }

  /**
   * Delete all keys matching pattern
   * Pattern examples: 'tournament:*', 'player:lichess:*'
   */
  async deletePattern(pattern: string): Promise<number> {
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
    let deletedCount = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    logger.info('Cache pattern invalidated', { pattern, deletedCount });
    return deletedCount;
  }

  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    const size = this.cache.size;
    this.cache.clear();
    logger.warn('Cache cleared', { entriesRemoved: size });
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? ((this.hits / total) * 100).toFixed(2) : '0.00';

    return {
      hits: this.hits,
      misses: this.misses,
      total,
      hitRate: `${hitRate}%`,
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }

  /**
   * Reset metrics
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
    logger.info('Cache stats reset');
  }

  // ============================================================================
  // Cache Key Builders (consistent naming)
  // ============================================================================

  /**
   * Build cache key for tournament data
   */
  tournamentKey(platform: string, id: string): string {
    return `tournament:${platform}:${id}`;
  }

  /**
   * Build cache key for tournament results/standings
   */
  tournamentResultsKey(platform: string, id: string, limit?: number): string {
    return `tournament:${platform}:${id}:results${limit ? `:${limit}` : ''}`;
  }

  /**
   * Build cache key for tournament games
   */
  tournamentGamesKey(platform: string, id: string, player?: string): string {
    return `tournament:${platform}:${id}:games${player ? `:${player}` : ''}`;
  }

  /**
   * Build cache key for player data
   */
  playerKey(platform: string, id: string): string {
    return `player:${platform}:${id}`;
  }

  /**
   * Build cache key for player games
   */
  playerGamesKey(platform: string, id: string, options?: any): string {
    const optionsStr = options ? `:${JSON.stringify(options)}` : '';
    return `player:${platform}:${id}:games${optionsStr}`;
  }

  /**
   * Build cache key for rankings/top players
   */
  rankingsKey(platform: string, type: string, count?: number): string {
    return `rankings:${platform}:${type}${count ? `:${count}` : ''}`;
  }

  /**
   * Build cache key for current tournaments list
   */
  currentTournamentsKey(platform: string): string {
    return `tournaments:${platform}:current`;
  }

  // ============================================================================
  // Future: Redis Implementation Hooks
  // ============================================================================

  /**
   * This method will be used to check if data should be revalidated
   * Implements stale-while-revalidate pattern
   */
  async shouldRevalidate(key: string, staleTime: number): Promise<boolean> {
    const entry = this.cache.get(key);

    if (!entry) {
      return false; // No data to revalidate
    }

    const age = Date.now() - entry.cachedAt;
    return age > staleTime;
  }

  /**
   * Get data age in milliseconds
   */
  async getAge(key: string): Promise<number | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    return Date.now() - entry.cachedAt;
  }
}

// Singleton instance
export const cacheService = new CacheService();
