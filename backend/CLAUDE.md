# Backend Implementation Guide - Chess Stats Platform

A comprehensive backend API and data pipeline for aggregating chess tournament data from Chess.com, Lichess, and FIDE.

## Overview

**Goal:** Build a unified backend that aggregates tournament data from multiple sources, normalizes it, and serves it via REST API to the Next.js frontend.

**Strategy:** Leverage existing open-source repos and APIs rather than building everything from scratch.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│           EXTERNAL DATA SOURCES                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  📁 GitHub Historical Data Repos                │
│  ├─ cmgchess/Titled-Tuesday-Data (2014-2025)   │
│  └─ lichess-org/database (monthly PGN dumps)   │
│                                                 │
│  🌐 Live APIs                                   │
│  ├─ fide-api.vercel.app (FIDE ratings/players) │
│  ├─ lichess.org/api (tournaments & games)      │
│  └─ api.chess.com/pub (Chess.com data)         │
│                                                 │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │   Data Scrapers      │
         │   - ChessComService  │
         │   - LichessService   │
         │   - FideService      │
         └─────────┬────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │   BullMQ Jobs        │
         │   (Scheduled Tasks)  │
         └─────────┬────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │   Data Processing    │
         │   (Normalization)    │
         └─────────┬────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │   PostgreSQL         │
         │   (Single Source of  │
         │    Truth)            │
         └─────────┬────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │   Redis Cache        │
         │   (Performance)      │
         └─────────┬────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │   Express REST API   │
         │   (Backend Server)   │
         └─────────┬────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │   Next.js Frontend   │
         └─────────────────────┘
```

---

## Tech Stack

### Core Technologies

**Runtime & Framework:**
- **Node.js** (v20+) with TypeScript
- **Express.js** - REST API server
- **Why:** Consistency with frontend, excellent async support, huge ecosystem

**Database:**
- **PostgreSQL** (v15+) - Primary database
  - Relational data (tournaments, players, games)
  - JSONB for flexible metadata
  - Full-text search
  - TimescaleDB extension (future) for time-series rating data
- **Redis** - Caching and job queue
  - API response caching
  - Rate limiting
  - Session storage (future)
  - BullMQ job queue backend

**ORM/Query Builder:**
- **Prisma** - Type-safe database client
  - Auto-generated TypeScript types
  - Migration management
  - Excellent DX
  - Alternative: Drizzle ORM (more SQL control)

**Job Queue:**
- **BullMQ** - Redis-based job queue
  - Scheduled data scraping
  - Background processing
  - Retry logic
  - Job monitoring

**Additional Libraries:**
- **chess.js** - Chess move validation and PGN parsing
- **chess-web-api** - Chess.com API wrapper (npm)
- **bottleneck** - Rate limiting
- **zod** - Runtime type validation
- **winston** - Logging

---

## Data Sources & APIs

### 1. Chess.com PubAPI

**Base URL:** `https://api.chess.com/pub/`
**Authentication:** None required (public API)
**Rate Limits:** Max 2 concurrent requests (429 error if exceeded)
**Data Refresh:** Once per 24 hours max

#### Key Endpoints

```bash
# Player endpoints
GET /pub/player/{username}                    # Profile
GET /pub/player/{username}/stats              # All ratings & stats
GET /pub/player/{username}/games/archives     # Monthly archive URLs
GET /pub/player/{username}/games/{YYYY}/{MM}  # Games for month (PGN)
GET /pub/player/{username}/tournaments        # Tournament history

# Tournament endpoints
GET /pub/tournament/{url-id}                  # Tournament details
GET /pub/tournament/{url-id}/{round}          # Round details
GET /pub/tournament/{url-id}/{round}/{group}  # Group details

# Other
GET /pub/titled/{title}                       # All titled players (GM, IM, etc.)
GET /pub/leaderboards                         # Current leaderboards
GET /pub/puzzle                               # Daily puzzle
```

#### Usage with chess-web-api

```typescript
import { ChessWebAPI } from 'chess-web-api';

const api = new ChessWebAPI({
  queue: true, // Enable automatic rate limiting
  headers: {
    'Accept-Encoding': 'gzip' // Save 80% bandwidth
  }
});

// Get player
const player = await api.getPlayer('hikaru');

// Get player stats
const stats = await api.getPlayerStats('hikaru');

// Get tournament
const tournament = await api.getTournament('titled-tuesday-blitz-early-december-19-2023');
```

#### Challenges & Solutions

**Problem:** Historical Titled Tuesday data hard to access (only ~7 pages visible on website)
**Solution:** Use `cmgchess/Titled-Tuesday-Data` GitHub repo for 2014-2025 historical data

**Problem:** Rate limit of 2 concurrent requests
**Solution:** Use Bottleneck or chess-web-api's built-in queue

---

### 2. Lichess API

**Base URL:** `https://lichess.org/api/`
**Authentication:** Optional (OAuth2/Personal Access Token for write operations)
**Rate Limits:** 429 status = wait 1 full minute
**Data Format:** JSON and ND-JSON (streaming)

#### Key Endpoints

```bash
# Tournament endpoints
GET /api/tournament                          # Current tournaments
GET /api/tournament/{id}                     # Tournament info
GET /api/tournament/{id}/games               # Games (ND-JSON stream)
GET /api/tournament/{id}/results             # Final results
GET /api/swiss/{id}                          # Swiss tournament info
GET /api/swiss/{id}/results                  # Swiss results

# Player endpoints
GET /api/user/{username}                     # Player profile
GET /api/user/{username}/perf/{perf}        # Performance stats
GET /api/user/{username}/activity            # Activity history
GET /api/games/user/{username}               # Player's games (ND-JSON)

# Rankings
GET /api/player                              # Top 10 per category
GET /api/player/top/{nb}/{perfType}         # Leaderboard
```

#### Handling ND-JSON Streams

```typescript
async function fetchLichessGames(tournamentId: string) {
  const response = await fetch(
    `https://lichess.org/api/tournament/${tournamentId}/games?moves=true&pgnInJson=true`
  );

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  const games: any[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(Boolean);

    for (const line of lines) {
      games.push(JSON.parse(line));
    }
  }

  return games;
}
```

#### Advantages

- ✅ Excellent, well-documented API
- ✅ No authentication needed for public data
- ✅ Generous rate limits
- ✅ Real-time tournament data
- ✅ Complete game history available

---

### 3. FIDE API (Community-Built)

**Deployed API:** `https://fide-api.vercel.app`
**Source:** `cassiofb-dev/fide-api` (FastAPI + BeautifulSoup scraper)
**Authentication:** None required
**Docs:** `https://fide-api.vercel.app/docs`

#### Available Endpoints

```bash
# Top players
GET /top                                     # Top players list

# Player information
GET /player/{fide_id}                        # Player profile & ratings

# Player history
GET /history/{fide_id}                       # Rating history over time
```

#### Usage Example

```typescript
const FIDE_API_BASE = 'https://fide-api.vercel.app';

// Get Magnus Carlsen's data
const magnus = await fetch(`${FIDE_API_BASE}/player/1503014`).then(r => r.json());
// Returns: { name, title, federation, standard_rating, rapid_rating, blitz_rating }

// Get top players
const topPlayers = await fetch(`${FIDE_API_BASE}/top`).then(r => r.json());

// Get rating history
const history = await fetch(`${FIDE_API_BASE}/history/1503014`).then(r => r.json());
```

#### Why Use This?

- ✅ FIDE has no official API
- ✅ This is already built and deployed
- ✅ Active maintenance
- ✅ Can self-host if needed (Docker available)
- ✅ Saves us from building FIDE scraper from scratch

---

### 4. Historical Data Repositories

#### Titled Tuesday Historical Data

**Repo:** `https://github.com/cmgchess/Titled-Tuesday-Data`
**Coverage:** 2014-2025 (complete history)
**Update Frequency:** Automated via GitHub Actions
**Format:** Organized by year in `/details/` directory
**License:** Unlicense (public domain)

**Directory Structure:**
```
Titled-Tuesday-Data/
├── details/
│   ├── 2014/
│   ├── 2015/
│   ├── ...
│   └── 2025/
├── ranks/
└── scrapers/
```

**How to Use:**

```typescript
// Fetch via GitHub API
async function fetchTitledTuesdayData(year: string) {
  const url = `https://api.github.com/repos/cmgchess/Titled-Tuesday-Data/contents/details/${year}`;
  const response = await fetch(url);
  const files = await response.json();

  for (const file of files) {
    const content = await fetch(file.download_url).then(r => r.text());
    // Parse CSV/JSON and import to database
  }
}
```

#### Lichess Game Database

**Source:** `https://database.lichess.org`
**Repo:** `lichess-org/database`
**Format:** Monthly PGN dumps (zstd compressed)
**Coverage:** All rated games

**Note:** This contains ALL games (millions), not just tournaments. We can filter by tournament tags in PGN metadata.

```bash
# Download monthly dump
wget https://database.lichess.org/standard/lichess_db_standard_rated_2024-12.pgn.zst

# Decompress
zstd -d lichess_db_standard_rated_2024-12.pgn.zst
```

**Use Case:** For deep historical analysis or if we want complete game archives. Not needed for MVP.

---

## Database Schema

### Core Tables

```sql
-- tournaments table
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(255) UNIQUE NOT NULL,    -- ID from source platform
  name VARCHAR(500) NOT NULL,
  platform VARCHAR(50) NOT NULL,               -- chess-com, lichess, fide
  format VARCHAR(50) NOT NULL,                 -- swiss, knockout, arena, round-robin
  status VARCHAR(50) NOT NULL,                 -- upcoming, ongoing, completed
  time_control VARCHAR(50) NOT NULL,           -- bullet, blitz, rapid, classical

  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,

  prize_pool DECIMAL(10,2),
  prize_currency VARCHAR(10),
  participant_count INTEGER,
  rounds INTEGER,

  location VARCHAR(255),                       -- For OTB tournaments
  official_url TEXT,
  broadcast_url TEXT,
  thumbnail_url TEXT,
  description TEXT,

  featured BOOLEAN DEFAULT false,

  metadata JSONB,                              -- Platform-specific data

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_tournaments_platform (platform),
  INDEX idx_tournaments_status (status),
  INDEX idx_tournaments_dates (start_date, end_date),
  INDEX idx_tournaments_featured (featured),
  INDEX idx_tournaments_external_id (external_id)
);

-- players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  title VARCHAR(10),                           -- GM, IM, FM, WGM, etc.
  country VARCHAR(3),                          -- ISO country code
  avatar_url TEXT,
  bio TEXT,
  date_of_birth DATE,

  -- External platform IDs
  fide_id VARCHAR(50) UNIQUE,
  chess_com_username VARCHAR(255),
  lichess_username VARCHAR(255),

  -- Current ratings
  fide_classical_rating INTEGER,
  fide_rapid_rating INTEGER,
  fide_blitz_rating INTEGER,

  chess_com_bullet_rating INTEGER,
  chess_com_blitz_rating INTEGER,
  chess_com_rapid_rating INTEGER,
  chess_com_daily_rating INTEGER,

  lichess_bullet_rating INTEGER,
  lichess_blitz_rating INTEGER,
  lichess_rapid_rating INTEGER,
  lichess_classical_rating INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_players_username (username),
  INDEX idx_players_fide_id (fide_id),
  INDEX idx_players_country (country),
  INDEX idx_players_title (title)
);

-- tournament_standings table
CREATE TABLE tournament_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),

  rank INTEGER NOT NULL,
  score DECIMAL(4,1) NOT NULL,
  rating INTEGER,
  performance_rating INTEGER,
  buchholz_score DECIMAL(5,1),

  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  white_games INTEGER,
  black_games INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tournament_id, player_id),
  INDEX idx_standings_tournament (tournament_id),
  INDEX idx_standings_rank (tournament_id, rank),
  INDEX idx_standings_player (player_id)
);

-- games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(255),                    -- Game ID from platform
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,

  round_number INTEGER NOT NULL,
  board_number INTEGER,

  white_player_id UUID REFERENCES players(id),
  black_player_id UUID REFERENCES players(id),

  result VARCHAR(10),                          -- 1-0, 0-1, 1/2-1/2

  opening VARCHAR(255),
  opening_eco VARCHAR(10),                     -- ECO code (e.g., E60)

  moves TEXT,                                  -- PGN moves
  pgn_url TEXT,
  analysis_url TEXT,

  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,

  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_games_tournament (tournament_id),
  INDEX idx_games_round (tournament_id, round_number),
  INDEX idx_games_players (white_player_id, black_player_id),
  INDEX idx_games_external_id (external_id)
);

-- player_stats table (aggregated/calculated stats)
CREATE TABLE player_stats (
  player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,

  tournaments_played INTEGER DEFAULT 0,
  total_games INTEGER DEFAULT 0,

  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2),

  average_placement DECIMAL(5,2),
  best_performance_rating INTEGER,

  best_tournament_id UUID REFERENCES tournaments(id),
  best_tournament_rank INTEGER,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- scraper_jobs table (track scraping operations)
CREATE TABLE scraper_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type VARCHAR(100) NOT NULL,              -- 'tournament', 'player', 'games'
  platform VARCHAR(50) NOT NULL,
  target_id VARCHAR(255),                      -- Tournament/player ID being scraped

  status VARCHAR(50) NOT NULL,                 -- pending, running, completed, failed
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  error_message TEXT,
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_scraper_jobs_status (status),
  INDEX idx_scraper_jobs_platform (platform),
  INDEX idx_scraper_jobs_created (created_at)
);

-- raw_data table (store raw API responses)
CREATE TABLE raw_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(50) NOT NULL,                 -- chess-com, lichess, fide-api
  data_type VARCHAR(50) NOT NULL,              -- tournament, player, games
  source_id VARCHAR(255) NOT NULL,             -- ID from source

  data JSONB NOT NULL,                         -- Raw API response

  fetched_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_raw_data_source (source, data_type),
  INDEX idx_raw_data_source_id (source_id)
);
```

### Prisma Schema (Alternative)

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Tournament {
  id               String   @id @default(uuid())
  externalId       String   @unique @map("external_id")
  name             String
  platform         String
  format           String
  status           String
  timeControl      String   @map("time_control")

  startDate        DateTime @map("start_date")
  endDate          DateTime? @map("end_date")

  prizePool        Decimal? @map("prize_pool") @db.Decimal(10, 2)
  prizeCurrency    String?  @map("prize_currency")
  participantCount Int      @map("participant_count")
  rounds           Int?

  location         String?
  officialUrl      String?  @map("official_url")
  broadcastUrl     String?  @map("broadcast_url")
  thumbnailUrl     String?  @map("thumbnail_url")
  description      String?

  featured         Boolean  @default(false)
  metadata         Json?

  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  standings        TournamentStanding[]
  games            Game[]

  @@index([platform])
  @@index([status])
  @@index([startDate, endDate])
  @@map("tournaments")
}

model Player {
  id                    String   @id @default(uuid())
  username              String   @unique
  fullName              String?  @map("full_name")
  title                 String?
  country               String
  avatarUrl             String?  @map("avatar_url")
  bio                   String?
  dateOfBirth           DateTime? @map("date_of_birth")

  fideId                String?  @unique @map("fide_id")
  chessComUsername      String?  @map("chess_com_username")
  lichessUsername       String?  @map("lichess_username")

  fideClassicalRating   Int?     @map("fide_classical_rating")
  fideRapidRating       Int?     @map("fide_rapid_rating")
  fideBlitzRating       Int?     @map("fide_blitz_rating")

  chessComBulletRating  Int?     @map("chess_com_bullet_rating")
  chessComBlitzRating   Int?     @map("chess_com_blitz_rating")
  chessComRapidRating   Int?     @map("chess_com_rapid_rating")
  chessComDailyRating   Int?     @map("chess_com_daily_rating")

  lichessBulletRating   Int?     @map("lichess_bullet_rating")
  lichessBlitzRating    Int?     @map("lichess_blitz_rating")
  lichessRapidRating    Int?     @map("lichess_rapid_rating")
  lichessClassicalRating Int?    @map("lichess_classical_rating")

  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")

  standings             TournamentStanding[]
  whiteGames            Game[]   @relation("WhitePlayer")
  blackGames            Game[]   @relation("BlackPlayer")
  stats                 PlayerStats?

  @@index([username])
  @@index([fideId])
  @@index([country])
  @@map("players")
}

model TournamentStanding {
  id                 String   @id @default(uuid())
  tournamentId       String   @map("tournament_id")
  playerId           String   @map("player_id")

  rank               Int
  score              Decimal  @db.Decimal(4, 1)
  rating             Int?
  performanceRating  Int?     @map("performance_rating")
  buchholzScore      Decimal? @map("buchholz_score") @db.Decimal(5, 1)

  wins               Int      @default(0)
  draws              Int      @default(0)
  losses             Int      @default(0)
  gamesPlayed        Int      @default(0) @map("games_played")
  whiteGames         Int?     @map("white_games")
  blackGames         Int?     @map("black_games")

  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")

  tournament         Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  player             Player   @relation(fields: [playerId], references: [id])

  @@unique([tournamentId, playerId])
  @@index([tournamentId])
  @@index([rank])
  @@map("tournament_standings")
}

model Game {
  id               String   @id @default(uuid())
  externalId       String?  @map("external_id")
  tournamentId     String   @map("tournament_id")

  roundNumber      Int      @map("round_number")
  boardNumber      Int?     @map("board_number")

  whitePlayerId    String   @map("white_player_id")
  blackPlayerId    String   @map("black_player_id")

  result           String?

  opening          String?
  openingEco       String?  @map("opening_eco")

  moves            String?
  pgnUrl           String?  @map("pgn_url")
  analysisUrl      String?  @map("analysis_url")

  startTime        DateTime? @map("start_time")
  endTime          DateTime? @map("end_time")

  metadata         Json?

  createdAt        DateTime @default(now()) @map("created_at")

  tournament       Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  whitePlayer      Player   @relation("WhitePlayer", fields: [whitePlayerId], references: [id])
  blackPlayer      Player   @relation("BlackPlayer", fields: [blackPlayerId], references: [id])

  @@index([tournamentId])
  @@index([roundNumber])
  @@map("games")
}

model PlayerStats {
  playerId              String   @id @map("player_id")

  tournamentsPlayed     Int      @default(0) @map("tournaments_played")
  totalGames            Int      @default(0) @map("total_games")

  wins                  Int      @default(0)
  draws                 Int      @default(0)
  losses                Int      @default(0)
  winRate               Decimal  @default(0) @map("win_rate") @db.Decimal(5, 2)

  averagePlacement      Decimal? @map("average_placement") @db.Decimal(5, 2)
  bestPerformanceRating Int?     @map("best_performance_rating")

  bestTournamentId      String?  @map("best_tournament_id")
  bestTournamentRank    Int?     @map("best_tournament_rank")

  updatedAt             DateTime @updatedAt @map("updated_at")

  player                Player   @relation(fields: [playerId], references: [id], onDelete: Cascade)

  @@map("player_stats")
}
```

---

## API Design

### RESTful Endpoints

```typescript
// Base URL: http://localhost:4000/api

// ============================================================================
// Tournaments
// ============================================================================

GET    /api/tournaments
  Query params:
    - platform?: 'chess-com' | 'lichess' | 'fide'
    - format?: 'swiss' | 'knockout' | 'arena' | 'round-robin'
    - status?: 'upcoming' | 'ongoing' | 'completed'
    - timeControl?: 'bullet' | 'blitz' | 'rapid' | 'classical'
    - startDate?: ISO date string
    - endDate?: ISO date string
    - search?: string
    - page?: number (default: 1)
    - limit?: number (default: 20)
  Response: {
    data: Tournament[],
    pagination: {
      page: number,
      limit: number,
      total: number,
      totalPages: number
    }
  }

GET    /api/tournaments/:id
  Response: Tournament

GET    /api/tournaments/:id/standings
  Response: TournamentStanding[]

GET    /api/tournaments/:id/games
  Query params:
    - round?: number
    - playerId?: string
  Response: Game[]

GET    /api/tournaments/featured
  Response: Tournament[] (featured tournaments)

// ============================================================================
// Players
// ============================================================================

GET    /api/players
  Query params:
    - title?: 'GM' | 'IM' | 'FM' | 'WGM' | etc.
    - country?: ISO country code
    - search?: string
    - page?: number
    - limit?: number
  Response: {
    data: Player[],
    pagination: { ... }
  }

GET    /api/players/:id
  Response: Player

GET    /api/players/:id/tournaments
  Query params:
    - page?: number
    - limit?: number
  Response: {
    data: PlayerTournamentResult[],
    pagination: { ... }
  }

GET    /api/players/:id/stats
  Response: PlayerStats

GET    /api/players/:id/games
  Query params:
    - tournamentId?: string
    - page?: number
    - limit?: number
  Response: {
    data: Game[],
    pagination: { ... }
  }

// ============================================================================
// Rankings
// ============================================================================

GET    /api/rankings/:type
  Params:
    - type: 'fide-classical' | 'fide-rapid' | 'fide-blitz' |
            'chess-com-bullet' | 'chess-com-blitz' | 'chess-com-rapid' |
            'lichess-bullet' | 'lichess-blitz' | 'lichess-rapid'
  Query params:
    - limit?: number (default: 100)
  Response: {
    type: string,
    updatedAt: string,
    rankings: Array<{
      rank: number,
      playerId: string,
      playerName: string,
      rating: number,
      country: string,
      title: string
    }>
  }

// ============================================================================
// Search
// ============================================================================

GET    /api/search
  Query params:
    - q: string (search query)
    - type?: 'tournaments' | 'players' | 'all'
    - limit?: number
  Response: {
    tournaments: Tournament[],
    players: Player[]
  }

// ============================================================================
// Stats (Future)
// ============================================================================

GET    /api/stats/overview
  Response: Platform-wide statistics

GET    /api/stats/trending
  Response: Trending players and tournaments
```

---

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts          # Database connection
│   │   ├── redis.ts             # Redis connection
│   │   └── env.ts               # Environment variables
│   │
│   ├── routes/
│   │   ├── tournaments.ts       # Tournament endpoints
│   │   ├── players.ts           # Player endpoints
│   │   ├── rankings.ts          # Rankings endpoints
│   │   └── search.ts            # Search endpoints
│   │
│   ├── services/
│   │   ├── chesscom.service.ts  # Chess.com API client
│   │   ├── lichess.service.ts   # Lichess API client
│   │   ├── fide.service.ts      # FIDE API client
│   │   ├── cache.service.ts     # Redis caching
│   │   └── tournament.service.ts # Business logic
│   │
│   ├── repositories/
│   │   ├── tournament.repository.ts
│   │   ├── player.repository.ts
│   │   └── game.repository.ts
│   │
│   ├── jobs/
│   │   ├── queue.ts             # BullMQ setup
│   │   ├── workers.ts           # Job processors
│   │   └── schedulers.ts        # Scheduled jobs
│   │
│   ├── scrapers/
│   │   ├── titled-tuesday.scraper.ts
│   │   ├── lichess-arena.scraper.ts
│   │   └── base.scraper.ts
│   │
│   ├── utils/
│   │   ├── rate-limiter.ts      # Rate limiting
│   │   ├── logger.ts            # Winston logger
│   │   └── validators.ts        # Zod schemas
│   │
│   ├── types/
│   │   └── index.ts             # Shared TypeScript types
│   │
│   ├── middleware/
│   │   ├── error-handler.ts
│   │   ├── logger.ts
│   │   └── cache.ts
│   │
│   └── index.ts                 # Express app entry
│
├── prisma/
│   ├── schema.prisma            # Prisma schema
│   └── migrations/              # Database migrations
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── scripts/
│   ├── seed-data.ts             # Import historical data
│   └── backfill.ts              # Backfill missing data
│
├── .env.example
├── package.json
├── tsconfig.json
├── docker-compose.yml           # Local dev (Postgres + Redis)
└── README.md
```

---

## Implementation Phases

### Phase 1: Foundation & Proof of Concept (Week 1)

**Goal:** Get basic data flowing from one source to database to API

**Tasks:**
1. ✅ Initialize Node.js + Express + TypeScript project
2. ✅ Set up PostgreSQL database (Docker)
3. ✅ Set up Prisma with basic schema
4. ✅ Create one service (e.g., FideService using fide-api.vercel.app)
5. ✅ Create one endpoint (e.g., GET /api/players/top)
6. ✅ Test end-to-end flow

**Proof of Concept:**
```typescript
// src/services/fide.service.ts
export class FideService {
  private baseUrl = 'https://fide-api.vercel.app';

  async getTopPlayers() {
    const response = await fetch(`${this.baseUrl}/top`);
    return response.json();
  }
}

// src/routes/players.ts
router.get('/players/top', async (req, res) => {
  const fideService = new FideService();
  const topPlayers = await fideService.getTopPlayers();
  res.json({ data: topPlayers });
});
```

**Success Criteria:**
- Frontend can call `GET /api/players/top` and receive data
- Data is properly typed
- Basic error handling works

---

### Phase 2: Multi-Source Integration (Week 2)

**Goal:** Integrate all three data sources (Chess.com, Lichess, FIDE)

**Tasks:**
1. ✅ Implement ChessComService (using chess-web-api)
2. ✅ Implement LichessService (native API calls)
3. ✅ Create data normalization layer
4. ✅ Import historical Titled Tuesday data from GitHub
5. ✅ Create all core API endpoints
6. ✅ Set up Redis caching

**Code Samples:**

```typescript
// src/services/chesscom.service.ts
import { ChessWebAPI } from 'chess-web-api';
import Bottleneck from 'bottleneck';

export class ChessComService {
  private api = new ChessWebAPI({ queue: true });

  // Additional rate limiting
  private limiter = new Bottleneck({
    maxConcurrent: 2,
    minTime: 500
  });

  async getPlayer(username: string) {
    return this.limiter.schedule(() => this.api.getPlayer(username));
  }

  async getTournament(tournamentId: string) {
    return this.limiter.schedule(() => this.api.getTournament(tournamentId));
  }
}

// src/services/lichess.service.ts
export class LichessService {
  private baseUrl = 'https://lichess.org/api';

  async getTournament(id: string) {
    const response = await fetch(`${this.baseUrl}/tournament/${id}`);
    return response.json();
  }

  async getCurrentTournaments() {
    const response = await fetch(`${this.baseUrl}/tournament`);
    return response.json();
  }
}
```

---

### Phase 3: Background Jobs & Automation (Week 3)

**Goal:** Automated data collection and updates

**Tasks:**
1. ✅ Set up BullMQ with Redis
2. ✅ Create job schedulers
3. ✅ Implement workers for each data source
4. ✅ Add retry logic and error handling
5. ✅ Set up job monitoring

**Code Samples:**

```typescript
// src/jobs/queue.ts
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL);

export const scraperQueue = new Queue('scrapers', { connection });

// src/jobs/schedulers.ts
export async function scheduleJobs() {
  // Weekly Titled Tuesday (Tuesday 11 PM)
  await scraperQueue.add(
    'titled-tuesday',
    { date: new Date() },
    { repeat: { pattern: '0 23 * * 2' } }
  );

  // Daily Lichess arena updates
  await scraperQueue.add(
    'lichess-arenas',
    {},
    { repeat: { pattern: '0 2 * * *' } }
  );

  // Weekly FIDE top players
  await scraperQueue.add(
    'fide-top-players',
    {},
    { repeat: { pattern: '0 3 * * 1' } }
  );
}

// src/jobs/workers.ts
import { Worker } from 'bullmq';
import { ChessComService } from '../services/chesscom.service';

export const scraperWorker = new Worker('scrapers', async job => {
  switch (job.name) {
    case 'titled-tuesday':
      return await new ChessComService().scrapeTitledTuesday();
    case 'lichess-arenas':
      return await new LichessService().scrapeArenas();
    case 'fide-top-players':
      return await new FideService().updateTopPlayers();
  }
}, { connection });
```

---

### Phase 4: Production Ready (Week 4)

**Goal:** Deploy and monitor

**Tasks:**
1. ✅ Add comprehensive error handling
2. ✅ Add logging (Winston)
3. ✅ Add API documentation (Swagger/OpenAPI)
4. ✅ Write tests (Jest)
5. ✅ Set up CI/CD (GitHub Actions)
6. ✅ Deploy to Railway/Render
7. ✅ Set up monitoring (Sentry)
8. ✅ Connect frontend to production API

---

## Caching Strategy

### Redis Cache Keys & TTLs

```typescript
// src/services/cache.service.ts
export class CacheService {
  private redis = new Redis(process.env.REDIS_URL);

  // Historical tournaments (never change)
  async cacheCompletedTournament(id: string, data: any) {
    await this.redis.set(`tournament:${id}`, JSON.stringify(data));
    // No TTL - lasts forever
  }

  // Ongoing tournaments (short TTL)
  async cacheOngoingTournament(id: string, data: any) {
    await this.redis.setex(
      `tournament:${id}`,
      300, // 5 minutes
      JSON.stringify(data)
    );
  }

  // Player profiles (medium TTL)
  async cachePlayer(id: string, data: any) {
    await this.redis.setex(
      `player:${id}`,
      3600, // 1 hour
      JSON.stringify(data)
    );
  }

  // Rankings (medium TTL)
  async cacheRankings(type: string, data: any) {
    await this.redis.setex(
      `rankings:${type}`,
      1800, // 30 minutes
      JSON.stringify(data)
    );
  }

  // Search results (short TTL)
  async cacheSearchResults(query: string, data: any) {
    await this.redis.setex(
      `search:${query}`,
      600, // 10 minutes
      JSON.stringify(data)
    );
  }
}
```

### Cache Middleware

```typescript
// src/middleware/cache.ts
export function cacheMiddleware(ttl: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `cache:${req.originalUrl}`;

    // Try to get from cache
    const cached = await redis.get(key);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Store original send function
    const originalSend = res.json.bind(res);

    // Override send to cache the response
    res.json = (body: any) => {
      redis.setex(key, ttl, JSON.stringify(body));
      return originalSend(body);
    };

    next();
  };
}

// Usage in routes
router.get('/tournaments', cacheMiddleware(300), async (req, res) => {
  // If not cached, fetch from DB and cache automatically
  const tournaments = await TournamentRepository.findAll();
  res.json(tournaments);
});
```

---

## Rate Limiting

### Per-Source Rate Limiters

```typescript
// src/utils/rate-limiter.ts
import Bottleneck from 'bottleneck';

// Chess.com: Max 2 concurrent, 500ms between requests
export const chessComLimiter = new Bottleneck({
  maxConcurrent: 2,
  minTime: 500
});

// Lichess: More generous, wait 1 min on 429
export const lichessLimiter = new Bottleneck({
  maxConcurrent: 5,
  minTime: 200,
  reservoir: 300,           // 300 requests
  reservoirRefreshAmount: 300,
  reservoirRefreshInterval: 60 * 1000  // per minute
});

// FIDE API: Respect their server
export const fideLimiter = new Bottleneck({
  maxConcurrent: 3,
  minTime: 300
});

// Usage
async function fetchChessComTournament(id: string) {
  return chessComLimiter.schedule(() =>
    fetch(`https://api.chess.com/pub/tournament/${id}`)
  );
}
```

---

## Environment Variables

```bash
# .env.example

# Server
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/chess_stats

# Redis
REDIS_URL=redis://localhost:6379

# External APIs (if needed)
CHESS_COM_API_KEY=                    # Not required for PubAPI
LICHESS_API_TOKEN=                    # Only for write operations
FIDE_API_URL=https://fide-api.vercel.app

# Caching
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=300                 # 5 minutes

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000            # 1 minute
RATE_LIMIT_MAX_REQUESTS=100

# Scraping
SCRAPER_DELAY_MS=1000
MAX_CONCURRENT_SCRAPERS=3

# Monitoring
SENTRY_DSN=                           # For error tracking
LOG_LEVEL=info                        # debug, info, warn, error

# GitHub (for historical data import)
GITHUB_TOKEN=                         # Optional, increases rate limit
```

---

## Deployment

### Recommended Stack

**Option 1: Railway (Easiest)**
- ✅ Auto-deploy from GitHub
- ✅ Built-in PostgreSQL & Redis
- ✅ Environment management
- ✅ Logs and monitoring
- ✅ Free tier available

**Option 2: Render**
- ✅ Similar to Railway
- ✅ Good free tier
- ✅ Easy PostgreSQL setup

**Option 3: AWS (Most Control)**
- ✅ ECS/Fargate for containers
- ✅ RDS for PostgreSQL
- ✅ ElastiCache for Redis
- ❌ More complex setup

### Docker Setup

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 4000

# Start server
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml (local development)
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: chess
      POSTGRES_PASSWORD: password
      POSTGRES_DB: chess_stats
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  api:
    build: .
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgresql://chess:password@postgres:5432/chess_stats
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
  redis_data:
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to Railway
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## Monitoring & Logging

### Winston Logger Setup

```typescript
// src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Usage
logger.info('Tournament scraped', { tournamentId, platform: 'chess-com' });
logger.error('Scraping failed', { error, tournamentId });
```

### Sentry Integration

```typescript
// src/index.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// Error handler middleware
app.use(Sentry.Handlers.errorHandler());
```

---

## Testing

### Jest Setup

```typescript
// tests/unit/services/fide.service.test.ts
import { FideService } from '../../../src/services/fide.service';

describe('FideService', () => {
  let fideService: FideService;

  beforeEach(() => {
    fideService = new FideService();
  });

  it('should fetch top players', async () => {
    const topPlayers = await fideService.getTopPlayers();

    expect(Array.isArray(topPlayers)).toBe(true);
    expect(topPlayers.length).toBeGreaterThan(0);
    expect(topPlayers[0]).toHaveProperty('name');
    expect(topPlayers[0]).toHaveProperty('rating');
  });

  it('should fetch player info', async () => {
    const magnus = await fideService.getPlayerInfo('1503014');

    expect(magnus).toHaveProperty('name');
    expect(magnus).toHaveProperty('standard_rating');
    expect(magnus.name).toContain('Carlsen');
  });
});
```

---

## Next Steps

### Proof of Concept (This Week)

1. **Initialize backend project**
   - Set up Node.js + Express + TypeScript
   - Install dependencies (Prisma, Redis, etc.)

2. **Set up database**
   - Docker Compose with PostgreSQL + Redis
   - Create basic Prisma schema
   - Run first migration

3. **Build one service**
   - Start with FideService (easiest - just HTTP calls)
   - Create GET /api/players/top endpoint
   - Test from frontend

4. **Verify end-to-end**
   - Frontend → Backend API → FIDE API → Response
   - Confirm data flow works

### After POC

5. **Add Chess.com integration**
   - Install chess-web-api
   - Import Titled Tuesday historical data
   - Create tournament endpoints

6. **Add Lichess integration**
   - Native API calls
   - Tournament scraping
   - Player profiles

7. **Automate updates**
   - Set up BullMQ
   - Schedule weekly/daily jobs
   - Monitor and log

---

## Resources & References

### Official APIs
- Chess.com PubAPI: https://www.chess.com/news/view/published-data-api
- Lichess API Docs: https://lichess.org/api
- FIDE API (community): https://fide-api.vercel.app/docs

### GitHub Repositories
- Titled Tuesday Data: https://github.com/cmgchess/Titled-Tuesday-Data
- FIDE API: https://github.com/cassiofb-dev/fide-api
- chess-web-api: https://github.com/andyruwruw/chess-web-api
- Lichess Database: https://github.com/lichess-org/database

### Tools & Libraries
- Prisma: https://www.prisma.io/
- BullMQ: https://docs.bullmq.io/
- Bottleneck: https://github.com/SGrondin/bottleneck
- Winston: https://github.com/winstonjs/winston

### Database Schema References
- Swiss Tournament DB: https://github.com/bencam/tournament-database
- Chess Database Backend: https://github.com/cgoldammer/chess-database-backend

---

**Document Version:** 1.0
**Last Updated:** 2025-10-29
**Status:** Planning Phase → Ready for Implementation
