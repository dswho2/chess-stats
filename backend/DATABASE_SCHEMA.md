# Chess Stats Platform - Database Schema Design

## Overview

This document defines the complete PostgreSQL database schema for the Chess Stats Platform. The schema is designed to:
- Normalize data from Chess.com, Lichess, and FIDE APIs
- Support efficient querying for the frontend
- Track historical data and changes over time
- Enable analytics and statistics

## Schema Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Players    │────────▶│  Tournaments │◀────────│   Games     │
│             │         │   Standings  │         │             │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │                        │
      │                        │                        │
      ▼                        ▼                        ▼
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│Player Rating│         │ Tournaments  │         │   Rounds    │
│  History    │         │              │         │             │
└─────────────┘         └──────────────┘         └─────────────┘
```

## Core Tables

### 1. Players Table

**Purpose:** Central player registry across all platforms

```sql
CREATE TABLE players (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Information
  username VARCHAR(255) UNIQUE NOT NULL,        -- Normalized username (lowercase)
  display_name VARCHAR(255),                    -- Display name (preserves case)
  full_name VARCHAR(255),                       -- Real name (if available)
  title VARCHAR(10),                            -- GM, IM, FM, WGM, WIM, WFM, CM, etc.

  -- Country (both FIDE and ISO codes)
  country_iso VARCHAR(2) NOT NULL,              -- ISO 3166-1 alpha-2 (US, NO, IN)
  country_fide VARCHAR(3),                      -- FIDE code (USA, NOR, IND)

  -- Profile
  avatar_url TEXT,
  bio TEXT,
  date_of_birth DATE,
  birth_year INTEGER,

  -- External Platform Identifiers
  fide_id VARCHAR(50) UNIQUE,
  chess_com_id VARCHAR(255),
  chess_com_username VARCHAR(255),
  lichess_id VARCHAR(255),
  lichess_username VARCHAR(255),

  -- Current Ratings (FIDE)
  fide_classical_rating INTEGER,
  fide_rapid_rating INTEGER,
  fide_blitz_rating INTEGER,

  -- Current Ratings (Chess.com)
  chess_com_bullet_rating INTEGER,
  chess_com_blitz_rating INTEGER,
  chess_com_rapid_rating INTEGER,
  chess_com_daily_rating INTEGER,

  -- Current Ratings (Lichess)
  lichess_bullet_rating INTEGER,
  lichess_blitz_rating INTEGER,
  lichess_rapid_rating INTEGER,
  lichess_classical_rating INTEGER,
  lichess_ultrabullet_rating INTEGER,

  -- Social Links
  twitter_handle VARCHAR(255),
  twitch_handle VARCHAR(255),
  youtube_handle VARCHAR(255),

  -- Status
  is_active BOOLEAN DEFAULT true,               -- Currently active player
  is_verified BOOLEAN DEFAULT false,            -- Verified account

  -- Metadata
  metadata JSONB,                               -- Platform-specific data

  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,                   -- Last API sync

  -- Indexes
  CONSTRAINT players_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_players_username ON players(username);
CREATE INDEX idx_players_fide_id ON players(fide_id) WHERE fide_id IS NOT NULL;
CREATE INDEX idx_players_chess_com_username ON players(chess_com_username) WHERE chess_com_username IS NOT NULL;
CREATE INDEX idx_players_lichess_username ON players(lichess_username) WHERE lichess_username IS NOT NULL;
CREATE INDEX idx_players_country_iso ON players(country_iso);
CREATE INDEX idx_players_title ON players(title) WHERE title IS NOT NULL;
CREATE INDEX idx_players_fide_classical_rating ON players(fide_classical_rating DESC NULLS LAST);
CREATE INDEX idx_players_active ON players(is_active) WHERE is_active = true;
CREATE INDEX idx_players_updated_at ON players(updated_at);

-- Full-text search
CREATE INDEX idx_players_search ON players USING GIN(
  to_tsvector('english',
    COALESCE(username, '') || ' ' ||
    COALESCE(display_name, '') || ' ' ||
    COALESCE(full_name, '')
  )
);
```

### 2. Tournaments Table

**Purpose:** Store all tournament data across platforms

```sql
CREATE TABLE tournaments (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- External Reference
  external_id VARCHAR(255) NOT NULL,            -- ID from source platform
  platform VARCHAR(50) NOT NULL,                -- chess-com, lichess, fide

  -- Basic Information
  name VARCHAR(500) NOT NULL,
  slug VARCHAR(500),                            -- URL-friendly name
  format VARCHAR(50) NOT NULL,                  -- swiss, arena, knockout, round-robin
  status VARCHAR(50) NOT NULL,                  -- upcoming, ongoing, completed, cancelled

  -- Time Control
  time_control VARCHAR(50) NOT NULL,            -- bullet, blitz, rapid, classical, correspondence
  time_control_seconds INTEGER,                 -- Base time in seconds
  time_increment_seconds INTEGER,               -- Increment per move

  -- Schedule
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  registration_open_date TIMESTAMPTZ,
  registration_close_date TIMESTAMPTZ,

  -- Tournament Settings
  rounds INTEGER,
  participant_count INTEGER,
  max_participants INTEGER,
  min_rating INTEGER,
  max_rating INTEGER,

  -- Prize Information
  prize_pool DECIMAL(10,2),
  prize_currency VARCHAR(10),                   -- USD, EUR, etc.
  prize_distribution JSONB,                     -- { "1st": 500, "2nd": 300, ... }

  -- Location (for OTB tournaments)
  location_name VARCHAR(255),
  location_city VARCHAR(255),
  location_country VARCHAR(2),
  is_online BOOLEAN DEFAULT true,

  -- Links & Media
  official_url TEXT,
  broadcast_url TEXT,
  thumbnail_url TEXT,
  description TEXT,

  -- Features
  featured BOOLEAN DEFAULT false,
  is_titled_only BOOLEAN DEFAULT false,
  is_rated BOOLEAN DEFAULT true,

  -- Metadata
  metadata JSONB,                               -- Platform-specific data

  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT tournaments_pkey PRIMARY KEY (id),
  CONSTRAINT tournaments_external_id_platform_key UNIQUE (external_id, platform)
);

CREATE INDEX idx_tournaments_platform ON tournaments(platform);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_time_control ON tournaments(time_control);
CREATE INDEX idx_tournaments_start_date ON tournaments(start_date DESC);
CREATE INDEX idx_tournaments_end_date ON tournaments(end_date DESC);
CREATE INDEX idx_tournaments_featured ON tournaments(featured) WHERE featured = true;
CREATE INDEX idx_tournaments_format ON tournaments(format);
CREATE INDEX idx_tournaments_slug ON tournaments(slug) WHERE slug IS NOT NULL;

-- Full-text search
CREATE INDEX idx_tournaments_search ON tournaments USING GIN(
  to_tsvector('english',
    COALESCE(name, '') || ' ' ||
    COALESCE(description, '')
  )
);
```

### 3. Tournament Standings Table

**Purpose:** Player performance within tournaments

```sql
CREATE TABLE tournament_standings (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  -- Standing Information
  rank INTEGER NOT NULL,
  final_rank INTEGER,                           -- Final rank if different from current
  score DECIMAL(4,1) NOT NULL,                  -- Points scored (can have .5 for draws)
  tie_break_1 DECIMAL(6,2),                     -- Usually Buchholz
  tie_break_2 DECIMAL(6,2),                     -- Usually Sonneborn-Berger
  tie_break_3 DECIMAL(6,2),                     -- Additional tie-break if needed

  -- Performance Metrics
  rating INTEGER,                                -- Player's rating at tournament time
  performance_rating INTEGER,                    -- Performance rating
  rating_change INTEGER,                         -- Change in rating

  -- Game Statistics
  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  white_games INTEGER DEFAULT 0,
  black_games INTEGER DEFAULT 0,
  byes INTEGER DEFAULT 0,

  -- Prize Information
  prize_money DECIMAL(10,2),
  prize_currency VARCHAR(10),

  -- Metadata
  metadata JSONB,

  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT tournament_standings_pkey PRIMARY KEY (id),
  CONSTRAINT tournament_standings_tournament_player_key UNIQUE (tournament_id, player_id)
);

CREATE INDEX idx_standings_tournament ON tournament_standings(tournament_id);
CREATE INDEX idx_standings_player ON tournament_standings(player_id);
CREATE INDEX idx_standings_rank ON tournament_standings(tournament_id, rank);
CREATE INDEX idx_standings_score ON tournament_standings(tournament_id, score DESC);
```

### 4. Games Table

**Purpose:** Individual games from tournaments

```sql
CREATE TABLE games (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- External Reference
  external_id VARCHAR(255),                     -- Game ID from platform
  platform VARCHAR(50) NOT NULL,

  -- Tournament Reference
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  board_number INTEGER,

  -- Players
  white_player_id UUID NOT NULL REFERENCES players(id),
  black_player_id UUID NOT NULL REFERENCES players(id),
  white_rating INTEGER,
  black_rating INTEGER,

  -- Result
  result VARCHAR(10) NOT NULL,                  -- 1-0, 0-1, 1/2-1/2, *, 0-0 (forfeit)
  termination VARCHAR(50),                      -- normal, time forfeit, abandoned, etc.

  -- Opening
  opening_name VARCHAR(255),
  opening_eco VARCHAR(10),                      -- ECO code (A00-E99)
  opening_ply INTEGER,                          -- Number of opening moves

  -- Game Data
  moves TEXT,                                   -- PGN moves
  move_count INTEGER,
  pgn TEXT,                                     -- Full PGN
  fen_final VARCHAR(255),                       -- Final board position

  -- Time Information
  time_control VARCHAR(50),
  time_class VARCHAR(20),                       -- bullet, blitz, rapid, classical
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Links
  pgn_url TEXT,
  analysis_url TEXT,
  broadcast_url TEXT,

  -- Flags
  is_rated BOOLEAN DEFAULT true,

  -- Metadata
  metadata JSONB,                               -- Clock times, eval, etc.

  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT games_pkey PRIMARY KEY (id),
  CONSTRAINT games_players_different CHECK (white_player_id != black_player_id)
);

CREATE INDEX idx_games_tournament ON games(tournament_id);
CREATE INDEX idx_games_round ON games(tournament_id, round_number);
CREATE INDEX idx_games_white_player ON games(white_player_id);
CREATE INDEX idx_games_black_player ON games(black_player_id);
CREATE INDEX idx_games_players ON games(white_player_id, black_player_id);
CREATE INDEX idx_games_external_id ON games(external_id, platform) WHERE external_id IS NOT NULL;
CREATE INDEX idx_games_opening_eco ON games(opening_eco) WHERE opening_eco IS NOT NULL;
CREATE INDEX idx_games_start_time ON games(start_time DESC);
CREATE INDEX idx_games_result ON games(result);
```

### 5. Tournament Rounds Table (Optional for Swiss/Round-Robin)

**Purpose:** Track pairings and round structure

```sql
CREATE TABLE tournament_rounds (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,

  -- Round Information
  name VARCHAR(255),                            -- "Round 1", "Quarterfinals", etc.
  status VARCHAR(50) NOT NULL,                  -- upcoming, ongoing, completed
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,

  -- Metadata
  metadata JSONB,

  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT tournament_rounds_pkey PRIMARY KEY (id),
  CONSTRAINT tournament_rounds_tournament_round_key UNIQUE (tournament_id, round_number)
);

CREATE INDEX idx_rounds_tournament ON tournament_rounds(tournament_id);
CREATE INDEX idx_rounds_status ON tournament_rounds(status);
```

## Supporting Tables

### 6. Player Rating History

**Purpose:** Track rating changes over time

```sql
CREATE TABLE player_rating_history (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Key
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  -- Period
  period DATE NOT NULL,                         -- First day of month (YYYY-MM-01)
  platform VARCHAR(50) NOT NULL,                -- fide, chess-com, lichess
  time_control VARCHAR(50) NOT NULL,            -- classical, rapid, blitz, bullet

  -- Rating Data
  rating INTEGER NOT NULL,
  rating_change INTEGER,                        -- Change from previous period
  games_played INTEGER,
  rank_in_country INTEGER,
  rank_worldwide INTEGER,

  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT player_rating_history_pkey PRIMARY KEY (id),
  CONSTRAINT player_rating_history_unique UNIQUE (player_id, period, platform, time_control)
);

CREATE INDEX idx_rating_history_player ON player_rating_history(player_id);
CREATE INDEX idx_rating_history_period ON player_rating_history(period DESC);
CREATE INDEX idx_rating_history_platform ON player_rating_history(platform, time_control);
```

### 7. Player Statistics

**Purpose:** Aggregated statistics per player

```sql
CREATE TABLE player_statistics (
  -- Primary Key (same as player_id)
  player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,

  -- Tournament Stats
  tournaments_played INTEGER DEFAULT 0,
  tournaments_won INTEGER DEFAULT 0,
  average_placement DECIMAL(6,2),
  best_placement INTEGER,
  best_tournament_id UUID REFERENCES tournaments(id),

  -- Game Stats
  total_games INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2),

  -- Color Stats
  white_games INTEGER DEFAULT 0,
  white_wins INTEGER DEFAULT 0,
  black_games INTEGER DEFAULT 0,
  black_wins INTEGER DEFAULT 0,

  -- Best Performances
  best_performance_rating INTEGER,
  peak_fide_classical INTEGER,
  peak_fide_rapid INTEGER,
  peak_fide_blitz INTEGER,

  -- Opening Stats (top 3 most played)
  top_opening_white VARCHAR(10),                -- ECO code
  top_opening_black VARCHAR(10),
  favorite_opening_count INTEGER,

  -- Audit Fields
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT player_statistics_pkey PRIMARY KEY (player_id)
);

CREATE INDEX idx_statistics_tournaments_played ON player_statistics(tournaments_played DESC);
CREATE INDEX idx_statistics_win_rate ON player_statistics(win_rate DESC);
```

### 8. Country Changes Log

**Purpose:** Track when players change federations

```sql
CREATE TABLE player_country_changes (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Key
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  -- Change Information
  old_country_fide VARCHAR(3),
  new_country_fide VARCHAR(3) NOT NULL,
  old_country_iso VARCHAR(2),
  new_country_iso VARCHAR(2) NOT NULL,

  -- Dates
  effective_date DATE,                          -- When change took effect
  detected_at TIMESTAMPTZ DEFAULT NOW(),        -- When we detected it

  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT player_country_changes_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_country_changes_player ON player_country_changes(player_id);
CREATE INDEX idx_country_changes_detected ON player_country_changes(detected_at DESC);
```

### 9. Data Sync Jobs

**Purpose:** Track background sync operations

```sql
CREATE TABLE sync_jobs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Job Information
  job_type VARCHAR(100) NOT NULL,               -- sync_players, sync_tournament, sync_games
  platform VARCHAR(50) NOT NULL,                -- fide, chess-com, lichess
  target_id VARCHAR(255),                       -- Tournament/player ID being synced

  -- Status
  status VARCHAR(50) NOT NULL,                  -- pending, running, completed, failed
  progress INTEGER DEFAULT 0,                   -- Percentage (0-100)

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Results
  items_processed INTEGER DEFAULT 0,
  items_created INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,

  -- Error Handling
  error_message TEXT,
  error_stack TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Metadata
  metadata JSONB,

  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT sync_jobs_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX idx_sync_jobs_type ON sync_jobs(job_type);
CREATE INDEX idx_sync_jobs_platform ON sync_jobs(platform);
CREATE INDEX idx_sync_jobs_created ON sync_jobs(created_at DESC);
```

### 10. API Cache Metadata (Optional)

**Purpose:** Track what's cached in Redis

```sql
CREATE TABLE cache_metadata (
  -- Primary Key
  cache_key VARCHAR(500) PRIMARY KEY,

  -- Cache Information
  data_type VARCHAR(100) NOT NULL,              -- tournament, player, rankings, etc.
  related_id UUID,                              -- Related entity ID
  platform VARCHAR(50),

  -- Timestamps
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,

  -- Stats
  hit_count INTEGER DEFAULT 0,
  miss_count INTEGER DEFAULT 0,

  -- Constraints
  CONSTRAINT cache_metadata_pkey PRIMARY KEY (cache_key)
);

CREATE INDEX idx_cache_expires ON cache_metadata(expires_at);
CREATE INDEX idx_cache_type ON cache_metadata(data_type);
```

## Views for Common Queries

### Player Rankings View

```sql
CREATE VIEW player_rankings_view AS
SELECT
  p.id,
  p.username,
  p.display_name,
  p.full_name,
  p.title,
  p.country_iso,
  p.country_fide,

  -- FIDE Rankings
  p.fide_classical_rating,
  RANK() OVER (ORDER BY p.fide_classical_rating DESC NULLS LAST) as fide_classical_rank,
  RANK() OVER (PARTITION BY p.country_iso ORDER BY p.fide_classical_rating DESC NULLS LAST) as fide_classical_country_rank,

  p.fide_rapid_rating,
  RANK() OVER (ORDER BY p.fide_rapid_rating DESC NULLS LAST) as fide_rapid_rank,

  p.fide_blitz_rating,
  RANK() OVER (ORDER BY p.fide_blitz_rating DESC NULLS LAST) as fide_blitz_rank,

  -- Stats
  ps.tournaments_played,
  ps.win_rate,

  p.updated_at
FROM players p
LEFT JOIN player_statistics ps ON p.id = ps.player_id
WHERE p.is_active = true;
```

### Active Tournaments View

```sql
CREATE VIEW active_tournaments_view AS
SELECT
  t.*,
  COUNT(DISTINCT ts.player_id) as current_participants,
  MAX(ts.score) as leading_score
FROM tournaments t
LEFT JOIN tournament_standings ts ON t.id = ts.tournament_id
WHERE t.status IN ('upcoming', 'ongoing')
GROUP BY t.id
ORDER BY t.start_date ASC;
```

## Data Types & Enums

Define these as PostgreSQL ENUMs or check constraints:

```sql
-- Tournament Status
CREATE TYPE tournament_status AS ENUM (
  'upcoming',
  'ongoing',
  'completed',
  'cancelled'
);

-- Tournament Format
CREATE TYPE tournament_format AS ENUM (
  'swiss',
  'arena',
  'knockout',
  'round-robin',
  'grand-prix'
);

-- Time Control
CREATE TYPE time_control AS ENUM (
  'ultrabullet',
  'bullet',
  'blitz',
  'rapid',
  'classical',
  'correspondence'
);

-- Platform
CREATE TYPE platform AS ENUM (
  'fide',
  'chess-com',
  'lichess'
);

-- Game Result
CREATE TYPE game_result AS ENUM (
  '1-0',      -- White wins
  '0-1',      -- Black wins
  '1/2-1/2',  -- Draw
  '*',        -- Ongoing
  '0-0'       -- Double forfeit
);
```

## Next Steps

1. ✅ Review this schema design
2. Create Prisma schema file
3. Set up PostgreSQL database
4. Run initial migrations
5. Create seed data scripts
6. Update API routes to use database instead of direct API calls
7. Implement background sync jobs

