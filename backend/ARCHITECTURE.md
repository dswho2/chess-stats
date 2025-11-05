# Backend Architecture & Data Flow

This document outlines the complete data flow architecture, caching strategy, and implementation plan for the chess stats backend.

---

## Table of Contents

1. [Current State vs Future Architecture](#current-state-vs-future-architecture)
2. [Data Flow Strategy by Data Type](#data-flow-strategy-by-data-type)
3. [Background Job Schedule](#background-job-schedule)
4. [Caching Strategy by Endpoint](#caching-strategy-by-endpoint)
5. [Rate Limiting Strategy](#rate-limiting-strategy)
6. [Cache Invalidation Rules](#cache-invalidation-rules)
7. [Performance Optimizations](#performance-optimizations)
8. [Monitoring & Health Checks](#monitoring--health-checks)
9. [Data Flow Decision Tree](#data-flow-decision-tree)
10. [Implementation Roadmap](#implementation-roadmap)

---

## Current State vs Future Architecture

### Current Implementation (POC)

```
Frontend → Backend API → External APIs (Lichess/FIDE) → Response
```

**Characteristics:**
- Direct passthrough - no caching
- Every request hits external APIs
- Works for testing but not production-ready
- Response time: 500ms - 2s per request

### Production Architecture (Target)

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    (Next.js on Vercel)                          │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API                                 │
│                   (Express on Railway)                           │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              REDIS CACHE LAYER                         │    │
│  │  - API Response Cache (5 min - 1 hour TTL)            │    │
│  │  - Hot data (ongoing tournaments, top players)         │    │
│  └────────────────────────────────────────────────────────┘    │
│                          ▲                                       │
│                          │                                       │
│  ┌───────────────────────┼────────────────────────────────┐    │
│  │           POSTGRESQL DATABASE                          │    │
│  │  - Historical tournament data                          │    │
│  │  - Player profiles & stats                             │    │
│  │  - Rating history                                      │    │
│  │  - Game records                                        │    │
│  │  - Cold storage (rarely changes)                       │    │
│  └────────────────────────────────────────────────────────┘    │
│                          ▲                                       │
│                          │                                       │
│  ┌───────────────────────┼────────────────────────────────┐    │
│  │            BACKGROUND JOBS (BullMQ)                    │    │
│  │  - Scheduled data refresh jobs                         │    │
│  │  - Tournament monitoring                               │    │
│  │  - Rating updates                                      │    │
│  └────────────────────────────────────────────────────────┘    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL APIs                                 │
│  - Lichess.org API (generous rate limits)                       │
│  - Chess.com PubAPI (max 2 concurrent)                          │
│  - FIDE API (community-built scraper)                           │
└─────────────────────────────────────────────────────────────────┘
```

**Characteristics:**
- Multi-layer caching (Redis + PostgreSQL)
- Background jobs handle data refresh
- User requests almost always hit cache
- Response time: <10ms for cached data

---

## Data Flow Strategy by Data Type

### 1. Live/Real-Time Data (Short TTL)

**Examples:** Ongoing tournaments, current standings, live games

**Cache Strategy:**
- **Redis TTL:** 2-5 minutes
- **Database:** Optional (for historical record)
- **Refresh:** Background job every 2-5 minutes

**Flow:**
```
User Request
  ↓
Check Redis
  ├─→ HIT: Return cached data (<10ms)
  └─→ MISS: Fetch from API → Cache in Redis (TTL: 5min) → Return
```

**Implementation:**

```typescript
// src/middleware/cache.ts
async function getTournament(req, res) {
  const tournamentId = req.params.id;
  const cacheKey = `tournament:${tournamentId}`;

  // Try cache first
  let tournament = await redis.get(cacheKey);

  if (tournament) {
    return res.json({
      success: true,
      data: JSON.parse(tournament),
      cached: true
    });
  }

  // Cache miss - fetch from Lichess
  tournament = await lichessService.getTournament(tournamentId);

  // Determine TTL based on status
  const ttl = tournament.isFinished ? 86400 : 300; // 24h if finished, 5min if ongoing

  // Store in cache
  await redis.setex(cacheKey, ttl, JSON.stringify(tournament));

  // Also store in DB for historical record
  await db.tournament.upsert({
    where: { externalId: tournamentId },
    data: tournament
  });

  return res.json({
    success: true,
    data: tournament,
    cached: false
  });
}
```

**Background Refresh:**

```typescript
// src/jobs/tournament-monitor.ts
import { schedule } from 'node-cron';

// Update ongoing tournaments every 2 minutes
schedule.scheduleJob('*/2 * * * *', async () => {
  const ongoingTournaments = await db.tournament.findMany({
    where: { status: 'ongoing' }
  });

  for (const t of ongoingTournaments) {
    const fresh = await lichessService.getTournament(t.externalId);

    // Update cache
    await redis.setex(
      `tournament:${t.externalId}`,
      300,
      JSON.stringify(fresh)
    );

    // Update database standings
    await db.tournament.update({
      where: { id: t.id },
      data: {
        nbPlayers: fresh.nbPlayers,
        stats: fresh.stats
      }
    });
  }

  logger.info(`Refreshed ${ongoingTournaments.length} ongoing tournaments`);
});
```

---

### 2. Frequently Accessed Data (Medium TTL)

**Examples:** Top players, player profiles, leaderboards

**Cache Strategy:**
- **Redis TTL:** 30 minutes - 1 hour
- **Database:** Yes (historical tracking)
- **Refresh:** Background job every hour

**Flow:**
```
User Request
  ↓
Check Redis (TTL: 30min)
  ├─→ HIT: Return cached data
  └─→ MISS: Check Database
        ├─→ Found: Return + cache in Redis
        └─→ Not Found: Fetch from API → Cache + DB → Return
```

**Implementation:**

```typescript
// src/routes/players.ts
async function getTopPlayers(req, res) {
  const perfType = req.params.perfType || 'blitz';
  const cacheKey = `top-players:${perfType}`;

  // Check cache
  let players = await redis.get(cacheKey);
  if (players) {
    return res.json({
      success: true,
      data: JSON.parse(players),
      cached: true
    });
  }

  // Check database for recent snapshot
  const snapshot = await db.topPlayersSnapshot.findFirst({
    where: {
      perfType,
      createdAt: {
        gte: new Date(Date.now() - 30 * 60 * 1000) // Within 30 min
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (snapshot) {
    // Use DB snapshot and cache it
    await redis.setex(cacheKey, 1800, JSON.stringify(snapshot.players));
    return res.json({
      success: true,
      data: snapshot.players,
      cached: false,
      source: 'database'
    });
  }

  // Fetch from Lichess
  players = await lichessService.getTopPlayers(perfType, 100);

  // Cache for 30 minutes
  await redis.setex(cacheKey, 1800, JSON.stringify(players));

  // Store snapshot in DB
  await db.topPlayersSnapshot.create({
    data: {
      perfType,
      players,
      timestamp: new Date()
    }
  });

  return res.json({
    success: true,
    data: players,
    cached: false,
    source: 'api'
  });
}
```

**Background Job:**

```typescript
// src/jobs/rankings-updater.ts
// Update top players every hour
schedule.scheduleJob('0 * * * *', async () => {
  const perfTypes = ['bullet', 'blitz', 'rapid', 'classical'];

  for (const perfType of perfTypes) {
    try {
      const players = await lichessService.getTopPlayers(perfType, 100);

      // Update cache
      await redis.setex(
        `top-players:${perfType}`,
        1800,
        JSON.stringify(players)
      );

      // Store in database
      await db.topPlayersSnapshot.create({
        data: { perfType, players, timestamp: new Date() }
      });

      logger.info(`Updated top ${perfType} players`);
    } catch (error) {
      logger.error(`Failed to update ${perfType} rankings`, { error });
    }
  }
});
```

---

### 3. Historical/Immutable Data (Long TTL or No Expiry)

**Examples:** Completed tournaments, historical ratings, game archives

**Cache Strategy:**
- **Redis:** Very long TTL (24 hours) or no expiry
- **Database:** Primary source of truth
- **Refresh:** Never (immutable)

**Flow:**
```
User Request (historical tournament)
  ↓
Check Database (primary source)
  ├─→ Found: Return from DB (cache in Redis permanently)
  └─→ Not Found: Fetch from API → Store in DB → Cache forever → Return
```

**Implementation:**

```typescript
// src/routes/tournaments.ts
async function getTournamentHistory(req, res) {
  const tournamentId = req.params.id;

  // Check database first (source of truth for historical data)
  let tournament = await db.tournament.findUnique({
    where: { externalId: tournamentId },
    include: {
      standings: true,
      games: {
        take: 100,
        include: {
          whitePlayer: true,
          blackPlayer: true
        }
      }
    }
  });

  if (tournament) {
    // Cache permanently in Redis
    await redis.set(
      `tournament:${tournamentId}`,
      JSON.stringify(tournament)
    );

    return res.json({
      success: true,
      data: tournament,
      source: 'database'
    });
  }

  // Not in DB - fetch from API
  tournament = await lichessService.getTournament(tournamentId);

  if (tournament.isFinished) {
    // Import complete tournament data
    const imported = await importTournamentComplete(tournament);

    // Cache forever (no TTL)
    await redis.set(
      `tournament:${tournamentId}`,
      JSON.stringify(imported)
    );

    return res.json({
      success: true,
      data: imported,
      source: 'api'
    });
  }

  // Ongoing tournament - use live flow
  return res.json({
    success: true,
    data: tournament,
    source: 'api'
  });
}

async function importTournamentComplete(tournament) {
  // Fetch all data
  const [games, results] = await Promise.all([
    lichessService.getTournamentGames(tournament.id),
    lichessService.getTournamentResults(tournament.id, 500)
  ]);

  // Store in database
  const imported = await db.tournament.create({
    data: {
      externalId: tournament.id,
      name: tournament.fullName,
      platform: 'lichess',
      format: tournament.system,
      status: 'completed',
      timeControl: tournament.perf.key,
      startDate: new Date(tournament.startsAt),
      endDate: tournament.finishesAt ? new Date(tournament.finishesAt) : null,
      participantCount: tournament.nbPlayers,
      metadata: tournament,

      standings: {
        create: results.map(r => ({
          rank: r.rank,
          score: r.score,
          player: {
            connectOrCreate: {
              where: { lichessUsername: r.username },
              create: {
                username: r.username,
                lichessUsername: r.username
              }
            }
          }
        }))
      },

      games: {
        create: games.map(g => ({
          externalId: g.id,
          roundNumber: 1, // Parse from game metadata
          result: g.winner === 'white' ? '1-0' : g.winner === 'black' ? '0-1' : '1/2-1/2',
          opening: g.opening?.name,
          openingEco: g.opening?.eco,
          moves: g.moves,
          metadata: g
        }))
      }
    },
    include: {
      standings: true,
      games: true
    }
  });

  logger.info(`Imported tournament ${tournament.id} with ${results.length} standings and ${games.length} games`);

  return imported;
}
```

---

## Background Job Schedule

### High Frequency (Every 2-5 minutes)

**Purpose:** Keep live tournament data fresh

```typescript
// src/jobs/tournament-monitor.ts
import { schedule } from 'node-cron';

// Monitor ongoing tournaments - Every 2 minutes
schedule.scheduleJob('*/2 * * * *', async () => {
  const ongoingTournaments = await db.tournament.findMany({
    where: { status: 'ongoing' }
  });

  for (const t of ongoingTournaments) {
    const fresh = await lichessService.getTournament(t.externalId);

    // Update cache
    await redis.setex(
      `tournament:${t.externalId}`,
      300,
      JSON.stringify(fresh)
    );

    // Update database
    await db.tournament.update({
      where: { id: t.id },
      data: {
        nbPlayers: fresh.nbPlayers,
        stats: fresh.stats,
        updatedAt: new Date()
      }
    });

    // Check if tournament finished
    if (fresh.isFinished && !t.isFinished) {
      await importTournamentComplete(fresh);
      logger.info(`Tournament ${t.externalId} finished - imported complete data`);
    }
  }

  logger.info(`Refreshed ${ongoingTournaments.length} ongoing tournaments`);
});
```

---

### Medium Frequency (Every 30 minutes)

**Purpose:** Discover new tournaments

```typescript
// src/jobs/tournament-discovery.ts
// Check for new tournaments - Every 30 minutes
schedule.scheduleJob('*/30 * * * *', async () => {
  const currentTournaments = await lichessService.getCurrentTournaments();

  // Store created/upcoming tournaments
  for (const t of currentTournaments.created) {
    const exists = await db.tournament.findUnique({
      where: { externalId: t.id }
    });

    if (!exists) {
      await db.tournament.create({
        data: {
          externalId: t.id,
          name: t.fullName,
          platform: 'lichess',
          format: t.system,
          status: 'upcoming',
          timeControl: t.perf.key,
          startDate: new Date(t.startsAt),
          endDate: t.finishesAt ? new Date(t.finishesAt) : null,
          metadata: t
        }
      });

      logger.info(`Discovered new tournament: ${t.fullName}`);
    }
  }

  // Store started tournaments
  for (const t of currentTournaments.started) {
    await db.tournament.upsert({
      where: { externalId: t.id },
      create: {
        externalId: t.id,
        name: t.fullName,
        platform: 'lichess',
        format: t.system,
        status: 'ongoing',
        timeControl: t.perf.key,
        startDate: new Date(t.startsAt),
        metadata: t
      },
      update: {
        status: 'ongoing',
        nbPlayers: t.nbPlayers,
        updatedAt: new Date()
      }
    });
  }

  logger.info('Tournament discovery complete');
});
```

---

### Low Frequency (Daily)

**Purpose:** Update player ratings and profiles

```typescript
// src/jobs/player-updates.ts
// Update FIDE ratings - Daily at 3am
schedule.scheduleJob('0 3 * * *', async () => {
  logger.info('Starting daily FIDE rating update');

  const topPlayers = await fideService.getTopPlayers(100);

  for (const player of topPlayers) {
    await db.player.upsert({
      where: { fideId: player.fide_id },
      create: {
        username: player.name,
        fideId: player.fide_id,
        fullName: player.name,
        country: player.country,
        fideClassicalRating: parseInt(player.rating)
      },
      update: {
        fideClassicalRating: parseInt(player.rating),
        updatedAt: new Date()
      }
    });
  }

  logger.info(`Updated FIDE ratings for ${topPlayers.length} players`);
});

// Update Lichess top players - Daily at 4am
schedule.scheduleJob('0 4 * * *', async () => {
  const perfTypes = ['bullet', 'blitz', 'rapid', 'classical'];

  for (const perfType of perfTypes) {
    const players = await lichessService.getTopPlayers(perfType, 200);

    for (const player of players) {
      const rating = player.perfs[perfType].rating;

      await db.player.upsert({
        where: { lichessUsername: player.username },
        create: {
          username: player.username,
          lichessUsername: player.username,
          title: player.title,
          [`lichess${perfType.charAt(0).toUpperCase() + perfType.slice(1)}Rating`]: rating
        },
        update: {
          [`lichess${perfType.charAt(0).toUpperCase() + perfType.slice(1)}Rating`]: rating,
          title: player.title,
          updatedAt: new Date()
        }
      });
    }

    logger.info(`Updated ${players.length} Lichess ${perfType} players`);
  }
});
```

---

### Very Low Frequency (Weekly)

**Purpose:** Import historical data, clean up old cache

```typescript
// src/jobs/weekly-maintenance.ts
// Scrape Titled Tuesday - Weekly on Tuesday at 4am
schedule.scheduleJob('0 4 * * 2', async () => {
  logger.info('Checking for new Titled Tuesday tournament');

  // Tuesday 4am - after Titled Tuesday completes
  const titledTuesday = await chessComService.getLatestTitledTuesday();

  const exists = await db.tournament.findUnique({
    where: { externalId: titledTuesday.id }
  });

  if (!exists) {
    await importChessComTournament(titledTuesday);
    logger.info(`Imported Titled Tuesday: ${titledTuesday.name}`);
  }
});

// Cache cleanup - Weekly on Sunday at 2am
schedule.scheduleJob('0 2 * * 0', async () => {
  logger.info('Starting cache cleanup');

  // Remove old top player snapshots (keep last 30 days)
  const deleted = await db.topPlayersSnapshot.deleteMany({
    where: {
      createdAt: {
        lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    }
  });

  logger.info(`Deleted ${deleted.count} old snapshots`);

  // Get Redis memory usage
  const info = await redis.info('memory');
  logger.info('Redis memory usage:', info);
});
```

---

## Caching Strategy by Endpoint

| Endpoint | Cache Location | TTL | Update Frequency | Notes |
|----------|---------------|-----|------------------|-------|
| `GET /tournaments` | Redis | 2 min | Background: 2 min | List changes frequently |
| `GET /tournaments?status=upcoming` | Redis | 30 min | Background: 30 min | Slower changes |
| `GET /tournaments/:id` (ongoing) | Redis | 5 min | Background: 5 min | Active monitoring |
| `GET /tournaments/:id` (finished) | PostgreSQL + Redis | Forever | Never | Immutable |
| `GET /tournaments/:id/results` | Redis | 5 min | On-demand | Updates with tournament |
| `GET /tournaments/:id/games` | PostgreSQL | Forever | On-demand | Import once when finished |
| `GET /players/lichess/top/:type` | Redis | 30 min | Background: 1 hour | Rankings change slowly |
| `GET /players/fide/top` | Redis | 1 day | Background: Daily | FIDE updates monthly |
| `GET /players/:id` | Redis | 1 hour | Background: Daily | Profile changes rarely |
| `GET /players/:id/history` | PostgreSQL | Forever | Background: Monthly | Historical data |
| `GET /players/:id/games` | On-demand | - | Never cached | Too much data |

---

## Rate Limiting Strategy

### Outbound Rate Limiting (To External APIs)

```typescript
// src/utils/rate-limiter.ts
import Bottleneck from 'bottleneck';

// Chess.com - STRICT (max 2 concurrent, documented limit)
export const chessComLimiter = new Bottleneck({
  maxConcurrent: 2,
  minTime: 500,  // 500ms between requests
  reservoir: 120,  // 120 requests
  reservoirRefreshAmount: 120,
  reservoirRefreshInterval: 60 * 1000  // per minute
});

chessComLimiter.on('failed', async (error, jobInfo) => {
  const id = jobInfo.options.id;
  logger.warn(`Job ${id} failed: ${error}`);

  if (error.statusCode === 429) {
    // Rate limited - wait longer
    return 60000;  // Retry after 1 minute
  }
});

// Lichess - Generous but respect 429
export const lichessLimiter = new Bottleneck({
  maxConcurrent: 5,
  minTime: 200,
  reservoir: 300,  // 300 requests
  reservoirRefreshAmount: 300,
  reservoirRefreshInterval: 60 * 1000  // per minute
});

lichessLimiter.on('failed', async (error, jobInfo) => {
  if (error.statusCode === 429) {
    // Lichess says: wait 1 full minute
    logger.warn('Lichess rate limit hit - waiting 60s');
    return 60000;
  }
});

// FIDE API - Community server, be nice
export const fideLimiter = new Bottleneck({
  maxConcurrent: 3,
  minTime: 300,
  reservoir: 180,  // 180 requests
  reservoirRefreshAmount: 180,
  reservoirRefreshInterval: 60 * 1000  // per minute
});

// Usage in services
export async function fetchChessComTournament(id: string) {
  return chessComLimiter.schedule(() =>
    fetch(`https://api.chess.com/pub/tournament/${id}`)
      .then(r => r.json())
  );
}
```

---

### Inbound Rate Limiting (From Frontend)

```typescript
// src/middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// General API rate limit
export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:api:'
  }),
  windowMs: 1 * 60 * 1000,  // 1 minute window
  max: 100,  // 100 requests per minute per IP
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,  // Return rate limit info in headers
  legacyHeaders: false
});

// Stricter limit for expensive operations
export const expensiveLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:expensive:'
  }),
  windowMs: 5 * 60 * 1000,  // 5 minute window
  max: 10,  // 10 requests per 5 minutes
  message: 'Too many expensive requests, please slow down'
});

// Apply to routes
app.use('/api', apiLimiter);
app.use('/api/tournaments/:id/games', expensiveLimiter);
app.use('/api/players/:id/games', expensiveLimiter);
```

---

## Cache Invalidation Rules

### Automatic Invalidation

```typescript
// src/services/cache.service.ts
export class CacheService {
  async invalidateTournament(tournamentId: string) {
    const keys = [
      `tournament:${tournamentId}`,
      `tournament:${tournamentId}:results`,
      `tournament:${tournamentId}:games`
    ];

    await redis.del(...keys);
    logger.info(`Invalidated cache for tournament ${tournamentId}`);
  }

  async handleTournamentStatusChange(tournament: any, previousState: any) {
    // When tournament finishes
    if (tournament.isFinished && !previousState.isFinished) {
      logger.info(`Tournament ${tournament.id} finished - updating cache strategy`);

      // Remove short TTL cache
      await redis.del(`tournament:${tournament.id}`);

      // Add permanent cache (no TTL)
      await redis.set(
        `tournament:${tournament.id}`,
        JSON.stringify(tournament)
      );

      // Import complete data
      await importTournamentComplete(tournament);
    }
  }

  async invalidatePlayerRankings(perfType: string) {
    await redis.del(`top-players:${perfType}`);
    logger.info(`Invalidated ${perfType} rankings cache`);
  }
}
```

---

### Manual Invalidation (Admin Endpoint)

```typescript
// src/routes/admin.ts
import { authenticateAdmin } from '../middleware/auth';

// POST /api/admin/cache/invalidate
router.post('/cache/invalidate', authenticateAdmin, async (req, res) => {
  const { key, pattern } = req.body;

  try {
    if (pattern) {
      // Invalidate by pattern (e.g., 'tournament:*')
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }

      logger.info(`Invalidated ${keys.length} keys matching pattern: ${pattern}`);

      return res.json({
        success: true,
        message: `Invalidated ${keys.length} keys`,
        pattern
      });
    }

    if (key) {
      await redis.del(key);
      logger.info(`Invalidated cache key: ${key}`);

      return res.json({
        success: true,
        message: 'Cache invalidated',
        key
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Must provide key or pattern'
    });
  } catch (error) {
    logger.error('Cache invalidation failed', { error });
    return res.status(500).json({
      success: false,
      error: 'Cache invalidation failed'
    });
  }
});

// POST /api/admin/cache/clear
router.post('/cache/clear', authenticateAdmin, async (req, res) => {
  try {
    await redis.flushdb();
    logger.warn('Full cache cleared by admin');

    return res.json({
      success: true,
      message: 'All cache cleared'
    });
  } catch (error) {
    logger.error('Cache clear failed', { error });
    return res.status(500).json({
      success: false,
      error: 'Cache clear failed'
    });
  }
});

// GET /api/admin/cache/stats
router.get('/cache/stats', authenticateAdmin, async (req, res) => {
  try {
    const info = await redis.info('stats');
    const memory = await redis.info('memory');
    const keyspace = await redis.info('keyspace');

    return res.json({
      success: true,
      data: {
        stats: info,
        memory,
        keyspace
      }
    });
  } catch (error) {
    logger.error('Failed to get cache stats', { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to get stats'
    });
  }
});
```

---

## Performance Optimizations

### 1. Stale-While-Revalidate Pattern

Return stale data immediately while fetching fresh data in background.

```typescript
// src/middleware/cache.ts
export async function getCachedWithRefresh<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number
): Promise<T> {
  const cached = await redis.get(key);
  const staleTime = ttl / 2; // Refresh at 50% of TTL

  if (cached) {
    const { data, cachedAt } = JSON.parse(cached);
    const age = Date.now() - cachedAt;

    // If data is getting stale, trigger background refresh
    if (age > staleTime) {
      // Don't await - let it refresh in background
      fetchFn()
        .then(fresh => {
          redis.setex(
            key,
            ttl,
            JSON.stringify({ data: fresh, cachedAt: Date.now() })
          );
        })
        .catch(err => {
          logger.error('Background refresh failed', { key, error: err });
        });
    }

    // Return stale data immediately
    return data;
  }

  // Cache miss - fetch and cache
  const fresh = await fetchFn();
  await redis.setex(
    key,
    ttl,
    JSON.stringify({ data: fresh, cachedAt: Date.now() })
  );

  return fresh;
}

// Usage
router.get('/tournaments/:id', async (req, res) => {
  const tournament = await getCachedWithRefresh(
    `tournament:${req.params.id}`,
    () => lichessService.getTournament(req.params.id),
    300  // 5 minute TTL
  );

  res.json({ success: true, data: tournament });
});
```

---

### 2. Batch Requests

Reduce number of API calls by batching requests.

```typescript
// src/services/batch.service.ts
export async function getTournamentsWithDetails(ids: string[]) {
  // Check cache for all at once
  const pipeline = redis.pipeline();
  ids.forEach(id => pipeline.get(`tournament:${id}`));
  const cachedResults = await pipeline.exec();

  // Separate cached vs missing
  const cached = [];
  const missing = [];

  ids.forEach((id, i) => {
    const result = cachedResults[i][1];
    if (result) {
      cached.push(JSON.parse(result));
    } else {
      missing.push(id);
    }
  });

  // Fetch missing ones in batch
  if (missing.length > 0) {
    const fresh = await Promise.all(
      missing.map(id => lichessService.getTournament(id))
    );

    // Cache all at once
    const cachePipeline = redis.pipeline();
    fresh.forEach(t => {
      const ttl = t.isFinished ? 86400 : 300;
      cachePipeline.setex(
        `tournament:${t.id}`,
        ttl,
        JSON.stringify(t)
      );
    });
    await cachePipeline.exec();

    return [...cached, ...fresh];
  }

  return cached;
}

// Usage
router.get('/tournaments/batch', async (req, res) => {
  const ids = req.query.ids.split(',');
  const tournaments = await getTournamentsWithDetails(ids);

  res.json({ success: true, data: tournaments, count: tournaments.length });
});
```

---

### 3. Response Compression

Reduce bandwidth usage for large responses.

```typescript
// src/index.ts
import compression from 'compression';

app.use(compression({
  // Only compress responses larger than 1kb
  threshold: 1024,

  // Compression level (0-9, higher = better compression but slower)
  level: 6,

  // Filter which responses to compress
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
```

---

### 4. Database Query Optimization

```typescript
// src/repositories/tournament.repository.ts
export class TournamentRepository {
  // Use indexes for common queries
  async findOngoing() {
    return db.tournament.findMany({
      where: { status: 'ongoing' },  // Index on status
      select: {
        id: true,
        externalId: true,
        name: true,
        nbPlayers: true,
        startDate: true,
        metadata: true
      },
      orderBy: { startDate: 'desc' }
    });
  }

  // Pagination for large result sets
  async findAll(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [tournaments, total] = await Promise.all([
      db.tournament.findMany({
        skip,
        take: limit,
        orderBy: { startDate: 'desc' }
      }),
      db.tournament.count()
    ]);

    return {
      data: tournaments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Efficient aggregation
  async getStats() {
    return db.tournament.aggregate({
      _count: { id: true },
      _avg: { participantCount: true },
      _max: { participantCount: true }
    });
  }
}
```

---

### 5. Connection Pooling

```typescript
// src/config/database.ts
import { PrismaClient } from '@prisma/client';

export const db = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Connection pool configuration in DATABASE_URL
// postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10
```

```typescript
// src/config/redis.ts
import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  }
});

redis.on('error', (err) => {
  logger.error('Redis error', { error: err });
});

redis.on('connect', () => {
  logger.info('Redis connected');
});
```

---

## Monitoring & Health Checks

### Cache Hit Rate Tracking

```typescript
// src/middleware/metrics.ts
let cacheHits = 0;
let cacheMisses = 0;

export function trackCacheHit() {
  cacheHits++;
}

export function trackCacheMiss() {
  cacheMisses++;
}

export function getCacheMetrics() {
  const total = cacheHits + cacheMisses;
  const hitRate = total > 0 ? (cacheHits / total) * 100 : 0;

  return {
    hits: cacheHits,
    misses: cacheMisses,
    total,
    hitRate: hitRate.toFixed(2) + '%'
  };
}

// Reset metrics daily
schedule.scheduleJob('0 0 * * *', () => {
  logger.info('Daily cache metrics', getCacheMetrics());
  cacheHits = 0;
  cacheMisses = 0;
});
```

---

### Health Check Endpoint

```typescript
// src/routes/health.ts
router.get('/health', async (req, res) => {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'ok',
    checks: {}
  };

  // Check database
  try {
    await db.$queryRaw`SELECT 1`;
    checks.checks.database = { status: 'ok' };
  } catch (error) {
    checks.status = 'error';
    checks.checks.database = { status: 'error', error: error.message };
  }

  // Check Redis
  try {
    const ping = await redis.ping();
    checks.checks.redis = { status: ping === 'PONG' ? 'ok' : 'error' };
  } catch (error) {
    checks.status = 'error';
    checks.checks.redis = { status: 'error', error: error.message };
  }

  // Check external APIs
  try {
    const lichessCheck = await fetch('https://lichess.org/api/tournament');
    checks.checks.lichess = { status: lichessCheck.ok ? 'ok' : 'error' };
  } catch (error) {
    checks.checks.lichess = { status: 'error', error: error.message };
  }

  // Add cache metrics
  checks.cache = getCacheMetrics();

  // Add job queue stats
  try {
    const activeJobs = await scraperQueue.getActiveCount();
    const waitingJobs = await scraperQueue.getWaitingCount();
    const failedJobs = await scraperQueue.getFailedCount();

    checks.jobs = {
      active: activeJobs,
      waiting: waitingJobs,
      failed: failedJobs
    };
  } catch (error) {
    checks.jobs = { status: 'error', error: error.message };
  }

  const statusCode = checks.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(checks);
});
```

---

### Queue Monitoring Dashboard

```typescript
// src/routes/admin.ts
router.get('/jobs', authenticateAdmin, async (req, res) => {
  const jobs = await scraperQueue.getJobs([
    'active',
    'waiting',
    'completed',
    'failed'
  ]);

  const grouped = {
    active: jobs.filter(j => j.isActive()),
    waiting: jobs.filter(j => j.isWaiting()),
    completed: jobs.filter(j => j.isCompleted()).slice(0, 20),
    failed: jobs.filter(j => j.isFailed()).slice(0, 20)
  };

  res.json({
    success: true,
    data: grouped,
    counts: {
      active: grouped.active.length,
      waiting: grouped.waiting.length,
      completed: grouped.completed.length,
      failed: grouped.failed.length
    }
  });
});

// Retry failed job
router.post('/jobs/:id/retry', authenticateAdmin, async (req, res) => {
  const job = await scraperQueue.getJob(req.params.id);

  if (!job) {
    return res.status(404).json({ success: false, error: 'Job not found' });
  }

  await job.retry();

  res.json({ success: true, message: 'Job queued for retry' });
});
```

---

## Data Flow Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│              User Requests Tournament Data                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │ Check Redis Cache │
              └─────────┬─────────┘
                        │
          ┌─────────────┴──────────────┐
          │                            │
      CACHE HIT                   CACHE MISS
          │                            │
          ▼                            ▼
    ┌──────────┐           ┌────────────────────┐
    │  Return  │           │ Check PostgreSQL?   │
    │  Cached  │           │ (if historical)     │
    │  (<10ms) │           └──────────┬──────────┘
    └──────────┘                      │
                        ┌─────────────┴──────────────┐
                        │                            │
                    FOUND IN DB                  NOT IN DB
                        │                            │
                        ▼                            ▼
              ┌───────────────┐          ┌──────────────────┐
              │  Return from  │          │  Fetch from API  │
              │  Database +   │          │  (Rate limited)  │
              │  Cache Result │          └────────┬─────────┘
              └───────────────┘                   │
                                                  ▼
                                        ┌──────────────────┐
                                        │  Cache in Redis  │
                                        │  (with TTL)      │
                                        └────────┬─────────┘
                                                 │
                                                 ▼
                                        ┌──────────────────┐
                                        │  Store in DB     │
                                        │  (if needed)     │
                                        └────────┬─────────┘
                                                 │
                                                 ▼
                                        ┌──────────────────┐
                                        │   Return Data    │
                                        └──────────────────┘
```

**Performance Targets:**
- ✅ **Cached requests:** <10ms
- ✅ **Database queries:** 20-50ms
- ✅ **First API fetch:** 500ms-1s
- ✅ **Cache hit rate:** >90%

---

## Implementation Roadmap

### Phase 1: Add Caching Layer (Week 1)

**Goal:** Implement Redis caching for existing endpoints

- [ ] Set up Redis connection
- [ ] Create cache middleware
- [ ] Add caching to tournament endpoints
- [ ] Add caching to player endpoints
- [ ] Implement cache invalidation logic
- [ ] Add cache metrics tracking

**Files to Create:**
- `src/config/redis.ts`
- `src/middleware/cache.ts`
- `src/services/cache.service.ts`
- `src/middleware/metrics.ts`

---

### Phase 2: Add Database Layer (Week 2)

**Goal:** Set up PostgreSQL with Prisma

- [ ] Set up PostgreSQL (Docker or Railway)
- [ ] Create Prisma schema
- [ ] Run migrations
- [ ] Create repositories
- [ ] Implement database storage for tournaments
- [ ] Implement database storage for players
- [ ] Add database queries to endpoints

**Files to Create:**
- `prisma/schema.prisma`
- `src/repositories/tournament.repository.ts`
- `src/repositories/player.repository.ts`
- `src/repositories/game.repository.ts`

---

### Phase 3: Background Jobs (Week 3)

**Goal:** Automate data refresh with BullMQ

- [ ] Set up BullMQ with Redis
- [ ] Create job queue configuration
- [ ] Implement tournament monitoring job (2 min)
- [ ] Implement tournament discovery job (30 min)
- [ ] Implement player rating updates (daily)
- [ ] Implement ranking updates (hourly)
- [ ] Add job monitoring dashboard

**Files to Create:**
- `src/jobs/queue.ts`
- `src/jobs/tournament-monitor.ts`
- `src/jobs/tournament-discovery.ts`
- `src/jobs/player-updates.ts`
- `src/jobs/rankings-updater.ts`

---

### Phase 4: Rate Limiting & Optimization (Week 4)

**Goal:** Production-ready performance

- [ ] Implement outbound rate limiting (Bottleneck)
- [ ] Implement inbound rate limiting (express-rate-limit)
- [ ] Add response compression
- [ ] Optimize database queries with indexes
- [ ] Implement stale-while-revalidate
- [ ] Add batch request endpoints
- [ ] Connection pooling optimization

**Files to Modify:**
- `src/services/*.service.ts` (add Bottleneck)
- `src/index.ts` (add compression)
- `src/middleware/rate-limit.ts` (create)

---

### Phase 5: Monitoring & Admin Tools (Week 5)

**Goal:** Observability and control

- [ ] Enhanced health check endpoint
- [ ] Cache stats endpoint
- [ ] Job queue dashboard
- [ ] Manual cache invalidation endpoint
- [ ] Performance metrics logging
- [ ] Set up Sentry for error tracking
- [ ] Add admin authentication

**Files to Create:**
- `src/routes/health.ts`
- `src/routes/admin.ts`
- `src/middleware/auth.ts`

---

## Environment Variables

```bash
# .env
# Server
PORT=4000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@host:5432/chess_stats

# Redis
REDIS_URL=redis://host:6379

# External APIs
FIDE_API_URL=https://fide-api.vercel.app
LICHESS_API_URL=https://lichess.org/api
CHESS_COM_API_URL=https://api.chess.com/pub

# Caching
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=300

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Background Jobs
ENABLE_BACKGROUND_JOBS=true
TOURNAMENT_MONITOR_INTERVAL=2  # minutes
TOURNAMENT_DISCOVERY_INTERVAL=30  # minutes

# Monitoring
SENTRY_DSN=
LOG_LEVEL=info
```

---

## Summary

This architecture ensures:

✅ **Fast Response Times:**
- Cached: <10ms
- Database: 20-50ms
- API fetch: 500ms-1s

✅ **Minimal External API Usage:**
- Background jobs handle updates
- User requests hit cache 90%+ of time
- Rate limiting prevents overuse

✅ **Always Fresh Data:**
- Ongoing tournaments: Update every 2 min
- Top players: Update hourly
- Historical data: Permanent storage

✅ **Scalable & Reliable:**
- Multi-layer caching
- Connection pooling
- Error handling & retry logic
- Health monitoring

✅ **Cost Effective:**
- Efficient API usage
- Reduced bandwidth (compression)
- Optimized database queries

---

**Document Version:** 1.0
**Last Updated:** 2025-10-30
**Status:** Architecture Design Complete → Ready for Implementation
