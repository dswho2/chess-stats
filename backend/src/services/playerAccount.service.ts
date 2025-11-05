import { PlayerAccountRepository } from '../repositories/playerAccount.repository';
import { LichessService } from './lichess.service';
import { ChessComService } from './chesscom.service';
import { PlayerAccountMapper } from '../mappers/playerAccount.mapper';
import { logger } from '../utils/logger';

/**
 * PlayerAccount Service
 * Business logic for platform accounts (Lichess, Chess.com)
 * Handles both verified (linked to Player) and standalone accounts
 */
class PlayerAccountService {
  private playerAccountRepository = new PlayerAccountRepository();
  private lichessService = new LichessService();
  private chessComService = new ChessComService();

  /**
   * Get account by platform and accountId
   */
  async findByPlatformAccount(platform: string, accountId: string) {
    return this.playerAccountRepository.findByPlatformAccount(platform, accountId);
  }

  /**
   * Get all accounts for a player
   */
  async findByPlayerId(playerId: string) {
    return this.playerAccountRepository.findByPlayerId(playerId);
  }

  /**
   * Get standalone accounts (not linked to any Player)
   */
  async findStandaloneAccounts(options: {
    platform?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    return this.playerAccountRepository.findStandaloneAccounts(options);
  }

  /**
   * Sync Lichess account to database
   * Creates standalone account (not linked to Player)
   * Use linkToPlayer() to verify and link later
   */
  async syncFromLichess(username: string, playerId?: string) {
    try {
      logger.info('Syncing Lichess account', { username, playerId });

      // Fetch from Lichess API
      const lichessData = await this.lichessService.getPlayer(username);

      // Map to PlayerAccount format
      const accountData = PlayerAccountMapper.fromLichess(lichessData, playerId);

      // Upsert to database
      const account = await this.playerAccountRepository.upsertByPlatformAccount(
        'lichess',
        lichessData.id,
        accountData
      );

      logger.info('Successfully synced Lichess account', {
        username,
        lichessId: lichessData.id,
        accountId: account.id,
        linkedToPlayer: !!playerId,
        verified: account.verified
      });

      return account;
    } catch (error) {
      logger.error('Failed to sync Lichess account', { username, error });
      throw error;
    }
  }

  /**
   * Get or sync Lichess account
   * Tries to get from database first, syncs from API if not found
   */
  async getOrSyncFromLichess(username: string, playerId?: string) {
    // Try to find in database first
    let account = await this.playerAccountRepository.findByPlatformAccount('lichess', username);

    // If not found, sync from API
    if (!account) {
      logger.info('Account not in database, syncing from Lichess', { username });
      account = await this.syncFromLichess(username, playerId);
    }

    return account;
  }

  /**
   * Sync top Lichess players for a specific performance type
   * Creates standalone accounts (not linked to Players by default)
   */
  async syncTopFromLichess(
    perfType: 'bullet' | 'blitz' | 'rapid' | 'classical' | 'ultraBullet',
    count: number = 100
  ) {
    try {
      logger.info('Syncing top Lichess accounts', { perfType, count });

      const topPlayers = await this.lichessService.getTopPlayers(perfType, count);
      const results = {
        successful: 0,
        failed: 0,
        errors: [] as any[]
      };

      for (const playerData of topPlayers) {
        try {
          // Fetch full player data to get ratings
          const fullData = await this.lichessService.getPlayer(playerData.id);

          // Create standalone account
          const accountData = PlayerAccountMapper.fromLichess(fullData);

          await this.playerAccountRepository.upsertByPlatformAccount(
            'lichess',
            playerData.id,
            accountData
          );
          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            lichessId: playerData.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          logger.error('Failed to sync individual Lichess account', {
            lichessId: playerData.id,
            error
          });
        }
      }

      logger.info('Completed syncing top Lichess accounts', { perfType, ...results });
      return results;
    } catch (error) {
      logger.error('Failed to sync top Lichess accounts', { perfType, error });
      throw error;
    }
  }

  /**
   * Link an account to a Player (verification)
   */
  async linkToPlayer(accountId: string, playerId: string) {
    try {
      logger.info('Linking account to player', { accountId, playerId });

      const account = await this.playerAccountRepository.linkToPlayer(accountId, playerId);

      logger.info('Successfully linked account to player', {
        accountId,
        playerId,
        platform: account.platform,
        username: account.username
      });

      return account;
    } catch (error) {
      logger.error('Failed to link account to player', { accountId, playerId, error });
      throw error;
    }
  }

  /**
   * Unlink an account from a Player
   */
  async unlinkFromPlayer(accountId: string) {
    try {
      logger.info('Unlinking account from player', { accountId });

      const account = await this.playerAccountRepository.unlinkFromPlayer(accountId);

      logger.info('Successfully unlinked account from player', {
        accountId,
        platform: account.platform,
        username: account.username
      });

      return account;
    } catch (error) {
      logger.error('Failed to unlink account from player', { accountId, error });
      throw error;
    }
  }

  /**
   * Get leaderboard for a platform/time control
   * Returns mix of verified players and unverified accounts
   */
  async getLeaderboard(options: {
    platform: 'lichess' | 'chess-com';
    timeControl: 'bullet' | 'blitz' | 'rapid' | 'classical' | 'daily';
    limit?: number;
  }) {
    return this.playerAccountRepository.getTopByRating(options);
  }

  /**
   * Search accounts by username
   */
  async searchByUsername(query: string, limit: number = 20) {
    return this.playerAccountRepository.searchByUsername(query, limit);
  }

  /**
   * Sync Chess.com account to database
   * Creates standalone account (not linked to Player)
   * Use linkToPlayer() to verify and link later
   */
  async syncFromChessCom(username: string, playerId?: string) {
    try {
      logger.info('Syncing Chess.com account', { username, playerId });

      // Fetch from Chess.com API (both profile and stats)
      const chessComData = await this.chessComService.getPlayer(username);

      // Map to PlayerAccount format
      const accountData = PlayerAccountMapper.fromChessCom(
        { ...chessComData.profile, stats: chessComData.stats },
        playerId
      );

      // Upsert to database
      const account = await this.playerAccountRepository.upsertByPlatformAccount(
        'chess-com',
        username.toLowerCase(), // Chess.com usernames are case-insensitive
        accountData
      );

      logger.info('Successfully synced Chess.com account', {
        username,
        accountId: account.id,
        linkedToPlayer: !!playerId,
        verified: account.verified,
        ratings: {
          bullet: accountData.chessComBulletRating,
          blitz: accountData.chessComBlitzRating,
          rapid: accountData.chessComRapidRating
        }
      });

      return account;
    } catch (error) {
      logger.error('Failed to sync Chess.com account', { username, error });
      throw error;
    }
  }

  /**
   * Get or sync Chess.com account
   * Tries to get from database first, syncs from API if not found
   */
  async getOrSyncFromChessCom(username: string, playerId?: string) {
    // Try to find in database first
    let account = await this.playerAccountRepository.findByPlatformAccount(
      'chess-com',
      username.toLowerCase()
    );

    // If not found, sync from API
    if (!account) {
      logger.info('Account not in database, syncing from Chess.com', { username });
      account = await this.syncFromChessCom(username, playerId);
    }

    return account;
  }

  /**
   * Sync top Chess.com players for a specific time control
   * Creates standalone accounts (not linked to Players by default)
   */
  async syncTopFromChessCom(
    timeControl: 'bullet' | 'blitz' | 'rapid' | 'daily',
    count: number = 50
  ) {
    try {
      logger.info('Syncing top Chess.com accounts', { timeControl, count });

      const topPlayers = await this.chessComService.getTopPlayers(timeControl, count);
      const results = {
        successful: 0,
        failed: 0,
        errors: [] as any[]
      };

      for (const leaderboardPlayer of topPlayers) {
        try {
          // Fetch full player data (profile + stats)
          const playerData = await this.chessComService.getPlayer(leaderboardPlayer.username);

          // Create standalone account
          const accountData = PlayerAccountMapper.fromChessCom({
            ...playerData.profile,
            stats: playerData.stats
          });

          await this.playerAccountRepository.upsertByPlatformAccount(
            'chess-com',
            leaderboardPlayer.username.toLowerCase(),
            accountData
          );

          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            username: leaderboardPlayer.username,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          logger.error('Failed to sync individual Chess.com account', {
            username: leaderboardPlayer.username,
            error
          });
        }
      }

      logger.info('Completed syncing top Chess.com accounts', { timeControl, ...results });
      return results;
    } catch (error) {
      logger.error('Failed to sync top Chess.com accounts', { timeControl, error });
      throw error;
    }
  }
}

export const playerAccountService = new PlayerAccountService();
