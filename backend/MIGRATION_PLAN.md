# Backend Migration & Refactoring Plan

**Goal:** Migrate existing backend routes to properly utilize Prisma schema for storing data from external APIs (Chess.com, Lichess, FIDE) and serving data to the frontend.

---

## Current State

### Existing Structure
```
backend/src/
├── routes/
│   ├── tournaments.ts    # Basic tournament endpoints
│   ├── players.ts        # Basic player endpoints
│   └── index.ts          # Route aggregation
├── services/
│   ├── chesscom.ts       # Chess.com API client
│   ├── lichess.ts        # Lichess API client
│   └── fide.ts           # FIDE API client
└── index.ts              # Express app
```

### What Needs to Change
1. **No database integration** - Currently returns mock/API data directly
2. **No data normalization** - External API responses need mapping to Prisma schema
3. **No data persistence** - Nothing is stored in database
4. **Missing business logic layer** - Need repositories and services

---

## Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      EXTERNAL APIS                          │
│  Chess.com API  │  Lichess API  │  FIDE API                │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    API CLIENTS (src/clients/)               │
│  - ChessComClient  - LichessClient  - FideClient           │
│  - Handle API requests, rate limiting, error handling       │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                   MAPPERS (src/mappers/)                    │
│  - Map external API responses → Prisma schema models        │
│  - tournamentMapper.ts                                      │
│  - playerMapper.ts                                          │
│  - gameMapper.ts                                            │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                 REPOSITORIES (src/repositories/)            │
│  - Database access layer (Prisma queries)                   │
│  - tournamentRepository.ts                                  │
│  - playerRepository.ts                                      │
│  - gameRepository.ts                                        │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                   SERVICES (src/services/)                  │
│  - Business logic layer                                     │
│  - Orchestrate API clients + repositories                   │
│  - tournamentService.ts                                     │
│  - playerService.ts                                         │
│  - gameService.ts                                           │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    ROUTES (src/routes/)                     │
│  - HTTP endpoints                                           │
│  - Request validation                                       │
│  - Response formatting                                      │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                               │
└─────────────────────────────────────────────────────────────┘
```

---

## New Folder Structure

```
backend/src/
├── clients/                    # External API clients
│   ├── chesscom.client.ts      # Chess.com API wrapper
│   ├── lichess.client.ts       # Lichess API wrapper
│   └── fide.client.ts          # FIDE API wrapper
│
├── mappers/                    # API response → Prisma schema
│   ├── tournament.mapper.ts    # Map tournament data
│   ├── player.mapper.ts        # Map player data
│   ├── game.mapper.ts          # Map game data
│   └── types.ts                # Mapper interfaces
│
├── repositories/               # Database access layer
│   ├── tournament.repository.ts
│   ├── player.repository.ts
│   ├── game.repository.ts
│   ├── user.repository.ts
│   └── base.repository.ts      # Shared repository utilities
│
├── services/                   # Business logic
│   ├── tournament.service.ts   # Tournament operations
│   ├── player.service.ts       # Player operations
│   ├── game.service.ts         # Game operations
│   ├── sync.service.ts         # Background sync orchestration
│   └── cache.service.ts        # Redis caching
│
├── routes/                     # HTTP endpoints
│   ├── tournaments.routes.ts
│   ├── players.routes.ts
│   ├── games.routes.ts
│   ├── rankings.routes.ts
│   ├── forum.routes.ts
│   └── index.ts
│
├── middleware/
│   ├── auth.middleware.ts      # JWT authentication
│   ├── validation.middleware.ts # Request validation
│   └── error.middleware.ts     # Error handling
│
├── jobs/                       # Background jobs
│   ├── sync-tournaments.job.ts
│   ├── sync-players.job.ts
│   └── update-stats.job.ts
│
├── utils/
│   ├── prisma.ts               # Prisma client singleton
│   ├── logger.ts               # Winston logger
│   └── validators.ts           # Zod schemas
│
└── index.ts                    # Express app
```

---

## Migration Steps

### Phase 1: Setup Infrastructure (Priority: High)

**1.1 Create Prisma Client Singleton**
```typescript
// src/utils/prisma.ts
import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
```

**1.2 Create Base Repository**
```typescript
// src/repositories/base.repository.ts
import prisma from '../utils/prisma';

export abstract class BaseRepository {
  protected prisma = prisma;

  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
```

---

### Phase 2: Refactor Existing Routes (Priority: High)

Focus on these endpoints first (already exist):
- `GET /api/tournaments` - List tournaments
- `GET /api/tournaments/:id` - Get tournament details
- `GET /api/players` - List players
- `GET /api/players/:id` - Get player details

#### Example: Tournament Routes Refactor

**Before (current):**
```typescript
// routes/tournaments.ts
router.get('/', async (req, res) => {
  // Returns mock data or direct API response
  const tournaments = await chessComClient.getTournaments();
  res.json(tournaments);
});
```

**After (target):**
```typescript
// routes/tournaments.routes.ts
import { tournamentService } from '../services/tournament.service';

router.get('/', async (req, res, next) => {
  try {
    const { platform, status, timeControl, page = 1, limit = 20 } = req.query;

    const result = await tournamentService.findAll({
      platform,
      status,
      timeControl,
      page: Number(page),
      limit: Number(limit)
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const tournament = await tournamentService.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    res.json(tournament);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/standings', async (req, res, next) => {
  try {
    const standings = await tournamentService.getStandings(req.params.id);
    res.json(standings);
  } catch (error) {
    next(error);
  }
});
```

---

### Phase 3: Implement Data Layer (Priority: High)

#### 3.1 Tournament Repository
```typescript
// src/repositories/tournament.repository.ts
import { BaseRepository } from './base.repository';
import { Prisma, Tournament } from '@prisma/client';

export class TournamentRepository extends BaseRepository {
  async findAll(params: {
    platform?: string;
    status?: string;
    timeControl?: string;
    page: number;
    limit: number;
  }) {
    const { platform, status, timeControl, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.TournamentWhereInput = {
      ...(platform && { platform }),
      ...(status && { status }),
      ...(timeControl && { timeControl }),
    };

    const [tournaments, total] = await Promise.all([
      this.prisma.tournament.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'desc' },
        include: {
          series: true,
          _count: {
            select: { standings: true, games: true }
          }
        }
      }),
      this.prisma.tournament.count({ where })
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

  async findById(id: string) {
    return this.prisma.tournament.findUnique({
      where: { id },
      include: {
        series: true,
        stages: {
          orderBy: { stageNumber: 'asc' }
        },
        prizeDistribution: {
          orderBy: { placement: 'asc' }
        }
      }
    });
  }

  async findByExternalId(externalId: string, platform: string) {
    return this.prisma.tournament.findUnique({
      where: {
        tournaments_external_id_platform_key: {
          externalId,
          platform
        }
      }
    });
  }

  async create(data: Prisma.TournamentCreateInput) {
    return this.prisma.tournament.create({ data });
  }

  async update(id: string, data: Prisma.TournamentUpdateInput) {
    return this.prisma.tournament.update({
      where: { id },
      data
    });
  }

  async upsertByExternalId(
    externalId: string,
    platform: string,
    data: Prisma.TournamentCreateInput
  ) {
    return this.prisma.tournament.upsert({
      where: {
        tournaments_external_id_platform_key: {
          externalId,
          platform
        }
      },
      create: data,
      update: data
    });
  }

  async getStandings(tournamentId: string, stageId?: string) {
    return this.prisma.tournamentStanding.findMany({
      where: {
        tournamentId,
        ...(stageId && { stageId })
      },
      orderBy: [
        { placement: 'asc' }
      ],
      include: {
        player: {
          select: {
            id: true,
            fullName: true,
            profileUrl: true,
            title: true,
            countryIso: true,
            avatarUrl: true
          }
        }
      }
    });
  }
}

export const tournamentRepository = new TournamentRepository();
```

#### 3.2 Player Repository
```typescript
// src/repositories/player.repository.ts
import { BaseRepository } from './base.repository';
import { Prisma } from '@prisma/client';

export class PlayerRepository extends BaseRepository {
  async findAll(params: {
    title?: string;
    country?: string;
    search?: string;
    page: number;
    limit: number;
  }) {
    const { title, country, search, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.PlayerWhereInput = {
      deleted: false,
      ...(title && { title }),
      ...(country && { countryIso: country }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { profileUrl: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [players, total] = await Promise.all([
      this.prisma.player.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fideClassicalRating: 'desc' }
      }),
      this.prisma.player.count({ where })
    ]);

    return {
      data: players,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findById(id: string) {
    return this.prisma.player.findUnique({
      where: { id },
      include: {
        statistics: true,
        accounts: {
          where: { deleted: false }
        }
      }
    });
  }

  async findByProfileUrl(profileUrl: string) {
    return this.prisma.player.findUnique({
      where: { profileUrl },
      include: {
        statistics: true
      }
    });
  }

  async findByFideId(fideId: string) {
    return this.prisma.player.findUnique({
      where: { fideId }
    });
  }

  async create(data: Prisma.PlayerCreateInput) {
    return this.prisma.player.create({ data });
  }

  async update(id: string, data: Prisma.PlayerUpdateInput) {
    return this.prisma.player.update({
      where: { id },
      data
    });
  }

  async getTournamentHistory(playerId: string, limit = 20) {
    return this.prisma.tournamentStanding.findMany({
      where: { playerId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            platform: true,
            timeControl: true,
            startDate: true
          }
        }
      }
    });
  }
}

export const playerRepository = new PlayerRepository();
```

---

### Phase 4: Implement Mappers (Priority: High)

Map external API responses to Prisma schema format.

#### Example: Chess.com Tournament Mapper
```typescript
// src/mappers/tournament.mapper.ts
import { Prisma } from '@prisma/client';

interface ChessComTournament {
  url: string;
  name: string;
  status: string;
  settings: {
    type: string;
    rules: string;
    time_control: string;
    time_class: string;
  };
  start_time: number;
  end_time?: number;
  players?: any[];
}

export class TournamentMapper {
  static fromChessCom(
    data: ChessComTournament
  ): Prisma.TournamentCreateInput {
    const externalId = this.extractIdFromUrl(data.url);

    return {
      externalId,
      platform: 'chess-com',
      name: data.name,
      slug: this.generateSlug(data.name),
      status: this.mapStatus(data.status),
      primaryFormat: this.mapFormat(data.settings.type),
      timeControl: this.mapTimeControl(data.settings.time_class),
      startDate: new Date(data.start_time * 1000),
      endDate: data.end_time ? new Date(data.end_time * 1000) : undefined,
      participantCount: data.players?.length,
      isOnline: true,
      isRated: true,
      officialUrl: data.url
    };
  }

  static fromLichess(data: any): Prisma.TournamentCreateInput {
    return {
      externalId: data.id,
      platform: 'lichess',
      name: data.fullName || data.name,
      slug: this.generateSlug(data.fullName || data.name),
      status: this.mapLichessStatus(data.status),
      primaryFormat: data.variant === 'swiss' ? 'swiss' : 'arena',
      timeControl: this.mapLichessTimeControl(data.clock),
      startDate: new Date(data.startsAt),
      endDate: data.finishesAt ? new Date(data.finishesAt) : undefined,
      participantCount: data.nbPlayers,
      isOnline: true,
      isRated: true,
      officialUrl: `https://lichess.org/tournament/${data.id}`
    };
  }

  private static extractIdFromUrl(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 1];
  }

  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private static mapStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'in_progress': 'ongoing',
      'finished': 'completed',
      'registration': 'upcoming'
    };
    return statusMap[status] || status;
  }

  private static mapFormat(type: string): string {
    const formatMap: Record<string, string> = {
      'daily': 'swiss',
      'live': 'swiss',
      'knockout': 'knockout'
    };
    return formatMap[type] || 'swiss';
  }

  private static mapTimeControl(timeClass: string): string {
    const timeControlMap: Record<string, string> = {
      'bullet': 'bullet',
      'blitz': 'blitz',
      'rapid': 'rapid',
      'daily': 'classical'
    };
    return timeControlMap[timeClass] || timeClass;
  }

  private static mapLichessStatus(status: number): string {
    if (status === 10) return 'upcoming';
    if (status === 20) return 'ongoing';
    if (status === 30) return 'completed';
    return 'upcoming';
  }

  private static mapLichessTimeControl(clock: any): string {
    if (!clock) return 'blitz';
    const totalSeconds = clock.limit + (clock.increment * 40);
    if (totalSeconds < 180) return 'bullet';
    if (totalSeconds < 600) return 'blitz';
    if (totalSeconds < 1500) return 'rapid';
    return 'classical';
  }
}
```

#### Player Mapper
```typescript
// src/mappers/player.mapper.ts
import { Prisma } from '@prisma/client';

export class PlayerMapper {
  static fromFide(data: any): Prisma.PlayerCreateInput {
    return {
      fideId: data.fide_id?.toString(),
      fullName: data.name,
      profileUrl: this.generateProfileUrl(data.name),
      title: data.title || undefined,
      countryFide: data.federation,
      countryIso: this.mapCountryCode(data.federation),
      fideClassicalRating: data.standard_rating,
      fideRapidRating: data.rapid_rating,
      fideBlitzRating: data.blitz_rating,
      dateOfBirth: data.birth_year ? new Date(data.birth_year, 0, 1) : undefined
    };
  }

  static fromChessCom(data: any): Prisma.PlayerCreateInput {
    return {
      chessComId: data.username,
      fullName: data.name || data.username,
      profileUrl: this.generateProfileUrl(data.name || data.username),
      title: data.title,
      countryIso: data.country?.split('/').pop(),
      avatarUrl: data.avatar,
      chessComBlitzRating: data.stats?.chess_blitz?.last?.rating,
      chessComRapidRating: data.stats?.chess_rapid?.last?.rating,
      chessComBulletRating: data.stats?.chess_bullet?.last?.rating
    };
  }

  private static generateProfileUrl(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private static mapCountryCode(fideCode: string): string {
    // Map FIDE 3-letter codes to ISO 2-letter codes
    const countryMap: Record<string, string> = {
      'NOR': 'NO',
      'USA': 'US',
      'RUS': 'RU',
      'CHN': 'CN',
      'IND': 'IN',
      // Add more mappings as needed
    };
    return countryMap[fideCode] || fideCode.substring(0, 2);
  }
}
```

---

### Phase 5: Implement Services (Priority: High)

Business logic layer that orchestrates API clients and repositories.

```typescript
// src/services/tournament.service.ts
import { tournamentRepository } from '../repositories/tournament.repository';
import { ChessComClient } from '../clients/chesscom.client';
import { LichessClient } from '../clients/lichess.client';
import { TournamentMapper } from '../mappers/tournament.mapper';

class TournamentService {
  private chessComClient = new ChessComClient();
  private lichessClient = new LichessClient();

  /**
   * Get tournaments from database with filtering and pagination
   */
  async findAll(params: {
    platform?: string;
    status?: string;
    timeControl?: string;
    page: number;
    limit: number;
  }) {
    return tournamentRepository.findAll(params);
  }

  /**
   * Get tournament by ID from database
   */
  async findById(id: string) {
    return tournamentRepository.findById(id);
  }

  /**
   * Get tournament standings
   */
  async getStandings(tournamentId: string, stageId?: string) {
    return tournamentRepository.getStandings(tournamentId, stageId);
  }

  /**
   * Sync tournament from external API to database
   */
  async syncFromExternal(externalId: string, platform: string) {
    let tournamentData;

    // Fetch from appropriate API
    if (platform === 'chess-com') {
      const apiData = await this.chessComClient.getTournament(externalId);
      tournamentData = TournamentMapper.fromChessCom(apiData);
    } else if (platform === 'lichess') {
      const apiData = await this.lichessClient.getTournament(externalId);
      tournamentData = TournamentMapper.fromLichess(apiData);
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    // Upsert to database
    return tournamentRepository.upsertByExternalId(
      externalId,
      platform,
      tournamentData
    );
  }

  /**
   * Sync multiple tournaments (for background jobs)
   */
  async syncMultiple(tournaments: Array<{ externalId: string; platform: string }>) {
    const results = await Promise.allSettled(
      tournaments.map(t => this.syncFromExternal(t.externalId, t.platform))
    );

    return {
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length
    };
  }
}

export const tournamentService = new TournamentService();
```

---

### Phase 6: Background Sync Jobs (Priority: Medium)

Implement scheduled jobs to keep database in sync with external APIs.

```typescript
// src/jobs/sync-tournaments.job.ts
import { tournamentService } from '../services/tournament.service';
import { chessComClient } from '../clients/chesscom.client';
import prisma from '../utils/prisma';

export async function syncTitledTuesday() {
  console.log('Starting Titled Tuesday sync...');

  const syncJob = await prisma.syncJob.create({
    data: {
      jobType: 'sync_tournament',
      platform: 'chess-com',
      targetId: 'titled-tuesday',
      status: 'running',
      startedAt: new Date()
    }
  });

  try {
    // Get recent Titled Tuesday tournaments from Chess.com
    const tournaments = await chessComClient.getTitledTuesdayTournaments();

    // Sync each tournament
    const results = await tournamentService.syncMultiple(
      tournaments.map(t => ({
        externalId: t.url.split('/').pop()!,
        platform: 'chess-com'
      }))
    );

    // Update sync job
    await prisma.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        itemsProcessed: tournaments.length,
        itemsCreated: results.successful,
        itemsFailed: results.failed
      }
    });

    console.log(`Titled Tuesday sync completed: ${results.successful} successful, ${results.failed} failed`);
  } catch (error) {
    await prisma.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status: 'failed',
        completedAt: new Date(),
        errorMessage: error.message
      }
    });

    console.error('Titled Tuesday sync failed:', error);
  }
}
```

---

## API Endpoint Reference

### Tournaments
- `GET /api/tournaments` - List tournaments (paginated, filtered)
- `GET /api/tournaments/:id` - Get tournament details
- `GET /api/tournaments/:id/standings` - Get tournament standings
- `GET /api/tournaments/:id/games` - Get tournament games
- `GET /api/tournaments/featured` - Get featured tournaments
- `POST /api/tournaments/sync` - Trigger manual sync (admin only)

### Players
- `GET /api/players` - List players (paginated, filtered)
- `GET /api/players/:id` - Get player details
- `GET /api/players/:id/tournaments` - Get player tournament history
- `GET /api/players/:id/stats` - Get player statistics
- `GET /api/players/:id/games` - Get player games

### Rankings
- `GET /api/rankings/:type` - Get rankings (fide-classical, chess-com-blitz, etc.)

### Games
- `GET /api/games/:id` - Get game details
- `GET /api/games/:id/pgn` - Get game PGN

---

## Data Flow Examples

### Example 1: User Requests Tournament List

```
1. Frontend: GET /api/tournaments?platform=chess-com&status=ongoing
2. Route: Validates request, calls service
3. Service: Calls repository with filters
4. Repository: Queries Prisma with WHERE clause
5. Prisma: Executes SQL query
6. Database: Returns tournament rows
7. Repository: Returns typed Tournament[]
8. Service: Returns paginated response
9. Route: Sends JSON response
10. Frontend: Displays tournaments
```

### Example 2: Background Job Syncs New Tournament

```
1. Cron Job: Triggers every Tuesday at 11 PM
2. Sync Job: Calls Chess.com API
3. Chess.com API: Returns tournament data
4. Mapper: Converts API response → Prisma schema
5. Repository: Upserts tournament to DB
6. Service: Syncs standings and games
7. Database: Stores all tournament data
8. Job: Logs completion in sync_jobs table
```

---

## Migration Checklist

### Phase 1: Infrastructure ✅
- [ ] Create Prisma client singleton
- [ ] Create base repository class
- [ ] Set up error handling middleware
- [ ] Set up logging

### Phase 2: Core Repositories
- [ ] TournamentRepository
- [ ] PlayerRepository
- [ ] GameRepository
- [ ] UserRepository (for auth later)

### Phase 3: Mappers
- [ ] Tournament mappers (Chess.com, Lichess, FIDE)
- [ ] Player mappers (Chess.com, Lichess, FIDE)
- [ ] Game mappers
- [ ] Standing mappers

### Phase 4: Services
- [ ] TournamentService
- [ ] PlayerService
- [ ] GameService
- [ ] SyncService

### Phase 5: Routes Refactor
- [ ] Refactor GET /api/tournaments
- [ ] Refactor GET /api/tournaments/:id
- [ ] Refactor GET /api/players
- [ ] Refactor GET /api/players/:id
- [ ] Add new endpoints (standings, games, etc.)

### Phase 6: Background Jobs
- [ ] Titled Tuesday sync job
- [ ] Player rating updates
- [ ] Statistics aggregation

### Phase 7: Testing
- [ ] Test repository queries
- [ ] Test service logic
- [ ] Test route responses
- [ ] Test data mapping

---

## Notes

- **Start with READ operations first** - Get data flowing from DB to frontend
- **Then implement WRITE operations** - Background jobs to populate DB
- **Use transactions for complex operations** - Ensure data consistency
- **Cache aggressively** - Use Redis for frequently accessed data
- **Monitor performance** - Add logging and metrics
- **Error handling** - Graceful degradation if APIs are down

---

## Success Criteria

✅ Frontend can fetch tournaments from database
✅ Frontend can fetch player details from database
✅ Background jobs successfully sync data from APIs
✅ All data properly normalized to Prisma schema
✅ API responses follow consistent format
✅ Error handling works correctly
✅ Database queries are optimized with proper indexes
