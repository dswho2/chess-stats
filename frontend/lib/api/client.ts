/**
 * API Client for Chess Stats Backend
 *
 * Provides typed functions to interact with the backend API
 * Handles error handling, request formatting, and response parsing
 */

import {
  ApiResponse,
  Tournament,
  TournamentsListResponse,
  TournamentStanding,
  Game,
  Player,
  TopPlayer,
  FidePlayer,
  FideRatingHistory,
  PlayerGamesOptions,
  TournamentGamesOptions,
  PerfType
} from './types';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ============================================================================
// Core Request Handler
// ============================================================================

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || data.message || 'An error occurred',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network error or JSON parsing error
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0
    );
  }
}

// ============================================================================
// Tournament API
// ============================================================================

export const tournamentsApi = {
  /**
   * Get current tournaments from Lichess
   */
  async getCurrent(): Promise<TournamentsListResponse> {
    return request<TournamentsListResponse>('/tournaments');
  },

  /**
   * Get tournament by ID
   */
  async getById(platform: 'lichess' | 'swiss', id: string): Promise<ApiResponse<Tournament>> {
    return request<ApiResponse<Tournament>>(`/tournaments/${platform}/${id}`);
  },

  /**
   * Get tournament results/standings
   */
  async getResults(
    platform: 'lichess',
    id: string,
    limit: number = 100
  ): Promise<ApiResponse<TournamentStanding[]>> {
    return request<ApiResponse<TournamentStanding[]>>(
      `/tournaments/${platform}/${id}/results?limit=${limit}`
    );
  },

  /**
   * Get tournament games
   */
  async getGames(
    platform: 'lichess',
    id: string,
    options?: TournamentGamesOptions
  ): Promise<ApiResponse<Game[]>> {
    const params = new URLSearchParams();

    if (options?.player) params.set('player', options.player);
    if (options?.moves !== undefined) params.set('moves', String(options.moves));
    if (options?.pgnInJson !== undefined) params.set('pgnInJson', String(options.pgnInJson));
    if (options?.tags !== undefined) params.set('tags', String(options.tags));
    if (options?.clocks !== undefined) params.set('clocks', String(options.clocks));
    if (options?.evals !== undefined) params.set('evals', String(options.evals));
    if (options?.opening !== undefined) params.set('opening', String(options.opening));

    const queryString = params.toString();
    const url = `/tournaments/${platform}/${id}/games${queryString ? `?${queryString}` : ''}`;

    return request<ApiResponse<Game[]>>(url);
  },

  /**
   * Get Swiss tournament
   */
  async getSwiss(id: string): Promise<ApiResponse<Tournament>> {
    return request<ApiResponse<Tournament>>(`/tournaments/swiss/${id}`);
  },
};

// ============================================================================
// Players API
// ============================================================================

export const playersApi = {
  /**
   * Get top FIDE players
   */
  async getFideTop(): Promise<ApiResponse<FidePlayer[]>> {
    return request<ApiResponse<FidePlayer[]>>('/players/top');
  },

  /**
   * Get FIDE player by ID
   */
  async getFidePlayer(fideId: string): Promise<ApiResponse<FidePlayer>> {
    return request<ApiResponse<FidePlayer>>(`/players/fide/${fideId}`);
  },

  /**
   * Get FIDE player rating history
   */
  async getFideHistory(fideId: string): Promise<ApiResponse<FideRatingHistory[]>> {
    return request<ApiResponse<FideRatingHistory[]>>(`/players/fide/${fideId}/history`);
  },

  /**
   * Get top Lichess players by performance type
   */
  async getLichessTop(
    perfType: PerfType = 'blitz',
    count: number = 100
  ): Promise<ApiResponse<TopPlayer[]>> {
    return request<ApiResponse<TopPlayer[]>>(
      `/players/lichess/top/${perfType}?count=${count}`
    );
  },

  /**
   * Get Lichess player by username
   */
  async getLichessPlayer(username: string): Promise<ApiResponse<Player>> {
    return request<ApiResponse<Player>>(`/players/lichess/${username}`);
  },

  /**
   * Get Lichess player's games
   */
  async getLichessGames(
    username: string,
    options?: PlayerGamesOptions
  ): Promise<ApiResponse<Game[]>> {
    const params = new URLSearchParams();

    if (options?.max !== undefined) params.set('max', String(options.max));
    if (options?.since !== undefined) params.set('since', String(options.since));
    if (options?.until !== undefined) params.set('until', String(options.until));
    if (options?.rated !== undefined) params.set('rated', String(options.rated));
    if (options?.perfType) params.set('perfType', options.perfType);
    if (options?.color) params.set('color', options.color);
    if (options?.moves !== undefined) params.set('moves', String(options.moves));
    if (options?.pgnInJson !== undefined) params.set('pgnInJson', String(options.pgnInJson));
    if (options?.tags !== undefined) params.set('tags', String(options.tags));
    if (options?.clocks !== undefined) params.set('clocks', String(options.clocks));
    if (options?.evals !== undefined) params.set('evals', String(options.evals));
    if (options?.opening !== undefined) params.set('opening', String(options.opening));

    const queryString = params.toString();
    const url = `/players/lichess/${username}/games${queryString ? `?${queryString}` : ''}`;

    return request<ApiResponse<Game[]>>(url);
  },
};

// ============================================================================
// Default Export
// ============================================================================

const api = {
  tournaments: tournamentsApi,
  players: playersApi,
};

export default api;

// Named exports for convenience
export { ApiError };
