# Data Requirements - Chess Stats Platform

Comprehensive list of all data needed to support the frontend features.

## ✅ What We Have (Available Now)

### 1. FIDE Player Data
**Source:** `fide-api.vercel.app` (Already deployed!)
**Status:** ✅ Ready to use
**Coverage:**
- Top players list (all time controls)
- Player profiles (name, title, federation, ratings)
- Rating history over time
- Standard, rapid, and blitz ratings

**What's Missing:**
- ❌ FIDE tournament results (need web scraping)
- ❌ Historical tournament participation

---

### 2. Chess.com Titled Tuesday (Historical)
**Source:** `github.com/cmgchess/Titled-Tuesday-Data`
**Status:** ✅ Ready to import
**Coverage:**
- Complete history: 2014-2025
- Winners and standings
- Tournament metadata
- Organized by year

**What's Missing:**
- ❌ Game-level data (moves, PGNs)
- ❌ Round-by-round pairings
- ❌ Real-time updates (need scraper for new tournaments)

---

### 3. Chess.com PubAPI
**Source:** `api.chess.com/pub`
**Status:** ✅ Available (with rate limits)
**Coverage:**
- Player profiles and stats
- Player game archives (monthly PGN dumps)
- Tournament details (if you have the tournament ID)
- Current leaderboards
- Titled players list

**What's Missing:**
- ❌ Easy discovery of all tournaments (limited search)
- ❌ Historical tournament browsing (only ~7 pages on website)

---

### 4. Lichess API
**Source:** `lichess.org/api`
**Status:** ✅ Excellent API available
**Coverage:**
- Current and recent tournaments
- Tournament details (standings, pairings, games)
- Player profiles and statistics
- Game exports (PGN with metadata)
- Swiss and Arena tournaments
- Real-time data

**What's Missing:**
- ❌ Nothing! Lichess API is comprehensive

---

### 5. Lichess Game Database
**Source:** `database.lichess.org`
**Status:** ✅ Available (monthly dumps)
**Coverage:**
- ALL rated games (millions)
- Monthly PGN exports
- Full game history

**What's Missing:**
- ❌ Very large files (need selective filtering)
- ❌ Not tournament-specific (need to filter by tags)

---

## ❌ What We Need to Build

### Priority 1: Core Tournament Data

#### 1.1 Chess.com Tournament Discovery
**Problem:** Can't easily find all tournaments (past/present)
**Solutions:**
- ✅ Use Titled Tuesday historical repo for past data
- ⚠️ Build scraper for new Titled Tuesday events
- ⚠️ Generate tournament IDs based on date patterns
- ⚠️ Scrape player tournament history to discover events

**Implementation:**
```typescript
// Generate Titled Tuesday IDs
function generateTitledTuesdayIds(year: number, month: number) {
  const tuesdays = getTuesdaysInMonth(year, month);
  return tuesdays.flatMap(date => [
    `titled-tuesday-blitz-early-${formatDate(date)}`,
    `titled-tuesday-blitz-late-${formatDate(date)}`
  ]);
}

// Then fetch each tournament
const tournament = await chessComAPI.getTournament(tournamentId);
```

---

#### 1.2 Lichess Tournament History
**Problem:** API shows recent tournaments, need historical archive
**Solution:**
- ✅ Current tournaments via API
- ⚠️ Build scraper for historical Titled Arenas
- ⚠️ Store tournament IDs and fetch details

**Data Available:**
- Tournament info: `/api/tournament/{id}`
- Results: `/api/tournament/{id}/results`
- Games: `/api/tournament/{id}/games`

**Implementation:**
```typescript
// Strategy 1: Scrape known tournament series
const titledArenaIds = [
  'march2024titled',
  'april2024titled',
  // ... etc
];

// Strategy 2: Use Lichess arena rankings dataset (1.7M files)
// (Mentioned in research - need to find/contact maintainer)
```

---

#### 1.3 FIDE Tournament Results
**Problem:** No official API for tournament data
**Solution:**
- ⚠️ Web scraping (Chess-Results.com hosts 40,000+ tournaments)
- ⚠️ Focus on major events only for MVP:
  - World Championship
  - Candidates Tournament
  - Grand Swiss
  - Continental Championships

**Implementation:**
```typescript
// Use Playwright to scrape chess-results.com
async function scrapeFideTournament(tournamentId: number) {
  const url = `https://chess-results.com/tnr${tournamentId}.aspx?lan=1`;
  // Scrape standings table, player info, pairings
}
```

**Challenges:**
- HTML structure may change
- Need respectful rate limiting
- Manual discovery of tournament IDs

---

### Priority 2: Player Data Integration

#### 2.1 Unified Player Profiles
**Problem:** Players exist on multiple platforms with different usernames
**Solution:**
- ⚠️ Create player matching/linking system
- ⚠️ Manual curation for top players
- ⚠️ Fuzzy matching algorithm for others

**Data to Link:**
```typescript
interface UnifiedPlayer {
  // Our internal ID
  id: string;

  // Platform-specific usernames
  fideId?: string;
  chessComUsername?: string;
  lichessUsername?: string;

  // Unified data
  name: string;
  title: string;
  country: string;

  // All ratings
  fideClassical?: number;
  fideRapid?: number;
  fideBlitz?: number;
  chessComBullet?: number;
  chessComBlitz?: number;
  chessComRapid?: number;
  lichessBullet?: number;
  lichessBlitz?: number;
  lichessRapid?: number;
}
```

**Implementation Strategy:**
1. Start with manual mapping for top 100 players
2. Use FIDE as source of truth for titled players
3. Match by name similarity + title
4. Allow community contributions (future)

---

#### 2.2 Player Statistics Calculation
**Problem:** Need aggregated stats across all tournaments
**Solution:**
- ⚠️ Build calculation service
- ⚠️ Store in `player_stats` table
- ⚠️ Update periodically

**Stats to Calculate:**
```typescript
interface PlayerStats {
  // Tournament participation
  tournamentsPlayed: number;
  totalGames: number;

  // Performance
  wins: number;
  draws: number;
  losses: number;
  winRate: number;

  // Rankings
  averagePlacement: number;
  bestPerformanceRating: number;
  bestTournamentResult: {
    tournamentId: string;
    rank: number;
    date: string;
  };

  // Trends
  recentForm: number; // Last 10 tournaments
  peakRating: number;
  peakRatingDate: string;
}
```

---

### Priority 3: Game Data

#### 3.1 Game Storage
**Problem:** PGN files and game moves need storage
**Solution:**
- ⚠️ Store moves as text in database (for now)
- ⚠️ Link to original PGN URLs when available
- ⚠️ Future: Parse and store as structured data

**What We Need:**
```typescript
interface Game {
  id: string;
  tournamentId: string;
  round: number;
  whitePlayer: string;
  blackPlayer: string;
  result: '1-0' | '0-1' | '1/2-1/2';
  opening: string;
  openingEco: string; // E.g., "E60"
  moves: string; // PGN format
  pgnUrl?: string; // Link to original
  analysisUrl?: string; // Link to analysis
}
```

**Sources:**
- Chess.com: Player game archives (monthly)
- Lichess: Tournament games API
- FIDE: Not available (would need to scrape)

---

#### 3.2 Opening Analysis
**Problem:** Identify popular openings in tournaments
**Solution:**
- ⚠️ Parse ECO codes from PGN
- ⚠️ Aggregate by tournament
- ⚠️ Calculate opening frequencies

**Future Feature:**
```typescript
interface TournamentOpeningStats {
  tournamentId: string;
  topOpenings: Array<{
    eco: string;
    name: string;
    gamesPlayed: number;
    whiteWinRate: number;
  }>;
}
```

---

### Priority 4: Real-Time & Live Data

#### 4.1 Live Tournament Updates
**Problem:** Show ongoing tournaments with current standings
**Solution:**
- ✅ Lichess: Real-time via API
- ⚠️ Chess.com: Polling (data updates every 24 hours max)
- ❌ FIDE: Not real-time (OTB tournaments update slowly)

**Implementation:**
```typescript
// Option 1: Polling (simpler)
setInterval(async () => {
  const ongoingTournaments = await db.tournaments.findMany({
    where: { status: 'ongoing' }
  });

  for (const tournament of ongoingTournaments) {
    await updateTournamentData(tournament.id);
  }
}, 5 * 60 * 1000); // Every 5 minutes

// Option 2: WebSockets (future)
// For Lichess tournaments only
```

---

### Priority 5: Rankings & Leaderboards

#### 5.1 Cross-Platform Rankings
**Problem:** Need unified rankings across all platforms
**Solution:**
- ✅ FIDE: Available via fide-api
- ⚠️ Chess.com: Use leaderboards endpoint
- ⚠️ Lichess: Use `/api/player/top` endpoint

**Data Needed:**
```typescript
interface Ranking {
  type: 'fide-classical' | 'fide-rapid' | 'fide-blitz' |
        'chess-com-bullet' | 'chess-com-blitz' | 'chess-com-rapid' |
        'lichess-bullet' | 'lichess-blitz' | 'lichess-rapid';
  updatedAt: Date;
  players: Array<{
    rank: number;
    playerId: string;
    playerName: string;
    rating: number;
    change?: number; // Rating change from last update
  }>;
}
```

**Implementation:**
```typescript
// Chess.com
const chessComLeaderboards = await fetch('https://api.chess.com/pub/leaderboards');

// Lichess
const lichessTop = await fetch('https://lichess.org/api/player/top/50/blitz');

// FIDE (already have via fide-api)
const fideTop = await fetch('https://fide-api.vercel.app/top');
```

---

## 📊 Data Requirements Summary

### Must Have for MVP

| Data Type | Source | Status | Effort |
|-----------|--------|--------|--------|
| Top players (FIDE) | fide-api | ✅ Ready | None |
| Titled Tuesday history | GitHub repo | ✅ Ready | Import script |
| Lichess tournaments | Lichess API | ✅ Ready | Service + scraper |
| Chess.com new tournaments | Chess.com API | ⚠️ Need | Scraper |
| Player profiles | Multiple sources | ⚠️ Need | Matching system |
| Tournament standings | Multiple sources | ⚠️ Need | Normalization |

### Nice to Have (Phase 2)

| Data Type | Source | Status | Effort |
|-----------|--------|--------|--------|
| FIDE tournaments | Chess-Results scraping | ❌ Not built | High |
| Game-level data | PGN parsing | ❌ Not built | Medium |
| Opening statistics | PGN analysis | ❌ Not built | Medium |
| Real-time updates | WebSockets | ❌ Not built | High |
| Historical rankings | Manual data collection | ❌ Not built | High |

### Future Features

| Data Type | Source | Status | Effort |
|-----------|--------|--------|--------|
| Player head-to-head | Cross-reference games | ❌ Not built | Medium |
| Team statistics | Tournament results | ❌ Not built | Medium |
| Opening repertoire | Player game analysis | ❌ Not built | High |
| Performance trends | Historical data analysis | ❌ Not built | Medium |
| Predictions | ML models | ❌ Not built | Very High |

---

## 🎯 Implementation Roadmap

### Week 1: Proof of Concept ✅
- [x] Set up backend project
- [x] Integrate FIDE API
- [x] Create GET /api/players/top endpoint
- [x] Test from frontend

### Week 2: Core Data Integration
- [ ] Import Titled Tuesday historical data from GitHub
- [ ] Build Lichess tournament scraper
- [ ] Create player matching system (manual for top 100)
- [ ] Build tournament endpoints

### Week 3: Chess.com Integration
- [ ] Install chess-web-api npm package
- [ ] Build Titled Tuesday scraper (for new tournaments)
- [ ] Integrate player profiles
- [ ] Add games data

### Week 4: Rankings & Polish
- [ ] Fetch and store rankings from all platforms
- [ ] Build search functionality
- [ ] Add caching with Redis
- [ ] Deploy to production

### Future Phases
- Phase 2: FIDE tournament scraping (major events only)
- Phase 3: Opening analysis and statistics
- Phase 4: Real-time updates with WebSockets
- Phase 5: Advanced analytics and predictions

---

## 🔑 Key Decisions Needed

1. **Player Matching Strategy**
   - Manual curation vs automated matching?
   - Start with top 100 players manually?

2. **Game Storage**
   - Store all games vs just tournament results?
   - PGN text vs parsed moves in JSON?

3. **Real-Time Updates**
   - Polling vs WebSockets?
   - Update frequency for live tournaments?

4. **FIDE Tournament Coverage**
   - Which tournaments to scrape?
   - Focus on titled players only?

5. **Historical Data Depth**
   - How far back to go?
   - Start with 2020+ or full history?

---

## 📝 Next Actions

**Immediate (This Week):**
1. Test the proof of concept (`GET /api/players/top`)
2. Verify frontend can connect to backend
3. Decide on player matching strategy

**Next Week:**
1. Write import script for Titled Tuesday historical data
2. Build Lichess tournament scraper
3. Create database migrations with Prisma
4. Start populating database

**Questions to Answer:**
- Do we need all historical data from day 1, or can we backfill?
- Which tournaments are most important to our users?
- Should we focus on titled players only initially?

---

**Document Version:** 1.0
**Last Updated:** 2025-10-29
**Status:** Planning Complete → Ready for Implementation
