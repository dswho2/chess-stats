# Frontend-Backend API Integration

This directory contains the API client and React hooks for integrating with the Chess Stats backend.

## Architecture Overview

```
Frontend (Next.js)  →  API Client  →  Backend (Express)  →  Cache/External APIs
     ↓                      ↓              ↓                        ↓
  React Hooks        TypeScript Types   Middleware          Lichess/FIDE/Chess.com
```

## Files

- **`types.ts`** - TypeScript types for API requests/responses
- **`client.ts`** - API client functions for making requests
- **`../hooks/useTournaments.ts`** - React hooks for tournament data
- **`../hooks/usePlayers.ts`** - React hooks for player data

## Usage Examples

### 1. Fetching Current Tournaments

```tsx
'use client';

import { useCurrentTournaments } from '@/lib/hooks';

export function TournamentsPage() {
  const { data, loading, error } = useCurrentTournaments();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return (
    <div>
      <h1>Ongoing Tournaments</h1>
      {data.data.started.map(tournament => (
        <div key={tournament.id}>
          <h2>{tournament.fullName}</h2>
          <p>Players: {tournament.nbPlayers}</p>
        </div>
      ))}
    </div>
  );
}
```

### 2. Fetching a Specific Tournament

```tsx
'use client';

import { useTournament } from '@/lib/hooks';

export function TournamentDetail({ id }: { id: string }) {
  const { data, loading, error } = useTournament('lichess', id);

  if (loading) return <div>Loading tournament...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return (
    <div>
      <h1>{data.fullName}</h1>
      <p>Status: {data.isFinished ? 'Completed' : 'Ongoing'}</p>
      <p>Participants: {data.nbPlayers}</p>
    </div>
  );
}
```

### 3. Fetching Tournament Standings

```tsx
'use client';

import { useTournamentStandings } from '@/lib/hooks';

export function Standings({ tournamentId }: { tournamentId: string }) {
  const { data, loading, error } = useTournamentStandings('lichess', tournamentId, 100);

  if (loading) return <div>Loading standings...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Player</th>
          <th>Score</th>
        </tr>
      </thead>
      <tbody>
        {data.map((standing, index) => (
          <tr key={index}>
            <td>{standing.rank}</td>
            <td>{standing.name}</td>
            <td>{standing.score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 4. Fetching Top Players

```tsx
'use client';

import { useLichessTopPlayers } from '@/lib/hooks';

export function TopPlayers() {
  const { data, loading, error } = useLichessTopPlayers('blitz', 100);

  if (loading) return <div>Loading top players...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data.map((player, index) => (
        <li key={player.id}>
          {index + 1}. {player.username} - {player.perfs.blitz?.rating}
        </li>
      ))}
    </ul>
  );
}
```

### 5. Using the API Client Directly

```tsx
import api from '@/lib/api/client';

// In an async function or server component
async function fetchData() {
  try {
    // Get current tournaments
    const tournaments = await api.tournaments.getCurrent();
    console.log(tournaments);

    // Get specific tournament
    const tournament = await api.tournaments.getById('lichess', 'abc123');
    console.log(tournament);

    // Get top FIDE players
    const topPlayers = await api.players.getFideTop();
    console.log(topPlayers);

  } catch (error) {
    console.error('API Error:', error);
  }
}
```

## Environment Variables

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

For production:
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
```

## API Endpoints

### Tournaments

| Method | Endpoint | Description | Cache TTL |
|--------|----------|-------------|-----------|
| GET | `/tournaments` | Get current tournaments | 5 min |
| GET | `/tournaments/lichess/:id` | Get tournament by ID | Adaptive |
| GET | `/tournaments/lichess/:id/results` | Get standings | 5 min |
| GET | `/tournaments/lichess/:id/games` | Get games | 10 min |
| GET | `/tournaments/swiss/:id` | Get Swiss tournament | 10 min |

### Players

| Method | Endpoint | Description | Cache TTL |
|--------|----------|-------------|-----------|
| GET | `/players/top` | Get top FIDE players | 1 hour |
| GET | `/players/fide/:id` | Get FIDE player | 1 hour |
| GET | `/players/fide/:id/history` | Get rating history | 1 hour |
| GET | `/players/lichess/top/:perfType` | Get top Lichess players | 30 min |
| GET | `/players/lichess/:username` | Get Lichess player | 1 hour |
| GET | `/players/lichess/:username/games` | Get player games | 10 min |

## Caching

The backend implements intelligent caching:

- **Live tournaments**: 5 minutes
- **Completed tournaments**: Permanent
- **Player profiles**: 1 hour
- **Rankings**: 30 minutes - 1 hour
- **Games lists**: 10 minutes

Cache headers are returned in responses:
- `X-Cache: HIT` or `X-Cache: MISS`
- `X-Cache-Key: <cache-key>`

## Error Handling

All hooks follow the same pattern:

```tsx
const { data, loading, error } = useHook();

// Always check states
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return null;

// Safe to use data here
```

## TypeScript Types

All API responses are fully typed. Import types from:

```tsx
import type {
  Tournament,
  Player,
  Game,
  TournamentStanding,
  // ... etc
} from '@/lib/api/types';
```

## Future Enhancements

When the backend integrates Redis + PostgreSQL:

1. **No frontend changes needed** - API client remains the same
2. **Faster responses** - Backend will serve from Redis cache
3. **Background jobs** - Data will be pre-fetched and kept fresh
4. **Better reliability** - PostgreSQL provides data persistence

## Migration from Mock Data

To migrate from mock data to real API:

1. Replace mock data imports:
```tsx
// Before
import { mockTournaments } from '@/lib/mockData';

// After
import { useCurrentTournaments } from '@/lib/hooks';
const { data, loading, error } = useCurrentTournaments();
```

2. Update component logic to handle loading/error states

3. Map the data structure if needed (types are compatible)

## Testing

Test the integration:

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Backend runs on http://localhost:4000
4. Frontend runs on http://localhost:3000
5. Check browser console for API calls

## Troubleshooting

**CORS errors?**
- Make sure backend is running
- Check `FRONTEND_URL` in backend `.env`
- Backend should allow origin: `http://localhost:3000`

**404 errors?**
- Verify `NEXT_PUBLIC_API_URL` in frontend `.env.local`
- Check backend routes are registered in `src/index.ts`

**Type errors?**
- Make sure TypeScript types match between frontend/backend
- Run `npm run build` to check for type issues
