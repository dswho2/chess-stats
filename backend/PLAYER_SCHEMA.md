# Player Schema - Database Design

## Overview

This document defines the Player schema for when we integrate PostgreSQL database. The schema is designed to store both FIDE country codes and ISO codes for efficient comparison and flag emoji display.

## Player Table Schema

```sql
CREATE TABLE players (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  title VARCHAR(10),                           -- GM, IM, FM, WGM, etc.

  -- Country codes (BOTH stored for comparison)
  country_iso VARCHAR(2) NOT NULL,             -- ISO 3166-1 alpha-2 (for flag emojis)
  country_fide VARCHAR(3),                     -- FIDE country code (for comparison)

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

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,                  -- Last time data was fetched from external API

  -- Indexes
  INDEX idx_players_username (username),
  INDEX idx_players_fide_id (fide_id),
  INDEX idx_players_country_iso (country_iso),
  INDEX idx_players_country_fide (country_fide),
  INDEX idx_players_title (title)
);
```

## Prisma Schema

```prisma
model Player {
  id                     String    @id @default(uuid())
  username               String    @unique
  fullName               String?   @map("full_name")
  title                  String?

  // Country codes - BOTH stored
  countryIso             String    @map("country_iso") @db.VarChar(2)
  countryFide            String?   @map("country_fide") @db.VarChar(3)

  avatarUrl              String?   @map("avatar_url")
  bio                    String?
  dateOfBirth            DateTime? @map("date_of_birth")

  // External IDs
  fideId                 String?   @unique @map("fide_id")
  chessComUsername       String?   @map("chess_com_username")
  lichessUsername        String?   @map("lichess_username")

  // FIDE ratings
  fideClassicalRating    Int?      @map("fide_classical_rating")
  fideRapidRating        Int?      @map("fide_rapid_rating")
  fideBlitzRating        Int?      @map("fide_blitz_rating")

  // Chess.com ratings
  chessComBulletRating   Int?      @map("chess_com_bullet_rating")
  chessComBlitzRating    Int?      @map("chess_com_blitz_rating")
  chessComRapidRating    Int?      @map("chess_com_rapid_rating")
  chessComDailyRating    Int?      @map("chess_com_daily_rating")

  // Lichess ratings
  lichessBulletRating    Int?      @map("lichess_bullet_rating")
  lichessBlitzRating     Int?      @map("lichess_blitz_rating")
  lichessRapidRating     Int?      @map("lichess_rapid_rating")
  lichessClassicalRating Int?      @map("lichess_classical_rating")

  // Audit
  createdAt              DateTime  @default(now()) @map("created_at")
  updatedAt              DateTime  @updatedAt @map("updated_at")
  lastSyncedAt           DateTime? @map("last_synced_at")

  // Relations
  standings              TournamentStanding[]
  whiteGames             Game[]    @relation("WhitePlayer")
  blackGames             Game[]    @relation("BlackPlayer")
  stats                  PlayerStats?

  @@index([username])
  @@index([fideId])
  @@index([countryIso])
  @@index([countryFide])
  @@index([title])
  @@map("players")
}
```

## Why Store Both Country Codes?

### Benefits:

1. **Efficient Change Detection**
   - When syncing from FIDE API, we get the FIDE country code
   - Compare `country_fide` to detect if player changed countries
   - Only update `country_iso` if `country_fide` changed
   - Avoids unnecessary writes and maintains audit trail

2. **Fast Flag Display**
   - Frontend uses `country_iso` directly for flag emojis
   - No translation needed at query time
   - Pre-computed during data ingestion

3. **Data Integrity**
   - Keep original FIDE code for reference
   - ISO code is derived/computed field
   - Can rebuild ISO codes if mapping changes

### Example Data Flow:

```typescript
// During data ingestion (background job)
async function syncPlayerFromFide(fideId: string) {
  // Fetch from FIDE API
  const fideData = await fideApi.getPlayer(fideId);

  // Get existing player from DB
  const existingPlayer = await db.player.findUnique({
    where: { fideId }
  });

  // Check if country changed
  const countryChanged = existingPlayer?.countryFide !== fideData.country;

  if (countryChanged) {
    console.log(`Player ${fideId} changed country: ${existingPlayer?.countryFide} -> ${fideData.country}`);
  }

  // Update player
  await db.player.upsert({
    where: { fideId },
    update: {
      countryFide: fideData.country,
      countryIso: fideToIso(fideData.country),
      fideClassicalRating: parseInt(fideData.rating),
      lastSyncedAt: new Date()
    },
    create: {
      fideId,
      username: fideData.name.toLowerCase().replace(/\s+/g, '-'),
      fullName: fideData.name,
      title: fideData.title,
      countryFide: fideData.country,
      countryIso: fideToIso(fideData.country),
      fideClassicalRating: parseInt(fideData.rating)
    }
  });
}
```

### Query Examples:

```sql
-- Get all Norwegian players
SELECT * FROM players WHERE country_iso = 'NO';

-- Find players who recently changed countries
SELECT
  username,
  full_name,
  country_fide,
  country_iso,
  updated_at
FROM players
WHERE updated_at > NOW() - INTERVAL '30 days'
  AND country_fide IS NOT NULL
ORDER BY updated_at DESC;

-- Get top players by country
SELECT
  full_name,
  title,
  country_iso,
  fide_classical_rating
FROM players
WHERE country_iso = 'US'
  AND fide_classical_rating IS NOT NULL
ORDER BY fide_classical_rating DESC
LIMIT 100;
```

## Migration Strategy

When moving from direct API calls to database:

1. **Initial Data Import**
   ```typescript
   // Import all FIDE top players
   const topPlayers = await fideApi.getTopPlayers();

   for (const player of topPlayers) {
     await db.player.create({
       data: {
         fideId: player.fide_id,
         fullName: player.name,
         title: player.title,
         countryFide: player.country,
         countryIso: fideToIso(player.country),
         fideClassicalRating: parseInt(player.rating)
       }
     });
   }
   ```

2. **Scheduled Updates**
   ```typescript
   // Run daily: Update all active players
   async function updateAllPlayers() {
     const players = await db.player.findMany({
       where: {
         fideId: { not: null }
       }
     });

     for (const player of players) {
       await syncPlayerFromFide(player.fideId!);
       await sleep(500); // Rate limiting
     }
   }
   ```

3. **API Response Changes**
   ```typescript
   // OLD (current): Direct from FIDE API, translate on-the-fly
   router.get('/top', async (req, res) => {
     const topPlayers = await fideService.getTopPlayers();
     const playersWithIsoCountries = topPlayers.map(player => ({
       ...player,
       country: fideToIso(player.country)
     }));
     res.json({ data: playersWithIsoCountries });
   });

   // NEW (future): From database, already translated
   router.get('/top', async (req, res) => {
     const topPlayers = await db.player.findMany({
       select: {
         fideId: true,
         fullName: true,
         title: true,
         countryIso: true,
         fideClassicalRating: true
       },
       where: {
         fideClassicalRating: { not: null }
       },
       orderBy: {
         fideClassicalRating: 'desc'
       },
       take: 100
     });
     res.json({ data: topPlayers });
   });
   ```

## Future Enhancements

### Rating Change Tracking

Add a separate table to track rating changes over time:

```sql
CREATE TABLE player_rating_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,

  period DATE NOT NULL,                        -- Month/year of rating

  fide_classical_rating INTEGER,
  fide_classical_change INTEGER,               -- +/- from previous period

  fide_rapid_rating INTEGER,
  fide_rapid_change INTEGER,

  fide_blitz_rating INTEGER,
  fide_blitz_change INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(player_id, period),
  INDEX idx_rating_history_player (player_id),
  INDEX idx_rating_history_period (period)
);
```

Then we can query:
```sql
-- Get Magnus Carlsen's rating history
SELECT
  period,
  fide_classical_rating,
  fide_classical_change
FROM player_rating_history
WHERE player_id = (SELECT id FROM players WHERE fide_id = '1503014')
ORDER BY period DESC
LIMIT 12;  -- Last 12 months
```

### Country Migration Audit

Track when players change federations:

```sql
CREATE TABLE player_country_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,

  old_country_fide VARCHAR(3),
  new_country_fide VARCHAR(3),
  old_country_iso VARCHAR(2),
  new_country_iso VARCHAR(2),

  changed_at TIMESTAMPTZ DEFAULT NOW(),
  detected_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_country_changes_player (player_id),
  INDEX idx_country_changes_date (changed_at)
);
```

## References

- Country code mapper: `backend/src/utils/countryCodeMapper.ts`
- FIDE API: `https://fide-api.vercel.app`
- ISO 3166-1 standard: https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
- FIDE country codes: https://ratings.fide.com/download/fide_country_codes.txt
