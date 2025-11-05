import { logger } from '../utils/logger';

const CHESSCOM_API_BASE = 'https://api.chess.com/pub';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface ChessComLeaderboardPlayer {
  player_id: number;
  '@id': string;
  url: string;
  username: string;
  score: number; // Rating
  rank: number;
  country: string; // URL to country endpoint
  title?: string;
  name?: string;
  status: string;
  avatar?: string;
  trend_score: {
    direction: number; // -1, 0, 1
    delta: number;
  };
  trend_rank: {
    direction: number;
    delta: number;
  };
  flair_code?: string;
  win_count: number;
  loss_count: number;
  draw_count: number;
}

export interface ChessComLeaderboards {
  daily: ChessComLeaderboardPlayer[];
  daily960: ChessComLeaderboardPlayer[];
  live_bullet: ChessComLeaderboardPlayer[];
  live_blitz: ChessComLeaderboardPlayer[];
  live_rapid: ChessComLeaderboardPlayer[];
  live_blitz960: ChessComLeaderboardPlayer[];
  live_bughouse: ChessComLeaderboardPlayer[];
  live_threecheck: ChessComLeaderboardPlayer[];
  tactics: ChessComLeaderboardPlayer[];
  rush: ChessComLeaderboardPlayer[];
  battle: ChessComLeaderboardPlayer[];
}

export interface ChessComPlayerProfile {
  player_id: number;
  '@id': string;
  url: string;
  username: string;
  followers: number;
  country: string; // URL to country endpoint
  location?: string;
  last_online: number; // Unix timestamp
  joined: number; // Unix timestamp
  status: string;
  is_streamer?: boolean;
  verified?: boolean;
  league?: string;
  title?: string; // GM, IM, FM, etc.
  name?: string;
  avatar?: string;
}

export interface ChessComRatingData {
  last: {
    rating: number;
    date: number; // Unix timestamp
    rd: number; // Rating deviation
  };
  best: {
    rating: number;
    date: number;
    game: string; // URL to game
  };
  record: {
    win: number;
    loss: number;
    draw: number;
    time_per_move?: number; // For daily chess
    timeout_percent?: number; // For daily chess
  };
}

export interface ChessComPlayerStats {
  chess_bullet?: ChessComRatingData;
  chess_blitz?: ChessComRatingData;
  chess_rapid?: ChessComRatingData;
  chess_daily?: ChessComRatingData;
  fide?: number; // FIDE rating if available
  tactics?: {
    highest: {
      rating: number;
      date: number;
    };
    lowest: {
      rating: number;
      date: number;
    };
  };
  puzzle_rush?: {
    best: {
      total_attempts: number;
      score: number;
    };
  };
}

// ============================================================================
// Chess.com Service
// ============================================================================

export class ChessComService {
  private rateLimitDelay = 100; // 100ms between requests for safety

  /**
   * Add delay between requests to respect rate limits
   * Chess.com allows serial access (wait for response before next request)
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get leaderboards for all game types
   * Endpoint refreshes every 5 minutes
   */
  async getLeaderboards(): Promise<ChessComLeaderboards> {
    try {
      logger.info('Fetching leaderboards from Chess.com');

      const response = await fetch(`${CHESSCOM_API_BASE}/leaderboards`, {
        headers: {
          'Accept-Encoding': 'gzip' // Save 80% bandwidth
        }
      });

      if (!response.ok) {
        throw new Error(`Chess.com API responded with status ${response.status}`);
      }

      const data = await response.json() as ChessComLeaderboards;

      logger.info('Fetched leaderboards from Chess.com', {
        bullet: data.live_bullet?.length || 0,
        blitz: data.live_blitz?.length || 0,
        rapid: data.live_rapid?.length || 0
      });

      return data;
    } catch (error) {
      logger.error('Error fetching leaderboards from Chess.com', { error });
      throw error;
    }
  }

  /**
   * Get top players for a specific time control
   */
  async getTopPlayers(
    timeControl: 'bullet' | 'blitz' | 'rapid' | 'daily',
    limit: number = 50
  ): Promise<ChessComLeaderboardPlayer[]> {
    try {
      logger.info('Fetching top players from Chess.com', { timeControl, limit });

      const leaderboards = await this.getLeaderboards();

      // Map time control to leaderboard key
      const leaderboardKey = timeControl === 'bullet' ? 'live_bullet' :
                            timeControl === 'blitz' ? 'live_blitz' :
                            timeControl === 'rapid' ? 'live_rapid' :
                            'daily';

      const players = leaderboards[leaderboardKey] || [];
      const topPlayers = players.slice(0, limit);

      logger.info('Fetched top players from Chess.com', {
        timeControl,
        count: topPlayers.length
      });

      return topPlayers;
    } catch (error) {
      logger.error('Error fetching top players from Chess.com', { error, timeControl });
      throw error;
    }
  }

  /**
   * Get player profile by username
   */
  async getPlayerProfile(username: string): Promise<ChessComPlayerProfile> {
    try {
      logger.info('Fetching player profile from Chess.com', { username });

      const response = await fetch(`${CHESSCOM_API_BASE}/player/${username}`, {
        headers: {
          'Accept-Encoding': 'gzip'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Player not found');
        }
        throw new Error(`Chess.com API responded with status ${response.status}`);
      }

      const data = await response.json() as ChessComPlayerProfile;

      logger.info('Fetched player profile from Chess.com', {
        username,
        title: data.title,
        name: data.name
      });

      return data;
    } catch (error) {
      logger.error('Error fetching player profile from Chess.com', { error, username });
      throw error;
    }
  }

  /**
   * Get player stats (ratings, records, etc.)
   */
  async getPlayerStats(username: string): Promise<ChessComPlayerStats> {
    try {
      logger.info('Fetching player stats from Chess.com', { username });

      const response = await fetch(`${CHESSCOM_API_BASE}/player/${username}/stats`, {
        headers: {
          'Accept-Encoding': 'gzip'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Player not found');
        }
        throw new Error(`Chess.com API responded with status ${response.status}`);
      }

      const data = await response.json() as ChessComPlayerStats;

      logger.info('Fetched player stats from Chess.com', {
        username,
        bullet: data.chess_bullet?.last?.rating,
        blitz: data.chess_blitz?.last?.rating,
        rapid: data.chess_rapid?.last?.rating
      });

      return data;
    } catch (error) {
      logger.error('Error fetching player stats from Chess.com', { error, username });
      throw error;
    }
  }

  /**
   * Get both profile and stats for a player
   */
  async getPlayer(username: string): Promise<{
    profile: ChessComPlayerProfile;
    stats: ChessComPlayerStats;
  }> {
    try {
      logger.info('Fetching player data from Chess.com', { username });

      const [profile, stats] = await Promise.all([
        this.getPlayerProfile(username),
        this.getPlayerStats(username)
      ]);

      return { profile, stats };
    } catch (error) {
      logger.error('Error fetching player data from Chess.com', { error, username });
      throw error;
    }
  }

  /**
   * Extract country code from Chess.com country URL
   * Example: "https://api.chess.com/pub/country/US" -> "US"
   */
  extractCountryCode(countryUrl: string): string | null {
    try {
      const parts = countryUrl.split('/');
      return parts[parts.length - 1] || null;
    } catch {
      return null;
    }
  }

  /**
   * Batch fetch multiple players with rate limiting
   */
  async batchGetPlayers(
    usernames: string[],
    onProgress?: (current: number, total: number) => void
  ): Promise<Array<{
    username: string;
    profile?: ChessComPlayerProfile;
    stats?: ChessComPlayerStats;
    error?: string;
  }>> {
    const results: Array<{
      username: string;
      profile?: ChessComPlayerProfile;
      stats?: ChessComPlayerStats;
      error?: string;
    }> = [];

    logger.info('Batch fetching players from Chess.com', {
      count: usernames.length,
      estimatedTime: `~${Math.ceil(usernames.length * this.rateLimitDelay / 1000)}s`
    });

    for (let i = 0; i < usernames.length; i++) {
      const username = usernames[i];

      try {
        const { profile, stats } = await this.getPlayer(username);
        results.push({ username, profile, stats });

        if (onProgress) {
          onProgress(i + 1, usernames.length);
        }

        // Rate limiting: wait between requests
        if (i < usernames.length - 1) {
          await this.sleep(this.rateLimitDelay);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.warn('Failed to fetch player from Chess.com', {
          username,
          error: errorMessage
        });

        results.push({
          username,
          error: errorMessage
        });
      }
    }

    logger.info('Completed batch fetching players from Chess.com', {
      total: results.length,
      successful: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length
    });

    return results;
  }
}
