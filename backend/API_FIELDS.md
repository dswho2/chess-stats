# API Fields Reference

This document lists all available fields from each endpoint to help with frontend integration.

## Lichess Tournament Endpoints

### GET /api/tournaments

Returns tournaments organized by status (created, started, finished).

**Fields available for each tournament:**
```typescript
{
  id: string                      // Tournament ID
  fullName: string                // Tournament name
  startsAt: number | string       // Start time (timestamp or ISO)
  finishesAt?: number | string    // End time (may be null for ongoing)
  status: number                  // Status code (10=created, 20=started, 30=finished)
  nbPlayers: number               // Number of participants
  minutes: number                 // Duration in minutes
  rated: boolean                  // Whether games are rated
  system: 'arena' | 'swiss'       // Tournament format

  perf: {
    key: string                   // 'bullet', 'blitz', 'rapid', 'classical'
    name: string                  // Display name
    icon: string                  // Icon character
  }

  clock: {
    limit: number                 // Time limit in seconds
    increment: number             // Increment per move in seconds
  }

  // Finished tournaments only
  winner?: {
    id: string
    name: string
  }

  // Scheduled tournaments
  schedule?: {
    freq: string                  // 'hourly', 'daily', 'eastern', 'weekly', 'monthly', 'shield'
    speed: string                 // 'bullet', 'superBlitz', 'blitz', 'rapid'
  }
}
```

**Example response:**
```json
{
  "success": true,
  "data": {
    "created": [/* 91 upcoming tournaments */],
    "started": [/* 8 ongoing tournaments */],
    "finished": [/* 20 finished tournaments */]
  },
  "counts": {
    "created": 91,
    "started": 8,
    "finished": 20
  },
  "source": "Lichess",
  "timestamp": "2025-10-30T06:21:09.881Z"
}
```

---

### GET /api/tournaments/lichess/:id

Returns detailed information about a specific tournament.

**Additional fields (beyond those in list above):**
```typescript
{
  isFinished: boolean             // Whether tournament is complete
  createdBy: string               // Username of tournament creator

  // Tournament statistics (available for ongoing/finished)
  stats?: {
    games: number                 // Total games played
    moves: number                 // Total moves made
    whiteWins: number             // Games won by white
    blackWins: number             // Games won by black
    draws: number                 // Drawn games
    berserks: number              // Berserk sacrifices made
    averageRating: number         // Average player rating
  }

  // Top 3 finishers (finished tournaments)
  podium?: Array<{
    name: string                  // Player username
    rank: number                  // 1, 2, or 3
    rating: number                // Player rating
    score: number                 // Tournament points
    flair?: string                // Player flair/badge
    performance?: number          // Performance rating
    nb: {
      game: number                // Games played
      berserk: number             // Berserks used
      win: number                 // Games won
    }
  }>

  // Current standings (ongoing tournaments)
  standing?: {
    page: number                  // Current page
    players: Array<{...}>         // Top 10 players
  }
}
```

**Example response:**
```json
{
  "success": true,
  "data": {
    "id": "BHXpWxFY",
    "fullName": "Eastern SuperBlitz Arena",
    "startsAt": "2025-10-30T05:00:00Z",
    "isFinished": true,
    "nbPlayers": 1172,
    "stats": {
      "games": 3078,
      "moves": 213222,
      "whiteWins": 1579,
      "blackWins": 1400,
      "draws": 99,
      "berserks": 819,
      "averageRating": 1726
    },
    "podium": [
      {
        "name": "JimMorrisonGM",
        "rank": 1,
        "rating": 2241,
        "score": 67,
        "performance": 2383,
        "nb": {
          "game": 18,
          "berserk": 18,
          "win": 15
        }
      }
    ],
    "schedule": {
      "freq": "eastern",
      "speed": "superBlitz"
    }
  },
  "source": "Lichess",
  "timestamp": "2025-10-30T06:21:36.527Z"
}
```

---

### GET /api/tournaments/lichess/:id/results

Returns tournament standings/results.

**Fields:**
```typescript
{
  rank: number                    // Player placement
  username: string                // Player username
  rating: number                  // Player rating
  score: number                   // Tournament points
  performance: number             // Performance rating
  flair?: string                  // Player badge/flair
}
```

**Example response:**
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "score": 67,
      "rating": 2241,
      "username": "JimMorrisonGM",
      "performance": 2383
    }
  ],
  "count": 10,
  "source": "Lichess",
  "timestamp": "2025-10-30T06:23:57.421Z"
}
```

---

### GET /api/tournaments/lichess/:id/games

Returns games from a tournament.

**Query parameters:**
- `player` - Filter by player username
- `moves` - Include moves (default: true)
- `pgnInJson` - Include PGN (default: true)
- `tags` - Include PGN tags (default: true)
- `opening` - Include opening info (default: true)

**Fields:**
```typescript
{
  id: string                      // Game ID
  rated: boolean                  // Whether rated
  variant: string                 // 'standard', 'chess960', etc.
  speed: string                   // 'bullet', 'blitz', 'rapid', 'classical'
  perf: string                    // Performance category
  createdAt: number               // Game start timestamp
  lastMoveAt: number              // Game end timestamp
  status: string                  // 'mate', 'resign', 'timeout', 'draw'

  players: {
    white: {
      user: {
        name: string              // Username
        title?: string            // GM, IM, FM, etc.
        id: string                // User ID
      }
      rating: number              // Player rating
      ratingDiff?: number         // Rating change (+/-)
    }
    black: {
      // Same structure as white
    }
  }

  winner?: 'white' | 'black'      // Winning side (null for draws)

  opening?: {
    eco: string                   // ECO code (e.g., 'E12')
    name: string                  // Opening name
    ply: number                   // Moves in opening
  }

  moves?: string                  // Space-separated moves (e.g., 'e4 e5 Nf3')
  pgn?: string                    // Full PGN notation
}
```

---

### GET /api/tournaments/swiss/:id

Returns Swiss tournament details.

**Fields:**
```typescript
{
  id: string
  name: string
  createdBy: string
  startsAt: string                // ISO timestamp
  clock: {
    limit: number
    increment: number
  }
  variant: string
  round: number                   // Current round
  nbRounds: number                // Total rounds
  nbPlayers: number               // Total players
  nbOngoing: number               // Games in progress
  status: string                  // 'created', 'started', 'finished'
  rated: boolean

  stats: {
    games: number
    whiteWins: number
    blackWins: number
    draws: number
    byes: number
    absences: number
    averageRating: number
  }
}
```

---

## Lichess Player Endpoints

### GET /api/players/lichess/top/:perfType

Returns top players for a specific rating category.

**Performance types:**
- `bullet`
- `blitz`
- `rapid`
- `classical`
- `ultraBullet`

**Query parameters:**
- `count` - Number of players (default: 100)

**Fields:**
```typescript
{
  id: string                      // User ID
  username: string                // Display name
  title?: string                  // GM, IM, FM, WGM, etc.
  patron?: boolean                // Lichess patron status
  patronColor?: number            // Patron badge color

  perfs: {
    [perfType]: {
      rating: number              // Current rating
      progress: number            // Rating change (recent)
    }
  }

  online?: boolean                // Currently online
}
```

**Example response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "sportik_shark",
      "username": "sportik_shark",
      "title": "IM",
      "perfs": {
        "blitz": {
          "rating": 3026,
          "progress": 0
        }
      }
    }
  ],
  "count": 10,
  "perfType": "blitz",
  "source": "Lichess",
  "timestamp": "2025-10-30T06:23:12.789Z"
}
```

---

### GET /api/players/lichess/:username

Returns complete player profile.

**Fields:**
```typescript
{
  id: string
  username: string
  title?: string                  // GM, IM, etc.
  online?: boolean
  patron?: boolean
  flair?: string                  // Player badge/emoji
  patronColor?: number

  // All rating categories
  perfs: {
    bullet?: {
      games: number
      rating: number
      rd: number                  // Rating deviation
      prog: number                // Progress
      prov?: boolean              // Provisional rating
    }
    blitz?: { /* same structure */ }
    rapid?: { /* same structure */ }
    classical?: { /* same structure */ }
    correspondence?: { /* same structure */ }
    chess960?: { /* same structure */ }
    // ... other variants
  }

  profile?: {
    country?: string              // ISO country code
    bio?: string
    firstName?: string
    lastName?: string
  }

  createdAt: number               // Account creation timestamp
  seenAt?: number                 // Last seen timestamp

  playTime?: {
    total: number                 // Total seconds played
    tv: number                    // Seconds on Lichess TV
  }

  count?: {
    all: number                   // Total games
    rated: number
    ai: number                    // Games vs computer
    draw: number
    drawH: number                 // Draws vs humans
    loss: number
    lossH: number                 // Losses vs humans
    win: number
    winH: number                  // Wins vs humans
  }

  url: string                     // Profile URL

  // If streaming
  streamer?: {
    twitch?: {
      channel: string
    }
  }
}
```

**Example response:**
```json
{
  "success": true,
  "data": {
    "id": "drnykterstein",
    "username": "DrNykterstein",
    "title": "GM",
    "patron": true,
    "flair": "people.santa-claus-light-skin-tone",
    "perfs": {
      "bullet": {
        "games": 9559,
        "rating": 3218,
        "rd": 72,
        "prog": 21
      },
      "blitz": {
        "games": 604,
        "rating": 3131,
        "rd": 151,
        "prog": 22,
        "prov": true
      }
    },
    "count": {
      "all": 10424,
      "rated": 10409,
      "draw": 832,
      "loss": 2405,
      "win": 7187
    },
    "playTime": {
      "total": 1166969,
      "tv": 663342
    }
  },
  "source": "Lichess",
  "timestamp": "2025-10-30T06:23:26.370Z"
}
```

---

### GET /api/players/lichess/:username/games

Returns player's games.

**Query parameters:**
- `max` - Max games to return (default: 20)
- `since` - Start timestamp (milliseconds)
- `until` - End timestamp (milliseconds)
- `rated` - Filter by rated games (true/false)
- `perfType` - Filter by type (bullet, blitz, rapid, etc.)
- `color` - Filter by color (white/black)
- `moves` - Include moves (default: true)
- `pgnInJson` - Include PGN (default: true)
- `opening` - Include opening info (default: true)

**Fields:** Same as tournament games (see above)

---

## FIDE Endpoints

### GET /api/players/top

Returns FIDE top 100 players.

**Fields:**
```typescript
{
  rank: string                    // World ranking
  name: string                    // Full name
  fide_id: string                 // FIDE ID
  country: string                 // ISO country code
  rating: string                  // Classical rating
}
```

**Example response:**
```json
{
  "success": true,
  "data": [
    {
      "rank": "1",
      "name": "Carlsen, Magnus",
      "fide_id": "1503014",
      "country": "NOR",
      "rating": "2839"
    }
  ],
  "count": 100,
  "source": "FIDE",
  "timestamp": "2025-10-30T05:41:12.533Z"
}
```

---

### GET /api/players/fide/:id

Returns player profile by FIDE ID.

**Fields:**
```typescript
{
  fide_id: string
  fide_title: string              // Grandmaster, International Master, etc.
  federation: string              // Country name
  birth_year: number
  sex: string                     // Male/Female
  name: string

  world_rank_all: number
  world_rank_active: number
  continental_rank_all: number
  continental_rank_active: number
  national_rank_all: number
  national_rank_active: number

  classical_rating: number
  rapid_rating: number
  blitz_rating: number
}
```

**Example response:**
```json
{
  "success": true,
  "data": {
    "fide_id": "1503014",
    "fide_title": "Grandmaster",
    "federation": "Norway",
    "birth_year": 1990,
    "sex": "Male",
    "name": "Carlsen, Magnus",
    "world_rank_all": 1,
    "classical_rating": 2839,
    "rapid_rating": 2808,
    "blitz_rating": 2881
  },
  "source": "FIDE",
  "timestamp": "2025-10-30T05:41:32.366Z"
}
```

---

### GET /api/players/fide/:id/history

Returns player rating history.

**Fields:**
```typescript
{
  period: string                  // '2025-Oct'
  classical_rating: number
  classical_games: number         // Games played that month
  rapid_rating: number
  rapid_games: number
  blitz_rating: number
  blitz_games: number
  date: string                    // '2025-10' (for sorting)
}
```

**Example response:**
```json
{
  "success": true,
  "data": [
    {
      "period": "2025-Oct",
      "classical_rating": 2839,
      "classical_games": 0,
      "rapid_rating": 2808,
      "rapid_games": 0,
      "blitz_rating": 2881,
      "blitz_games": 0,
      "date": "2025-10"
    }
  ],
  "source": "FIDE",
  "timestamp": "2025-10-30T05:42:54.123Z"
}
```

---

## Common Response Format

All endpoints follow this response structure:

```typescript
{
  success: boolean                // True if request succeeded
  data: any                       // Response data
  count?: number                  // Number of items (for arrays)
  source: string                  // 'FIDE', 'Lichess', 'Chess.com'
  timestamp: string               // ISO timestamp of response

  // Only for paginated endpoints (future)
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }

  // Only on error
  error?: string
  message?: string
}
```

---

## Date/Time Formats

Lichess uses two formats:
- **Timestamp**: Milliseconds since epoch (e.g., `1761809440000`)
- **ISO String**: ISO 8601 format (e.g., `"2025-10-30T05:00:00Z"`)

FIDE uses:
- **Month String**: Format like `"2025-Oct"` or `"2025-10"`

To display dates in frontend:
```typescript
// For timestamps
new Date(timestamp).toLocaleString()

// For ISO strings
new Date(isoString).toLocaleString()
```

---

## Frontend Integration Examples

### Display Tournament List
```typescript
fetch('http://localhost:4000/api/tournaments')
  .then(r => r.json())
  .then(data => {
    const ongoing = data.data.started;
    ongoing.forEach(t => {
      console.log(`${t.fullName} - ${t.nbPlayers} players`);
      console.log(`Started: ${new Date(t.startsAt).toLocaleString()}`);
    });
  });
```

### Display Top Players
```typescript
fetch('http://localhost:4000/api/players/lichess/top/blitz?count=10')
  .then(r => r.json())
  .then(data => {
    data.data.forEach((p, i) => {
      console.log(`${i+1}. ${p.username} (${p.title || 'No title'}) - ${p.perfs.blitz.rating}`);
    });
  });
```

### Display Tournament Podium
```typescript
fetch('http://localhost:4000/api/tournaments/lichess/BHXpWxFY')
  .then(r => r.json())
  .then(data => {
    if (data.data.podium) {
      data.data.podium.forEach(p => {
        console.log(`${p.rank}. ${p.name} - ${p.score} points (${p.nb.win}/${p.nb.game} wins)`);
      });
    }
  });
```

---

**Last Updated:** 2025-10-30
**API Version:** 1.0
