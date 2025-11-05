import { logger } from '../utils/logger';

const FIDE_API_BASE = process.env.FIDE_API_URL || 'https://fide-api.vercel.app';

export interface FidePlayer {
  name: string;
  title?: string;
  federation: string;
  standard_rating?: number;
  rapid_rating?: number;
  blitz_rating?: number;
  standard_rank?: number;
  rapid_rank?: number;
  blitz_rank?: number;
  year_of_birth?: number;
  fide_id: string;
}

export class FideService {
  /**
   * Get top players from FIDE
   */
  async getTopPlayers(limit: number = 100): Promise<FidePlayer[]> {
    try {
      logger.info('Fetching top players from FIDE API', { limit });

      const response = await fetch(`${FIDE_API_BASE}/top_players/?limit=${limit}`);

      if (!response.ok) {
        throw new Error(`FIDE API responded with status ${response.status}`);
      }

      const data = await response.json() as FidePlayer[];

      logger.info(`Fetched ${data.length} top players from FIDE`);

      return data;
    } catch (error) {
      logger.error('Error fetching top players from FIDE', { error });
      throw error;
    }
  }

  /**
   * Get player information by FIDE ID
   */
  async getPlayerInfo(fideId: string): Promise<FidePlayer> {
    try {
      logger.info('Fetching player info from FIDE API', { fideId });

      const response = await fetch(`${FIDE_API_BASE}/player_info/?fide_id=${fideId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Player not found');
        }
        throw new Error(`FIDE API responded with status ${response.status}`);
      }

      const data = await response.json() as FidePlayer;

      logger.info('Fetched player info from FIDE', { fideId, name: data.name });

      return data;
    } catch (error) {
      logger.error('Error fetching player info from FIDE', { error, fideId });
      throw error;
    }
  }

  /**
   * Get player rating history by FIDE ID
   */
  async getPlayerHistory(fideId: string): Promise<any> {
    try {
      logger.info('Fetching player history from FIDE API', { fideId });

      const response = await fetch(`${FIDE_API_BASE}/player_history/?fide_id=${fideId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Player not found');
        }
        throw new Error(`FIDE API responded with status ${response.status}`);
      }

      const data = await response.json();

      logger.info('Fetched player history from FIDE', { fideId });

      return data;
    } catch (error) {
      logger.error('Error fetching player history from FIDE', { error, fideId });
      throw error;
    }
  }
}
