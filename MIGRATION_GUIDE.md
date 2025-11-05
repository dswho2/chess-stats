# Migration Guide: Mock Data → Real API

## Current Status

### ✅ Already Integrated (Using Real API)
- `/stats` page - Example integration with real data

### ❌ Still Using Mock Data
- `/` (homepage)
- `/rankings`
- `/forum` (forum data only - not related to chess API)
- Individual tournament pages
- Individual player pages

## What Needs to Change

Each page needs to:
1. Replace mock data imports with hooks
2. Add loading states
3. Add error handling
4. Map data structure (if needed)

## Migration Examples

### Example 1: Rankings Page

**Before (Mock Data):**
```typescript
import { mockLichessBlitzRankings } from '@/lib/mockData';

export default function RankingsPage() {
  const rankings = mockLichessBlitzRankings;

  return (
    <table>
      {rankings.map(player => (
        <tr key={player.playerId}>
          <td>{player.rank}</td>
          <td>{player.playerName}</td>
          <td>{player.rating}</td>
        </tr>
      ))}
    </table>
  );
}
```

**After (Real API):**
```typescript
import { useLichessTopPlayers } from '@/lib/hooks';

export default function RankingsPage() {
  const { data, loading, error } = useLichessTopPlayers('blitz', 100);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-2 text-[--color-text-secondary]">Loading rankings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading rankings</p>
        <p className="text-sm text-[--color-text-secondary]">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  // Map the API data structure to match your components
  const rankings = data.map((player, index) => ({
    playerId: player.id,
    rank: index + 1,
    playerName: player.username,
    title: player.title || '',
    rating: player.perfs.blitz?.rating || 0,
    country: player.profile?.country || 'XX',
    ratingChange: player.perfs.blitz?.progress || 0,
  }));

  return (
    <table>
      {rankings.map(player => (
        <tr key={player.playerId}>
          <td>{player.rank}</td>
          <td>{player.playerName}</td>
          <td>{player.rating}</td>
        </tr>
      ))}
    </table>
  );
}
```

### Example 2: Homepage Tournaments

**Before (Mock Data):**
```typescript
import { mockTournaments } from '@/lib/mockData';

export default function Home() {
  const ongoingTournaments = mockTournaments.filter(t => t.status === 'ONGOING');

  return (
    <div>
      {ongoingTournaments.map(tournament => (
        <TournamentCard key={tournament.id} tournament={tournament} />
      ))}
    </div>
  );
}
```

**After (Real API):**
```typescript
import { useCurrentTournaments } from '@/lib/hooks';
import { TournamentStatus } from '@/types';

export default function Home() {
  const { data, loading, error } = useCurrentTournaments();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return null;

  // Map Lichess API data to your TournamentCard component format
  const ongoingTournaments = data.data.started.map(t => ({
    id: t.id,
    name: t.fullName,
    status: TournamentStatus.ONGOING,
    platform: 'Lichess',
    format: t.system === 'arena' ? 'Arena' : 'Swiss',
    timeControl: t.perf.name,
    startDate: new Date(t.startsAt as number),
    endDate: t.finishesAt ? new Date(t.finishesAt as number) : undefined,
    participants: t.nbPlayers || 0,
    featured: false, // You'll need to determine this
  }));

  return (
    <div>
      {ongoingTournaments.map(tournament => (
        <TournamentCard key={tournament.id} tournament={tournament} />
      ))}
    </div>
  );
}
```

## Step-by-Step Migration Plan

### Phase 1: Simple Pages (Low Risk)

Start with pages that are less critical:

1. **Stats Page** ✅ Already done as example
2. **Rankings Page** - Simple data mapping
3. **Players List Page** - Straightforward

### Phase 2: Complex Pages (Medium Risk)

Pages with more components:

4. **Homepage** - Multiple data sources
5. **Tournament Detail Pages** - Complex data structure

### Phase 3: Interactive Features (Higher Risk)

Features that need more work:

6. **Search Functionality** - New endpoint needed
7. **Filters** - Client-side or server-side?
8. **Pagination** - Handle large datasets

## Data Mapping Helper

Create a utility file to map API data to your component types:

```typescript
// frontend/lib/api/mappers.ts

import type { Tournament as ApiTournament } from './types';
import type { Tournament as ComponentTournament } from '@/types';
import { TournamentStatus } from '@/types';

/**
 * Map Lichess API tournament to component format
 */
export function mapLichessTournament(
  apiTournament: ApiTournament
): ComponentTournament {
  return {
    id: apiTournament.id,
    name: apiTournament.fullName,
    status: apiTournament.isFinished
      ? TournamentStatus.COMPLETED
      : TournamentStatus.ONGOING,
    platform: 'Lichess',
    format: apiTournament.system === 'arena' ? 'Arena' : 'Swiss',
    timeControl: apiTournament.perf.name,
    startDate: new Date(apiTournament.startsAt as number),
    endDate: apiTournament.finishesAt
      ? new Date(apiTournament.finishesAt as number)
      : undefined,
    participants: apiTournament.nbPlayers || 0,
    prizePool: undefined, // Not in Lichess API
    featured: false, // Determine based on your criteria
    winner: apiTournament.winner?.name,
  };
}

/**
 * Map Lichess player to component format
 */
export function mapLichessPlayer(apiPlayer: any) {
  return {
    playerId: apiPlayer.id,
    playerName: apiPlayer.username,
    title: apiPlayer.title || '',
    rating: apiPlayer.perfs.blitz?.rating || 0,
    country: apiPlayer.profile?.country || 'XX',
    // ... map other fields
  };
}
```

Then use in your components:

```typescript
import { mapLichessTournament } from '@/lib/api/mappers';

const mappedTournaments = data.data.started.map(mapLichessTournament);
```

## Loading Components

Create reusable loading components:

```typescript
// frontend/components/ui/LoadingSpinner.tsx
export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      <p className="mt-4 text-[--color-text-secondary]">Loading...</p>
    </div>
  );
}

// frontend/components/ui/ErrorMessage.tsx
export function ErrorMessage({ error }: { error: Error }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <p className="text-red-600 font-semibold">Error Loading Data</p>
      <p className="text-sm text-red-500 mt-2">{error.message}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
      >
        Retry
      </button>
    </div>
  );
}
```

## Fallback Strategy

Keep mock data as fallback:

```typescript
import { useCurrentTournaments } from '@/lib/hooks';
import { mockTournaments } from '@/lib/mockData';

export default function Home() {
  const { data, loading, error } = useCurrentTournaments();

  // Fallback to mock data if API fails
  const tournaments = error
    ? mockTournaments
    : data?.data.started.map(mapLichessTournament) || [];

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 mb-4 rounded">
          <p className="text-sm text-yellow-800">
            ⚠️ Using offline data. API connection failed.
          </p>
        </div>
      )}
      {tournaments.map(t => (
        <TournamentCard key={t.id} tournament={t} />
      ))}
    </div>
  );
}
```

## Testing Checklist

Before migrating each page:

- [ ] Identify all mock data imports
- [ ] Find corresponding API hook
- [ ] Create data mapper if needed
- [ ] Add loading state
- [ ] Add error handling
- [ ] Test with backend running
- [ ] Test with backend stopped (error case)
- [ ] Test with slow network
- [ ] Verify data displays correctly
- [ ] Check TypeScript types

## Gradual Migration Approach

### Option 1: Feature Flag
```typescript
const USE_REAL_API = process.env.NEXT_PUBLIC_USE_REAL_API === 'true';

export default function RankingsPage() {
  if (USE_REAL_API) {
    return <RankingsPageWithAPI />;
  }
  return <RankingsPageWithMockData />;
}
```

### Option 2: Component-Level Switch
```typescript
export default function RankingsPage() {
  const { data: apiData, loading, error } = useLichessTopPlayers('blitz', 100);

  // Use mock data during development
  const isDev = process.env.NODE_ENV === 'development';
  const data = isDev && !apiData ? mockLichessBlitzRankings : apiData;

  // ... rest of component
}
```

## Common Pitfalls

### 1. Data Structure Mismatch
**Problem:** API returns different structure than mock data
**Solution:** Use mapper functions to transform data

### 2. Missing Error Handling
**Problem:** Page crashes when API fails
**Solution:** Always check loading/error states before using data

### 3. Stale Data in Development
**Problem:** Cache makes testing difficult
**Solution:** Add cache bypass for development:
```typescript
const { data } = useTournaments({
  bypassCache: process.env.NODE_ENV === 'development'
});
```

### 4. TypeScript Errors
**Problem:** Type mismatches between API and components
**Solution:** Use explicit type assertions and mappers

## Next Steps

1. **Review this guide** - Understand the migration pattern
2. **Start with `/stats` page** - Already done as reference
3. **Migrate `/rankings` page** - Follow examples above
4. **Test thoroughly** - Check loading, error, and success states
5. **Repeat for other pages** - Use same pattern

Would you like me to:
1. Migrate the rankings page now as a complete example?
2. Create the mapper utilities?
3. Build reusable loading/error components?
4. Something else?

Let me know and I'll help you migrate the pages to use real API data!
