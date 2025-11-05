# Architecture Changes - Player & Rating System

## Problem Statement

1. **Date of Birth**: FIDE API only provides birth year, not full date
2. **Player Identity**: Lichess/Chess.com give usernames, not real names
3. **Rating Storage**: Where should platform-specific ratings live?
4. **Leaderboards**: How to show rankings for both verified players and unlinked accounts?

---

## Proposed Solution: Hybrid Player/Account Model

### Core Principles

1. **Player Table** = Real, verified chess players (like vlr.gg pro players)
   - Has denormalized current ratings for performance
   - Optional - not every platform account needs a Player record

2. **PlayerAccount Table** = Platform identities (usernames)
   - Can be linked to Player OR standalone
   - Stores platform-specific metadata (username, avatar, etc.)
   - Does NOT store ratings (those go in Player or history)

3. **PlayerRatingHistory** = Historical ratings
   - Can link to Player OR PlayerAccount
   - Used for charts and peak rating calculations

---

## Schema Changes Required

### 1. Player Table Changes

```prisma
model Player {
  // ... existing fields ...

  // CHANGE: dateOfBirth -> birthYear
  // OLD: dateOfBirth DateTime? @map("date_of_birth") @db.Date
  birthYear Int? @map("birth_year") // Just the year: 1990

  // Keep denormalized current ratings (performance)
  fideClassicalRating Int? @map("fide_classical_rating")
  lichessBlitzRating Int? @map("lichess_blitz_rating")
  // ... etc
}
```

### 2. PlayerAccount Table Changes

```prisma
model PlayerAccount {
  id String @id @default(uuid()) @db.Uuid

  // CHANGE: Make playerId nullable
  // This allows standalone accounts (not linked to verified Player)
  playerId String? @map("player_id") @db.Uuid
  player   Player? @relation(fields: [playerId], references: [id], onDelete: SetNull)

  // Platform info
  platform   String  @db.VarChar(50) // chess-com, lichess, fide
  accountId  String  @map("account_id") @db.VarChar(255)
  username   String? @db.VarChar(255)

  // NEW: Verification status
  verified Boolean @default(false) // Is this verified as belonging to Player?
  verifiedAt DateTime? @map("verified_at") @db.Timestamptz(6)

  // Metadata (NO ratings here - they're in Player table)
  profileUrl String? @map("profile_url") @db.Text
  avatarUrl  String? @map("avatar_url") @db.Text
  metadata   Json?   @db.JsonB

  // Status
  deleted   Boolean   @default(false)
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  // Relations
  ratingHistory PlayerRatingHistory[]

  // Unique: One account per platform per user
  @@unique([platform, accountId], name: "player_accounts_platform_account_key")
  @@index([playerId])
  @@index([platform])
  @@map("player_accounts")
}
```

### 3. PlayerRatingHistory Changes

```prisma
model PlayerRatingHistory {
  id String @id @default(uuid()) @db.Uuid

  // CHANGE: Support linking to Player OR standalone PlayerAccount
  playerId        String? @map("player_id") @db.Uuid
  playerAccountId String? @map("player_account_id") @db.Uuid

  // At least one must be set
  player        Player?        @relation(fields: [playerId], references: [id], onDelete: Cascade)
  playerAccount PlayerAccount? @relation(fields: [playerAccountId], references: [id], onDelete: Cascade)

  // Period & Rating
  periodMonth DateTime @map("period_month") @db.Date
  platform    String   @db.VarChar(50)
  timeControl String   @map("time_control") @db.VarChar(50)

  rating        Int
  ratingChange  Int? @map("rating_change")
  gamesPlayed   Int? @map("games_played")

  // Rankings
  rankInCountry Int? @map("rank_in_country")
  rankWorldwide Int? @map("rank_worldwide")

  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  // Constraint: Must have either playerId or playerAccountId
  @@check(sql: "(player_id IS NOT NULL) OR (player_account_id IS NOT NULL)")

  // Unique per period per player/account
  @@unique([playerId, periodMonth, platform, timeControl], name: "player_rating_history_player_unique")
  @@unique([playerAccountId, periodMonth, platform, timeControl], name: "player_rating_history_account_unique")

  @@index([playerId])
  @@index([playerAccountId])
  @@index([platform, timeControl])
  @@map("player_rating_history")
}
```

---

## Data Flow Examples

### Example 1: Syncing Known Player (Magnus)

```typescript
// Step 1: Create/update Player record
const player = await playerRepository.upsertByFideId('1503014', {
  fullName: 'Carlsen, Magnus',
  fideId: '1503014',
  birthYear: 1990,
  fideClassicalRating: 2839,
  lichessId: 'drnykterstein',
  lichessBlitzRating: 3131
});

// Step 2: Create/update PlayerAccount for Lichess
await playerAccountRepository.upsert({
  playerId: player.id,  // Linked!
  platform: 'lichess',
  accountId: 'drnykterstein',
  username: 'DrNykterstein',
  verified: true
});

// Step 3: Store rating history (linked to Player)
await ratingHistoryRepository.create({
  playerId: player.id,
  platform: 'lichess',
  timeControl: 'blitz',
  rating: 3131,
  periodMonth: new Date('2025-11-01')
});
```

### Example 2: Syncing Unknown Player (Lichess-only user)

```typescript
// Step 1: NO Player record created

// Step 2: Create standalone PlayerAccount
const account = await playerAccountRepository.upsert({
  playerId: null,  // Not linked!
  platform: 'lichess',
  accountId: 'sportik_shark',
  username: 'sportik_shark',
  verified: false
});

// Step 3: Store rating history (linked to PlayerAccount)
await ratingHistoryRepository.create({
  playerAccountId: account.id,  // Links to account, not player
  platform: 'lichess',
  timeControl: 'blitz',
  rating: 3029,
  periodMonth: new Date('2025-11-01')
});
```

---

## Query Patterns

### Leaderboards (Mixed verified/unverified)

```typescript
// Get top Lichess blitz players
// Shows both verified players (with real names) and unverified accounts (with usernames)
const topPlayers = await prisma.$queryRaw`
  SELECT
    p.id as player_id,
    pa.id as account_id,
    COALESCE(p.full_name, pa.username) as display_name,
    pa.username as lichess_username,
    p.title,
    p.lichess_blitz_rating as rating,
    p.avatar_url as player_avatar,
    pa.avatar_url as account_avatar,
    (p.id IS NOT NULL) as is_verified_player
  FROM player_accounts pa
  LEFT JOIN players p ON pa.player_id = p.id
  WHERE pa.platform = 'lichess'
    AND pa.deleted = false
    AND (p.lichess_blitz_rating IS NOT NULL OR pa.id IS NOT NULL)
  ORDER BY p.lichess_blitz_rating DESC NULLS LAST
  LIMIT 100
`;
```

### Get Player with All Accounts

```typescript
const playerWithAccounts = await prisma.player.findUnique({
  where: { id: playerId },
  include: {
    accounts: {
      where: { deleted: false },
      select: {
        platform: true,
        username: true,
        accountId: true,
        profileUrl: true,
        verified: true
      }
    }
  }
});
```

---

## Implementation Strategy

### Phase 1: Schema Migration

1. Add `birthYear` field to Player
2. Make `PlayerAccount.playerId` nullable
3. Add `verified` field to PlayerAccount
4. Add `playerAccountId` to PlayerRatingHistory
5. Add database constraints

### Phase 2: Update Mappers

1. **PlayerMapper.fromFide()** - Use birthYear instead of dateOfBirth
2. **PlayerMapper.fromLichess()** - Return PlayerAccount data instead
3. Create **PlayerAccountMapper** for unlinked accounts

### Phase 3: Update Services

1. **PlayerService.syncFromLichess()** - Check if known player, else create standalone account
2. **PlayerService.linkAccount()** - New method to link account to player
3. **LeaderboardService** - New service for ranking queries

### Phase 4: Frontend Updates

1. Display username for unlinked accounts
2. Display real name for verified players
3. Show verification badge for linked accounts

---

## Benefits of This Approach

✅ **Flexibility**: Can have players with no accounts, accounts with no players
✅ **Performance**: Current ratings denormalized in Player table (fast leaderboards)
✅ **Data Integrity**: Clear separation between verified players and platform identities
✅ **vlr.gg-like**: Verified pros get full profiles, others show with username
✅ **Future-proof**: Easy to add account linking/verification later
✅ **Historical Data**: PlayerRatingHistory works for both linked and unlinked

---

## Migration Script Needed

```typescript
// Migrate dateOfBirth to birthYear
UPDATE players
SET birth_year = EXTRACT(YEAR FROM date_of_birth)
WHERE date_of_birth IS NOT NULL;

// Then drop dateOfBirth column in Prisma schema
```

---

## Decision: Proceed with this architecture?

This keeps your core insight (PlayerAccount can be standalone) while optimizing for:
1. **vlr.gg use case** - verified players get full profiles
2. **Performance** - denormalized ratings for fast queries
3. **Flexibility** - supports both known and unknown players
4. **Data integrity** - clear boundaries between player and account

Let me know if you want to proceed with implementing these changes!
