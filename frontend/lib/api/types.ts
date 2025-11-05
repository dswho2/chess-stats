/**
 * Shared TypeScript types for API responses
 * These types match the backend API structure
 */

// ============================================================================
// Common Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
  timestamp?: string;
  source?: string;
  cached?: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// Tournament Types
// ============================================================================

export interface Tournament {
  id: string;
  createdBy: string;
  system: 'arena' | 'swiss' | 'knockout';
  fullName: string;
  perf: {
    key: string;
    name: string;
    position: number;
    icon: string;
  };
  clock: {
    limit: number;
    increment: number;
  };
  minutes: number;
  startsAt?: string | number;
  finishesAt?: string | number;
  status: number;
  rated: boolean;
  nbPlayers?: number;
  isFinished?: boolean;
  schedule?: {
    freq: string;
    speed: string;
  };
  stats?: {
    games: number;
    moves: number;
    whiteWins: number;
    blackWins: number;
    draws: number;
    berserks: number;
    averageRating: number;
  };
  winner?: {
    id: string;
    name: string;
  };
  podium?: Array<{
    name: string;
    rank: number;
    rating: number;
    score: number;
    flair?: string;
    performance?: number;
    nb: {
      game: number;
      berserk: number;
      win: number;
    };
  }>;
  standing?: {
    page: number;
    players: TournamentPlayer[];
  };
}

export interface TournamentPlayer {
  rank: number;
  name: string;
  rating: number;
  score: number;
  sheet?: {
    scores: string;
    total: number;
    fire: boolean;
  };
}

export interface TournamentsListResponse {
  success: boolean;
  data: {
    created: Tournament[];
    started: Tournament[];
    finished: Tournament[];
  };
  counts: {
    created: number;
    started: number;
    finished: number;
  };
  source: string;
  timestamp: string;
}

export interface TournamentStanding {
  rank: number;
  name: string;
  rating: number;
  score: number;
  performance?: number;
  sheet?: {
    scores: string;
    total: number;
    fire: boolean;
  };
}

// ============================================================================
// Player Types
// ============================================================================

export interface Player {
  id: string;
  username: string;
  title?: string;
  online?: boolean;
  perfs: {
    [key: string]: {
      games: number;
      rating: number;
      rd: number;
      prog: number;
    };
  };
  profile?: {
    country?: string;
    bio?: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt: number;
  seenAt?: number;
  playTime?: {
    total: number;
    tv: number;
  };
  count?: {
    all: number;
    rated: number;
    ai: number;
    draw: number;
    drawH: number;
    loss: number;
    lossH: number;
    win: number;
    winH: number;
  };
}

export interface TopPlayer {
  id: string;
  username: string;
  title?: string;
  patron?: boolean;
  perfs: {
    [key: string]: {
      rating: number;
      progress: number;
    };
  };
  online?: boolean;
}

export interface FidePlayer {
  rank: string;
  name: string;
  fide_id: string;
  country: string;
  rating: string;
  title?: string;
  // Future fields when we have our own DB
  rapid_rating?: number;
  blitz_rating?: number;
  birth_year?: number;
  sex?: string;
}

export interface FideRatingHistory {
  period: string;
  standard?: number;
  rapid?: number;
  blitz?: number;
}

// ============================================================================
// Game Types
// ============================================================================

export interface Game {
  id: string;
  rated: boolean;
  variant: string;
  speed: string;
  perf: string;
  createdAt: number;
  lastMoveAt: number;
  status: string;
  players: {
    white: {
      user: {
        name: string;
        title?: string;
        id: string;
      };
      rating?: number;
      ratingDiff?: number;
    };
    black: {
      user: {
        name: string;
        title?: string;
        id: string;
      };
      rating?: number;
      ratingDiff?: number;
    };
  };
  opening?: {
    eco: string;
    name: string;
    ply: number;
  };
  moves?: string;
  winner?: 'white' | 'black';
  clock?: {
    initial: number;
    increment: number;
    totalTime: number;
  };
}

// ============================================================================
// API Request Options
// ============================================================================

export interface PlayerGamesOptions {
  max?: number;
  since?: number;
  until?: number;
  rated?: boolean;
  perfType?: string;
  color?: 'white' | 'black';
  moves?: boolean;
  pgnInJson?: boolean;
  tags?: boolean;
  clocks?: boolean;
  evals?: boolean;
  opening?: boolean;
}

export interface TournamentGamesOptions {
  player?: string;
  moves?: boolean;
  pgnInJson?: boolean;
  tags?: boolean;
  clocks?: boolean;
  evals?: boolean;
  opening?: boolean;
}

export type PerfType = 'bullet' | 'blitz' | 'rapid' | 'classical' | 'ultraBullet';
