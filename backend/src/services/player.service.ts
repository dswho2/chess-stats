import { playerRepository } from '../repositories/player.repository';
import { FideService } from './fide.service';
import { LichessService } from './lichess.service';
import { PlayerMapper } from '../mappers/player.mapper';
import { logger } from '../utils/logger';

/**
 * Player Service
 * Business logic layer that orchestrates player operations
 * Combines external API data with database operations
 */
class PlayerService {
  private fideService = new FideService();
  private lichessService = new LichessService();

  /**
   * Get players from database with filtering and pagination
   */
  async findAll(params: {
    title?: string;
    country?: string;
    search?: string;
    page: number;
    limit: number;
  }) {
    return playerRepository.findAll(params);
  }

  /**
   * Get player by ID from database
   */
  async findById(id: string) {
    return playerRepository.findById(id);
  }

  /**
   * Get player by profile URL from database
   */
  async findByProfileUrl(profileUrl: string) {
    return playerRepository.findByProfileUrl(profileUrl);
  }

  /**
   * Get player tournament history from database
   */
  async getTournamentHistory(playerId: string, limit: number = 20) {
    return playerRepository.getTournamentHistory(playerId, limit);
  }

  /**
   * Get top players by FIDE rating type from database
   * For Lichess/Chess.com rankings, use PlayerAccountService
   */
  async getTopByRating(
    ratingField: 'fideClassicalRating' | 'fideRapidRating' | 'fideBlitzRating',
    limit: number = 100
  ) {
    return playerRepository.getTopByRating(ratingField, limit);
  }

  /**
   * Sync player from FIDE API to database
   */
  async syncFromFide(fideId: string) {
    try {
      logger.info('Syncing FIDE player', { fideId });

      // Fetch from FIDE API
      const fideData = await this.fideService.getPlayerInfo(fideId);

      // Map to Prisma format
      const playerData = PlayerMapper.fromFide(fideData);

      // Upsert to database
      const player = await playerRepository.upsertByFideId(fideId, playerData);

      logger.info('Successfully synced FIDE player', { fideId, dbId: player.id });

      return player;
    } catch (error) {
      logger.error('Failed to sync FIDE player', { fideId, error });
      throw error;
    }
  }

  /**
   * Sync Lichess account - DEPRECATED
   * Use PlayerAccountService.syncFromLichess() instead
   *
   * PlayerService now handles only FIDE (verified) players.
   * Lichess/Chess.com accounts are managed via PlayerAccountService.
   */

  /**
   * Get or sync player from FIDE
   * Tries to get from database first, syncs from API if not found
   */
  async getOrSyncFromFide(fideId: string) {
    // Try to find in database first
    let player = await playerRepository.findByFideId(fideId);

    // If not found, sync from API
    if (!player) {
      logger.info('Player not in database, syncing from FIDE', { fideId });
      player = await this.syncFromFide(fideId);
    }

    return player;
  }

  /**
   * Get or sync Lichess account - DEPRECATED
   * Use PlayerAccountService.getOrSyncFromLichess() instead
   */

  /**
   * Sync top players from FIDE
   * Fetches top players from FIDE API and stores them with full details
   */
  async syncTopFromFide() {
    try {
      logger.info('Syncing top FIDE players');

      // Get list of top players (minimal data)
      const topPlayers = await this.fideService.getTopPlayers();
      const results = {
        successful: 0,
        failed: 0,
        errors: [] as any[]
      };

      // Fetch full details for each player
      for (const topPlayer of topPlayers) {
        try {
          const fideId = topPlayer.fide_id?.toString();
          if (!fideId) {
            logger.warn('Skipping player without FIDE ID', { topPlayer });
            results.failed++;
            continue;
          }

          // Fetch complete player data from player_info endpoint
          const fullPlayerData = await this.fideService.getPlayerInfo(fideId);

          // Map and save to database
          const player = PlayerMapper.fromFide(fullPlayerData);
          await playerRepository.upsertByFideId(fideId, player);

          results.successful++;

          // Rate limit: wait 100ms between requests
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          results.failed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorStack = error instanceof Error ? error.stack : undefined;
          results.errors.push({
            fideId: topPlayer.fide_id,
            error: errorMessage
          });
          logger.error('Failed to sync individual player', {
            fideId: topPlayer.fide_id,
            error: errorMessage,
            stack: errorStack
          });
        }
      }

      logger.info('Completed syncing top FIDE players', results);
      return results;
    } catch (error) {
      logger.error('Failed to sync top FIDE players', { error });
      throw error;
    }
  }

  /**
   * Sync top Lichess accounts - DEPRECATED
   * Use PlayerAccountService.syncTopFromLichess() instead
   *
   * Lichess accounts are now stored in PlayerAccount table, not Player table.
   */
}

export const playerService = new PlayerService();
