/**
 * Data Mappers
 * Transform API response data to component-friendly formats
 */

import type {
  Tournament as ApiTournament,
  TopPlayer as ApiTopPlayer,
  FidePlayer as ApiFidePlayer,
  Game as ApiGame,
} from './types';

// Import component types (if they exist, otherwise we'll define inline)
// Defining inline for now to avoid dependency issues

export interface MappedPlayer {
  playerId: string;
  playerName: string;
  title: string;
  rating: number;
  country: string;
  ratingChange: number;
  rank: number; // Required, not optional
}

export interface MappedTournament {
  id: string;
  name: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
  platform: string;
  format: string;
  timeControl: string;
  startDate: Date;
  endDate?: Date;
  participants: number;
  prizePool?: string;
  featured: boolean;
  winner?: string;
}

/**
 * Map Lichess top player to rankings format
 */
export function mapLichessTopPlayer(
  apiPlayer: ApiTopPlayer,
  perfType: string,
  index: number
): MappedPlayer {
  const perf = apiPlayer.perfs[perfType];

  return {
    playerId: apiPlayer.id,
    playerName: apiPlayer.username,
    title: apiPlayer.title || '',
    rating: perf?.rating || 0,
    country: 'XX', // Lichess API doesn't provide country in top players endpoint
    ratingChange: perf?.progress || 0,
    rank: index + 1,
  };
}

/**
 * Map FIDE player to rankings format
 */
export function mapFidePlayer(
  apiPlayer: ApiFidePlayer,
  index: number
): MappedPlayer {
  return {
    playerId: apiPlayer.fide_id,
    playerName: apiPlayer.name,
    title: apiPlayer.title || '',
    rating: parseInt(apiPlayer.rating as any) || 0, // API returns rating as string
    country: apiPlayer.country || 'XX',
    ratingChange: 0, // Will be populated from our DB later
    rank: parseInt(apiPlayer.rank as any) || (index + 1),
  };
}

/**
 * Map Lichess tournament to component format
 */
export function mapLichessTournament(
  apiTournament: ApiTournament,
  featured: boolean = false
): MappedTournament {
  // Determine status
  let status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' = 'UPCOMING';
  if (apiTournament.isFinished) {
    status = 'COMPLETED';
  } else if (apiTournament.status && apiTournament.status > 10) {
    // Lichess status codes: created=10, started=20, finished=30
    status = 'ONGOING';
  }

  // Parse dates
  const startDate = apiTournament.startsAt
    ? new Date(
        typeof apiTournament.startsAt === 'number'
          ? apiTournament.startsAt
          : apiTournament.startsAt
      )
    : new Date();

  const endDate = apiTournament.finishesAt
    ? new Date(
        typeof apiTournament.finishesAt === 'number'
          ? apiTournament.finishesAt
          : apiTournament.finishesAt
      )
    : undefined;

  return {
    id: apiTournament.id,
    name: apiTournament.fullName,
    status,
    platform: 'Lichess',
    format: apiTournament.system === 'arena' ? 'Arena' : 'Swiss',
    timeControl: apiTournament.perf.name,
    startDate,
    endDate,
    participants: apiTournament.nbPlayers || 0,
    featured,
    winner: apiTournament.winner?.name,
  };
}

/**
 * Map array of Lichess top players to rankings array
 */
export function mapLichessTopPlayers(
  apiPlayers: ApiTopPlayer[],
  perfType: string
): MappedPlayer[] {
  return apiPlayers.map((player, index) =>
    mapLichessTopPlayer(player, perfType, index)
  );
}

/**
 * Map array of FIDE players to rankings array
 */
export function mapFidePlayers(apiPlayers: ApiFidePlayer[]): MappedPlayer[] {
  return apiPlayers.map((player, index) => mapFidePlayer(player, index));
}

/**
 * Map tournaments list to component format
 */
export function mapTournamentsList(tournaments: {
  created: ApiTournament[];
  started: ApiTournament[];
  finished: ApiTournament[];
}): {
  upcoming: MappedTournament[];
  ongoing: MappedTournament[];
  completed: MappedTournament[];
} {
  return {
    upcoming: tournaments.created.map(t => mapLichessTournament(t)),
    ongoing: tournaments.started.map(t => mapLichessTournament(t)),
    completed: tournaments.finished.map(t => mapLichessTournament(t)),
  };
}

/**
 * Get country flag emoji from country code
 */
export function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode === 'XX') return '🏴';

  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
}

/**
 * Format rating change with +/- symbol
 */
export function formatRatingChange(change: number): string {
  if (change > 0) return `+${change}`;
  if (change < 0) return change.toString();
  return '—';
}

/**
 * Get color class for rating change
 */
export function getRatingChangeColor(change: number): string {
  if (change > 0) return 'text-[#10b981]'; // Green
  if (change < 0) return 'text-[#ef4444]'; // Red
  return 'text-[#6b7280]'; // Gray
}

/**
 * Format time control string
 */
export function formatTimeControl(tournament: ApiTournament): string {
  if (!tournament.clock) return tournament.perf.name;

  const minutes = Math.floor(tournament.clock.limit / 60);
  const increment = tournament.clock.increment;

  return `${tournament.perf.name} (${minutes}+${increment})`;
}
