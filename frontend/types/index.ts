/**
 * Core TypeScript types for Chess Stats Platform
 * Defines the data structures for tournaments, players, and games
 */

// ============================================================================
// Enums and Constants
// ============================================================================

export enum Platform {
  CHESS_COM = "chess-com",
  LICHESS = "lichess",
  FIDE = "fide",
}

export enum TournamentFormat {
  SWISS = "swiss",
  KNOCKOUT = "knockout",
  ROUND_ROBIN = "round-robin",
  ARENA = "arena",
}

export enum TournamentStatus {
  UPCOMING = "upcoming",
  ONGOING = "ongoing",
  COMPLETED = "completed",
}

export enum TimeControl {
  BULLET = "bullet",
  BLITZ = "blitz",
  RAPID = "rapid",
  CLASSICAL = "classical",
}

export enum GameResult {
  WHITE_WIN = "1-0",
  BLACK_WIN = "0-1",
  DRAW = "1/2-1/2",
}

export enum PlayerTitle {
  GM = "GM",
  IM = "IM",
  FM = "FM",
  CM = "CM",
  WGM = "WGM",
  WIM = "WIM",
  WFM = "WFM",
  WCM = "WCM",
  NM = "NM",
}

// ============================================================================
// Tournament Types
// ============================================================================

export interface Tournament {
  id: string;
  name: string;
  platform: Platform;
  format: TournamentFormat;
  status: TournamentStatus;
  timeControl: TimeControl;
  startDate: Date | string;
  endDate: Date | string;
  prizePool?: number;
  prizeCurrency?: string;
  participantCount: number;
  rounds?: number;
  location?: string; // For OTB tournaments
  officialUrl?: string;
  broadcastUrl?: string;
  thumbnailUrl?: string;
  description?: string;
  featured?: boolean; // Flag for featured tournaments on homepage
  lastUpdated?: Date | string;
}

export interface TournamentStanding {
  rank: number;
  playerId: string;
  playerName: string;
  playerTitle?: PlayerTitle;
  playerCountry?: string;
  score: number;
  rating?: number;
  performanceRating?: number;
  buchholzScore?: number;
  wins: number;
  draws: number;
  losses: number;
  gamesPlayed: number;
  whiteGames?: number;
  blackGames?: number;
}

export interface TournamentRound {
  tournamentId: string;
  roundNumber: number;
  pairings: Pairing[];
  startTime?: Date | string;
  status: "scheduled" | "in-progress" | "completed";
}

export interface Pairing {
  gameId?: string;
  whitePlayerId: string;
  whitePlayerName: string;
  whiteRating?: number;
  blackPlayerId: string;
  blackPlayerName: string;
  blackRating?: number;
  result?: GameResult;
  board?: number; // Board number in the round
}

// ============================================================================
// Player Types
// ============================================================================

export interface Player {
  id: string;
  username: string;
  fullName?: string;
  title?: PlayerTitle;
  country: string;
  avatarUrl?: string;
  fideRating?: number;
  chessComRating?: number;
  lichessRating?: number;
  fideId?: string;
  chessComUsername?: string;
  lichessUsername?: string;
  bio?: string;
  dateOfBirth?: Date | string;
  lastUpdated?: Date | string;
}

export interface PlayerStats {
  playerId: string;
  tournamentsPlayed: number;
  totalGames: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  averagePlacement?: number;
  bestPerformanceRating?: number;
  bestTournamentResult?: {
    tournamentId: string;
    tournamentName: string;
    rank: number;
    date: Date | string;
  };
}

export interface PlayerTournamentHistory {
  playerId: string;
  tournaments: PlayerTournamentResult[];
}

export interface PlayerTournamentResult {
  tournamentId: string;
  tournamentName: string;
  platform: Platform;
  format: TournamentFormat;
  date: Date | string;
  rank: number;
  score: number;
  totalRounds?: number;
  performanceRating?: number;
}

// ============================================================================
// Game Types
// ============================================================================

export interface Game {
  id: string;
  tournamentId: string;
  roundNumber: number;
  board?: number;
  whitePlayerId: string;
  blackPlayerId: string;
  result: GameResult;
  opening?: string;
  openingEco?: string; // ECO code (e.g., "E60")
  moves?: string; // PGN moves
  pgnUrl?: string;
  analysisUrl?: string;
  startTime?: Date | string;
  endTime?: Date | string;
}

// ============================================================================
// UI Component Props Types
// ============================================================================

export interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "chess-com"
    | "lichess"
    | "fide"
    | "ongoing"
    | "completed"
    | "upcoming"
    | "swiss"
    | "knockout"
    | "arena"
    | "default";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TournamentFilters {
  platform?: Platform | Platform[];
  format?: TournamentFormat | TournamentFormat[];
  status?: TournamentStatus;
  startDate?: Date | string;
  endDate?: Date | string;
  search?: string;
}

export interface PlayerFilters {
  title?: PlayerTitle | PlayerTitle[];
  country?: string | string[];
  platform?: Platform;
  search?: string;
}
