import { Prisma, PlayerAccount } from '@prisma/client';
import { BaseRepository } from './base.repository';

/**
 * PlayerAccount Repository
 * Handles database operations for platform accounts (Lichess, Chess.com)
 */
export class PlayerAccountRepository extends BaseRepository {
  /**
   * Find account by ID
   */
  async findById(id: string): Promise<PlayerAccount | null> {
    return this.prisma.playerAccount.findUnique({
      where: { id },
      include: {
        player: true, // Include linked Player if exists
        ratingHistory: {
          orderBy: { periodMonth: 'desc' },
          take: 12 // Last 12 months
        }
      }
    });
  }

  /**
   * Find account by platform and accountId
   */
  async findByPlatformAccount(
    platform: string,
    accountId: string
  ): Promise<PlayerAccount | null> {
    return this.prisma.playerAccount.findFirst({
      where: {
        platform,
        accountId,
        deleted: false
      },
      include: {
        player: true,
        ratingHistory: {
          orderBy: { periodMonth: 'desc' },
          take: 12
        }
      }
    });
  }

  /**
   * Find all accounts for a player
   */
  async findByPlayerId(playerId: string): Promise<PlayerAccount[]> {
    return this.prisma.playerAccount.findMany({
      where: {
        playerId,
        deleted: false
      },
      orderBy: { platform: 'asc' }
    });
  }

  /**
   * Find all standalone accounts (not linked to any Player)
   */
  async findStandaloneAccounts(options: {
    platform?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: PlayerAccount[]; total: number }> {
    const { platform, limit = 20, offset = 0 } = options;

    const where: Prisma.PlayerAccountWhereInput = {
      playerId: null, // Standalone accounts
      deleted: false,
      ...(platform && { platform })
    };

    const [data, total] = await Promise.all([
      this.prisma.playerAccount.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: [
          { lichessBlitzRating: 'desc' },
          { chessComBlitzRating: 'desc' }
        ]
      }),
      this.prisma.playerAccount.count({ where })
    ]);

    return { data, total };
  }

  /**
   * Create new account
   */
  async create(data: Prisma.PlayerAccountCreateInput): Promise<PlayerAccount> {
    return this.prisma.playerAccount.create({
      data,
      include: {
        player: true
      }
    });
  }

  /**
   * Update account
   */
  async update(id: string, data: Prisma.PlayerAccountUpdateInput): Promise<PlayerAccount> {
    return this.prisma.playerAccount.update({
      where: { id },
      data,
      include: {
        player: true
      }
    });
  }

  /**
   * Upsert account by platform and accountId
   * Creates if doesn't exist, updates if exists
   */
  async upsertByPlatformAccount(
    platform: string,
    accountId: string,
    data: Prisma.PlayerAccountCreateInput
  ): Promise<PlayerAccount> {
    const existing = await this.findByPlatformAccount(platform, accountId);

    if (existing) {
      // Update existing account
      const { player, ...updateData } = data as any;
      return this.update(existing.id, updateData);
    }

    // Create new account
    return this.create(data);
  }

  /**
   * Link account to a Player (verification)
   */
  async linkToPlayer(accountId: string, playerId: string): Promise<PlayerAccount> {
    return this.prisma.playerAccount.update({
      where: { id: accountId },
      data: {
        player: { connect: { id: playerId } },
        verified: true,
        verifiedAt: new Date()
      },
      include: {
        player: true
      }
    });
  }

  /**
   * Unlink account from Player
   */
  async unlinkFromPlayer(accountId: string): Promise<PlayerAccount> {
    return this.prisma.playerAccount.update({
      where: { id: accountId },
      data: {
        player: { disconnect: true },
        verified: false,
        verifiedAt: null
      }
    });
  }

  /**
   * Soft delete account
   */
  async softDelete(id: string): Promise<PlayerAccount> {
    return this.prisma.playerAccount.update({
      where: { id },
      data: { deleted: true }
    });
  }

  /**
   * Get top accounts by rating (for leaderboards)
   * Shows mix of verified players and unverified accounts
   */
  async getTopByRating(options: {
    platform: 'lichess' | 'chess-com';
    timeControl: 'bullet' | 'blitz' | 'rapid' | 'classical' | 'daily';
    limit?: number;
  }): Promise<any[]> {
    const { platform, timeControl, limit = 100 } = options;

    // Determine which rating field to use
    let ratingField: string;
    if (platform === 'lichess') {
      ratingField = `lichess_${timeControl}_rating`;
    } else {
      ratingField = `chess_com_${timeControl}_rating`;
    }

    // Raw query to join PlayerAccount with Player
    // This shows both verified players (with real names) and unverified accounts (with usernames)
    const results = await this.prisma.$queryRawUnsafe(`
      SELECT
        pa.id as account_id,
        p.id as player_id,
        COALESCE(p.full_name, pa.username) as display_name,
        pa.username,
        p.title,
        pa.${ratingField} as rating,
        COALESCE(p.avatar_url, pa.avatar_url) as avatar_url,
        (p.id IS NOT NULL) as is_verified_player,
        pa.verified,
        p.country_iso,
        COALESCE(p.profile_url, pa.username) as profile_url
      FROM player_accounts pa
      LEFT JOIN players p ON pa.player_id = p.id
      WHERE pa.platform = $1
        AND pa.deleted = false
        AND pa.${ratingField} IS NOT NULL
      ORDER BY pa.${ratingField} DESC NULLS LAST
      LIMIT $2
    `, platform, limit);

    return results as any[];
  }

  /**
   * Search accounts by username
   */
  async searchByUsername(query: string, limit: number = 20): Promise<PlayerAccount[]> {
    return this.prisma.playerAccount.findMany({
      where: {
        username: {
          contains: query,
          mode: 'insensitive'
        },
        deleted: false
      },
      take: limit,
      include: {
        player: true
      },
      orderBy: [
        { verified: 'desc' }, // Verified accounts first
        { lichessBlitzRating: 'desc' }
      ]
    });
  }
}
