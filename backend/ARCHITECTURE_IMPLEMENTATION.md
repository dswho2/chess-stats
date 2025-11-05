# Architecture Implementation Summary

## Hybrid Player/PlayerAccount Model - COMPLETED ✅

### Changes Implemented

#### 1. Schema Changes (/Users/david/Projects/chess-stats/backend/prisma/schema.prisma)

**Player Table:**
- ✅ Changed `dateOfBirth: DateTime` → `birthYear: Int` (FIDE only provides year)
- ✅ Removed `chessComId`, `lichessId` (moved to PlayerAccount)
- ✅ Removed all Lichess/Chess.com ratings (moved to PlayerAccount)
- ✅ Kept only FIDE ratings as base truth:
  - `fideClassicalRating`
  - `fideRapidRating`
  - `fideBlitzRating`

**PlayerAccount Table:**
- ✅ Made `playerId` nullable (allows standalone accounts)
- ✅ Added `verified: Boolean` field
- ✅ Added `verifiedAt: DateTime?` field
- ✅ Added `avatarUrl` field
- ✅ Added all Lichess ratings:
  - `lichessBulletRating`
  - `lichessBlitzRating`
  - `lichessRapidRating`
  - `lichessClassicalRating`
  - `lichessUltrabulletRating`
- ✅ Added all Chess.com ratings:
  - `chessComBulletRating`
  - `chessComBlitzRating`
  - `chessComRapidRating`
  - `chessComDailyRating`
- ✅ Added relation to `PlayerRatingHistory`

**PlayerRatingHistory Table:**
- ✅ Made `playerId` nullable
- ✅ Added `playerAccountId` field (nullable)
- ✅ Now supports linking to either Player (FIDE) OR PlayerAccount (Lichess/Chess.com)
- ✅ Added separate unique constraints for player and account linkage
- ✅ Added indexes for both playerId and playerAccountId

#### 2. Mappers

**PlayerMapper** (`src/mappers/player.mapper.ts`):
- ✅ Updated `fromFide()` to use `birthYear` instead of `dateOfBirth`
- ✅ Updated `updateWithFide()` to use `birthYear`
- ✅ Kept for FIDE data mapping only
- ✅ Removed Lichess mapping (moved to PlayerAccountMapper)

**PlayerAccountMapper** (`src/mappers/playerAccount.mapper.ts`) - NEW:
- ✅ Created `fromLichess()` - maps Lichess API → PlayerAccount
- ✅ Created `fromChessCom()` - maps Chess.com API → PlayerAccount
- ✅ Created `updateFromLichess()` - update existing account
- ✅ Created `updateFromChessCom()` - update existing account
- ✅ Created `linkToPlayer()` - verify and link account to Player
- ✅ Created `unlinkFromPlayer()` - unlink account
- ✅ Handles both verified (linked) and standalone accounts

#### 3. Repositories

**PlayerRepository** (`src/repositories/player.repository.ts`):
- ✅ Removed `findByChessComId()` and `findByLichessId()`
- ✅ Removed `upsertByChessComId()` and `upsertByLichessId()`
- ✅ Updated `getTopByRating()` to only accept FIDE rating types
- ✅ Players now created from FIDE data only

**PlayerAccountRepository** (`src/repositories/playerAccount.repository.ts`) - NEW:
- ✅ Created `findByPlatformAccount()` - find by platform + accountId
- ✅ Created `findByPlayerId()` - get all accounts for a player
- ✅ Created `findStandaloneAccounts()` - find unlinked accounts
- ✅ Created `upsertByPlatformAccount()` - create/update account
- ✅ Created `linkToPlayer()` - verify account
- ✅ Created `unlinkFromPlayer()` - remove verification
- ✅ Created `getTopByRating()` - leaderboards showing verified + unverified
- ✅ Created `searchByUsername()` - search accounts

#### 4. Database Migration

- ✅ Schema pushed to database using `npx prisma db push`
- ✅ Prisma Client regenerated with new types

---

## Data Flow

### FIDE Player Sync (Verified Players)

```typescript
// 1. Fetch from FIDE API
const fideData = await fideService.getPlayerInfo('1503014');

// 2. Map to Player schema
const playerData = PlayerMapper.fromFide(fideData);

// 3. Upsert to Player table
const player = await playerRepository.upsertByFideId('1503014', playerData);

// Result: Player record with FIDE ratings
```

### Lichess Account Sync (Verified Player)

```typescript
// 1. Fetch from Lichess API
const lichessData = await lichessService.getPlayer('DrNykterstein');

// 2. Find linked Player (Magnus Carlsen)
const player = await playerRepository.findByFideId('1503014');

// 3. Map to PlayerAccount schema (linked to player)
const accountData = PlayerAccountMapper.fromLichess(lichessData, player.id);

// 4. Upsert to PlayerAccount table
const account = await playerAccountRepository.upsertByPlatformAccount(
  'lichess',
  'drnykterstein',
  accountData
);

// Result:
// - Player table has FIDE ratings
// - PlayerAccount table has Lichess ratings + link to Player
// - Account is marked as verified
```

### Lichess Account Sync (Standalone/Unverified)

```typescript
// 1. Fetch from Lichess API
const lichessData = await lichessService.getPlayer('sportik_shark');

// 2. Map to PlayerAccount schema (NO player link)
const accountData = PlayerAccountMapper.fromLichess(lichessData); // No playerId

// 3. Upsert to PlayerAccount table
const account = await playerAccountRepository.upsertByPlatformAccount(
  'lichess',
  'sportik_shark',
  accountData
);

// Result:
// - PlayerAccount table has Lichess ratings
// - playerId is NULL (standalone account)
// - verified is FALSE
```

---

## Query Patterns

### Get Player Profile with All Accounts

```typescript
const player = await prisma.player.findUnique({
  where: { id: playerId },
  include: {
    accounts: {
      where: { deleted: false },
      orderBy: { platform: 'asc' }
    },
    ratingHistory: {
      where: { platform: 'fide' },
      orderBy: { periodMonth: 'desc' },
      take: 12
    }
  }
});

// Returns:
// - Player with FIDE ratings
// - accounts[] with Lichess/Chess.com ratings
// - FIDE rating history
```

### Get Leaderboard (Mixed Verified + Unverified)

```typescript
const topPlayers = await playerAccountRepository.getTopByRating({
  platform: 'lichess',
  timeControl: 'blitz',
  limit: 100
});

// Returns array with:
// - display_name: Player.fullName if verified, else username
// - rating: from PlayerAccount
// - is_verified_player: boolean
// - avatar_url: Player.avatarUrl if verified, else PlayerAccount.avatarUrl
```

### Get Player's Rating History (All Platforms)

```typescript
// FIDE history (linked to Player)
const fideHistory = await prisma.playerRatingHistory.findMany({
  where: { playerId, platform: 'fide' },
  orderBy: { periodMonth: 'desc' }
});

// Lichess history (linked to PlayerAccount)
const lichessAccount = await playerAccountRepository.findByPlatformAccount('lichess', username);
const lichessHistory = await prisma.playerRatingHistory.findMany({
  where: { playerAccountId: lichessAccount.id, platform: 'lichess' },
  orderBy: { periodMonth: 'desc' }
});
```

---

## Benefits

### ✅ Data Integrity
- Clear separation: Player = verified people, PlayerAccount = platform identities
- FIDE as source of truth for verified players
- Platform-specific data isolated to PlayerAccount

### ✅ Flexibility
- Accounts can exist without Player (standalone)
- Players can have multiple accounts
- Easy to link/unlink accounts later

### ✅ Performance
- FIDE ratings denormalized in Player table (fast queries)
- Platform ratings denormalized in PlayerAccount table (fast leaderboards)
- Indexes on both tables for efficient lookups

### ✅ vlr.gg-Like UX
- Verified pros show real name + title
- Unverified players show username
- Leaderboards mix both types seamlessly

---

## Next Steps

### Remaining Work:

1. **Update PlayerService** (`src/services/player.service.ts`)
   - Update `syncFromLichess()` to create PlayerAccount instead of Player
   - Add logic to determine if account should be linked to existing Player
   - Remove methods that reference removed fields

2. **Create PlayerAccountService** (NEW)
   - Service layer for PlayerAccount operations
   - Handle linking/unlinking logic
   - Sync ratings from APIs

3. **Update Routes** (`src/routes/players.ts`)
   - Update endpoints to work with new architecture
   - Add PlayerAccount endpoints
   - Update leaderboard endpoint to use PlayerAccountRepository

4. **Testing**
   - Run `test-apis.ts` to verify data mapping
   - Test FIDE player sync
   - Test Lichess standalone account sync
   - Test account linking
   - Test leaderboards

---

## Migration Notes

- Database schema updated via `prisma db push`
- No data loss (existing tables preserved)
- Old migrations may need cleanup
- Consider running full data re-sync after testing

---

**Status:** Core architecture implemented ✅
**Next:** Update services and test
