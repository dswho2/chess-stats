import { tournamentRepository } from '../repositories/tournament.repository';
import { LichessService } from './lichess.service';
import { TournamentMapper } from '../mappers/tournament.mapper';
import { logger } from '../utils/logger';

/**
 * Tournament Service
 * Business logic layer that orchestrates tournament operations
 * Combines external API data with database operations
 */
class TournamentService {
  private lichessService = new LichessService();

  /**
   * Get tournaments from database with filtering and pagination
   */
  async findAll(params: {
    platform?: string;
    status?: string;
    timeControl?: string;
    page: number;
    limit: number;
  }) {
    return tournamentRepository.findAll(params);
  }

  /**
   * Get tournament by ID from database
   */
  async findById(id: string) {
    return tournamentRepository.findById(id);
  }

  /**
   * Get tournament standings from database
   */
  async getStandings(tournamentId: string, stageId?: string) {
    return tournamentRepository.getStandings(tournamentId, stageId);
  }

  /**
   * Get tournament games from database
   */
  async getGames(tournamentId: string, roundNumber?: number) {
    return tournamentRepository.getGames(tournamentId, roundNumber);
  }

  /**
   * Get featured tournaments from database
   */
  async getFeatured(limit: number = 10) {
    return tournamentRepository.getFeatured(limit);
  }

  /**
   * Sync tournament from Lichess API to database
   * Fetches from external API and stores in database
   */
  async syncFromLichess(tournamentId: string) {
    try {
      logger.info('Syncing Lichess tournament', { tournamentId });

      // Fetch from Lichess API
      const lichessData = await this.lichessService.getTournament(tournamentId);

      // Map to Prisma format
      const tournamentData = TournamentMapper.fromLichess(lichessData);

      // Upsert to database
      const tournament = await tournamentRepository.upsertByExternalId(
        tournamentId,
        'lichess',
        tournamentData
      );

      logger.info('Successfully synced Lichess tournament', {
        tournamentId,
        dbId: tournament.id
      });

      return tournament;
    } catch (error) {
      logger.error('Failed to sync Lichess tournament', { tournamentId, error });
      throw error;
    }
  }

  /**
   * Sync Lichess Swiss tournament to database
   */
  async syncSwissFromLichess(swissId: string) {
    try {
      logger.info('Syncing Lichess Swiss tournament', { swissId });

      // Fetch from Lichess API
      const lichessData = await this.lichessService.getSwissTournament(swissId);

      // Map to Prisma format
      const tournamentData = TournamentMapper.fromLichessSwiss(lichessData);

      // Upsert to database
      const tournament = await tournamentRepository.upsertByExternalId(
        swissId,
        'lichess',
        tournamentData
      );

      logger.info('Successfully synced Lichess Swiss tournament', {
        swissId,
        dbId: tournament.id
      });

      return tournament;
    } catch (error) {
      logger.error('Failed to sync Lichess Swiss tournament', { swissId, error });
      throw error;
    }
  }

  /**
   * Get or sync tournament from Lichess
   * Tries to get from database first, syncs from API if not found
   */
  async getOrSyncFromLichess(tournamentId: string, isSwiss: boolean = false) {
    // Try to find in database first
    let tournament = await tournamentRepository.findByExternalId(
      tournamentId,
      'lichess'
    );

    // If not found, sync from API
    if (!tournament) {
      logger.info('Tournament not in database, syncing from Lichess', { tournamentId });
      tournament = isSwiss
        ? await this.syncSwissFromLichess(tournamentId)
        : await this.syncFromLichess(tournamentId);
    }

    return tournament;
  }

  /**
   * Sync current tournaments from Lichess
   * Fetches all current tournaments and stores them
   */
  async syncCurrentFromLichess() {
    try {
      logger.info('Syncing current Lichess tournaments');

      const currentTournaments = await this.lichessService.getCurrentTournaments();
      const results = {
        successful: 0,
        failed: 0,
        errors: [] as any[]
      };

      // Process all tournament categories
      const allTournaments = [
        ...(currentTournaments.created || []),
        ...(currentTournaments.started || []),
        ...(currentTournaments.finished || [])
      ];

      for (const tournament of allTournaments) {
        try {
          const tournamentData = TournamentMapper.fromLichess(tournament);
          await tournamentRepository.upsertByExternalId(
            tournament.id,
            'lichess',
            tournamentData
          );
          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            tournamentId: tournament.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          logger.error('Failed to sync individual tournament', {
            tournamentId: tournament.id,
            error
          });
        }
      }

      logger.info('Completed syncing current Lichess tournaments', results);
      return results;
    } catch (error) {
      logger.error('Failed to sync current Lichess tournaments', { error });
      throw error;
    }
  }
}

export const tournamentService = new TournamentService();
