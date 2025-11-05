import { logger } from '../utils/logger';

const LICHESS_API_BASE = 'https://lichess.org/api';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface LichessTournament {
  id: string;
  createdBy: string;
  system: 'arena' | 'swiss';
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
  startsAt?: string | number;  // Can be ISO string or timestamp
  finishesAt?: string | number;
  status: number;
  rated: boolean;
  nbPlayers?: number;
  isFinished?: boolean;
  schedule?: {
    freq: string;  // 'hourly', 'daily', 'eastern', 'weekly', 'monthly', 'shield'
    speed: string;  // 'bullet', 'superBlitz', 'blitz', 'rapid', etc.
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
    players: LichessTournamentPlayer[];
  };
}

export interface LichessTournamentPlayer {
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

export interface LichessPlayer {
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

export interface LichessTopPlayer {
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

export interface LichessGame {
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
// Lichess Service
// ============================================================================

export class LichessService {
  /**
   * Get current tournaments
   */
  async getCurrentTournaments(): Promise<any> {
    try {
      logger.info('Fetching current tournaments from Lichess');

      const response = await fetch(`${LICHESS_API_BASE}/tournament`);

      if (!response.ok) {
        throw new Error(`Lichess API responded with status ${response.status}`);
      }

      const data = await response.json() as any;

      logger.info('Fetched current tournaments from Lichess', {
        created: data.created?.length || 0,
        started: data.started?.length || 0,
        finished: data.finished?.length || 0
      });

      return data;
    } catch (error) {
      logger.error('Error fetching current tournaments from Lichess', { error });
      throw error;
    }
  }

  /**
   * Get tournament by ID
   */
  async getTournament(tournamentId: string): Promise<LichessTournament> {
    try {
      logger.info('Fetching tournament from Lichess', { tournamentId });

      const response = await fetch(`${LICHESS_API_BASE}/tournament/${tournamentId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Tournament not found');
        }
        throw new Error(`Lichess API responded with status ${response.status}`);
      }

      const data = await response.json() as LichessTournament;

      logger.info('Fetched tournament from Lichess', {
        tournamentId,
        name: data.fullName,
        players: data.nbPlayers
      });

      return data;
    } catch (error) {
      logger.error('Error fetching tournament from Lichess', { error, tournamentId });
      throw error;
    }
  }

  /**
   * Get tournament results (standings)
   */
  async getTournamentResults(tournamentId: string, limit: number = 100): Promise<any[]> {
    try {
      logger.info('Fetching tournament results from Lichess', { tournamentId, limit });

      const response = await fetch(
        `${LICHESS_API_BASE}/tournament/${tournamentId}/results?nb=${limit}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Tournament not found');
        }
        throw new Error(`Lichess API responded with status ${response.status}`);
      }

      // Parse ND-JSON (newline-delimited JSON)
      const text = await response.text();
      const results = text
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));

      logger.info('Fetched tournament results from Lichess', {
        tournamentId,
        resultsCount: results.length
      });

      return results;
    } catch (error) {
      logger.error('Error fetching tournament results from Lichess', {
        error,
        tournamentId
      });
      throw error;
    }
  }

  /**
   * Get tournament games
   */
  async getTournamentGames(
    tournamentId: string,
    options: {
      player?: string;
      moves?: boolean;
      pgnInJson?: boolean;
      tags?: boolean;
      clocks?: boolean;
      evals?: boolean;
      opening?: boolean;
    } = {}
  ): Promise<LichessGame[]> {
    try {
      logger.info('Fetching tournament games from Lichess', { tournamentId, options });

      const params = new URLSearchParams();
      if (options.player) params.set('player', options.player);
      if (options.moves !== undefined) params.set('moves', String(options.moves));
      if (options.pgnInJson !== undefined) params.set('pgnInJson', String(options.pgnInJson));
      if (options.tags !== undefined) params.set('tags', String(options.tags));
      if (options.clocks !== undefined) params.set('clocks', String(options.clocks));
      if (options.evals !== undefined) params.set('evals', String(options.evals));
      if (options.opening !== undefined) params.set('opening', String(options.opening));

      const url = `${LICHESS_API_BASE}/tournament/${tournamentId}/games?${params.toString()}`;
      const response = await fetch(url, {
        headers: {
          Accept: 'application/x-ndjson'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Tournament not found');
        }
        throw new Error(`Lichess API responded with status ${response.status}`);
      }

      // Parse ND-JSON
      const text = await response.text();
      const games = text
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));

      logger.info('Fetched tournament games from Lichess', {
        tournamentId,
        gamesCount: games.length
      });

      return games;
    } catch (error) {
      logger.error('Error fetching tournament games from Lichess', {
        error,
        tournamentId
      });
      throw error;
    }
  }

  /**
   * Get Swiss tournament
   */
  async getSwissTournament(swissId: string): Promise<any> {
    try {
      logger.info('Fetching Swiss tournament from Lichess', { swissId });

      const response = await fetch(`${LICHESS_API_BASE}/swiss/${swissId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Swiss tournament not found');
        }
        throw new Error(`Lichess API responded with status ${response.status}`);
      }

      const data = await response.json() as any;

      logger.info('Fetched Swiss tournament from Lichess', {
        swissId,
        name: data.name
      });

      return data;
    } catch (error) {
      logger.error('Error fetching Swiss tournament from Lichess', { error, swissId });
      throw error;
    }
  }

  /**
   * Get player by username
   */
  async getPlayer(username: string): Promise<LichessPlayer> {
    try {
      logger.info('Fetching player from Lichess', { username });

      const response = await fetch(`${LICHESS_API_BASE}/user/${username}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Player not found');
        }
        throw new Error(`Lichess API responded with status ${response.status}`);
      }

      const data = await response.json() as LichessPlayer;

      logger.info('Fetched player from Lichess', {
        username,
        title: data.title,
        rating: data.perfs?.blitz?.rating
      });

      return data;
    } catch (error) {
      logger.error('Error fetching player from Lichess', { error, username });
      throw error;
    }
  }

  /**
   * Get top players for a specific performance type
   */
  async getTopPlayers(
    perfType: 'bullet' | 'blitz' | 'rapid' | 'classical' | 'ultraBullet' = 'blitz',
    count: number = 100
  ): Promise<LichessTopPlayer[]> {
    try {
      logger.info('Fetching top players from Lichess', { perfType, count });

      const response = await fetch(`${LICHESS_API_BASE}/player/top/${count}/${perfType}`);

      if (!response.ok) {
        throw new Error(`Lichess API responded with status ${response.status}`);
      }

      const data = await response.json() as { users: LichessTopPlayer[] };

      logger.info('Fetched top players from Lichess', {
        perfType,
        count: data.users?.length || 0
      });

      return data.users || [];
    } catch (error) {
      logger.error('Error fetching top players from Lichess', { error, perfType });
      throw error;
    }
  }

  /**
   * Get player's games
   */
  async getPlayerGames(
    username: string,
    options: {
      max?: number;
      since?: number; // timestamp in milliseconds
      until?: number; // timestamp in milliseconds
      rated?: boolean;
      perfType?: string; // bullet, blitz, rapid, classical, etc.
      color?: 'white' | 'black';
      moves?: boolean;
      pgnInJson?: boolean;
      tags?: boolean;
      clocks?: boolean;
      evals?: boolean;
      opening?: boolean;
    } = {}
  ): Promise<LichessGame[]> {
    try {
      logger.info('Fetching player games from Lichess', { username, options });

      const params = new URLSearchParams();
      if (options.max !== undefined) params.set('max', String(options.max));
      if (options.since !== undefined) params.set('since', String(options.since));
      if (options.until !== undefined) params.set('until', String(options.until));
      if (options.rated !== undefined) params.set('rated', String(options.rated));
      if (options.perfType) params.set('perfType', options.perfType);
      if (options.color) params.set('color', options.color);
      if (options.moves !== undefined) params.set('moves', String(options.moves));
      if (options.pgnInJson !== undefined) params.set('pgnInJson', String(options.pgnInJson));
      if (options.tags !== undefined) params.set('tags', String(options.tags));
      if (options.clocks !== undefined) params.set('clocks', String(options.clocks));
      if (options.evals !== undefined) params.set('evals', String(options.evals));
      if (options.opening !== undefined) params.set('opening', String(options.opening));

      const url = `${LICHESS_API_BASE}/games/user/${username}?${params.toString()}`;
      const response = await fetch(url, {
        headers: {
          Accept: 'application/x-ndjson'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Player not found');
        }
        throw new Error(`Lichess API responded with status ${response.status}`);
      }

      // Parse ND-JSON
      const text = await response.text();
      const games = text
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));

      logger.info('Fetched player games from Lichess', {
        username,
        gamesCount: games.length
      });

      return games;
    } catch (error) {
      logger.error('Error fetching player games from Lichess', { error, username });
      throw error;
    }
  }
}
