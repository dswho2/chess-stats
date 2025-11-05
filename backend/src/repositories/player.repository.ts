import { BaseRepository } from './base.repository';
import { Prisma } from '@prisma/client';

/**
 * Player Repository
 * Handles all database operations for players
 */
export class PlayerRepository extends BaseRepository {
  /**
   * Find all players with filtering and pagination
   */
  async findAll(params: {
    title?: string;
    country?: string;
    search?: string;
    page: number;
    limit: number;
  }) {
    const { title, country, search, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.PlayerWhereInput = {
      deleted: false,
      ...(title && { title }),
      ...(country && { countryIso: country }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { profileUrl: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [players, total] = await Promise.all([
      this.prisma.player.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fideClassicalRating: 'desc' },
        include: {
          statistics: true
        }
      }),
      this.prisma.player.count({ where })
    ]);

    return {
      data: players,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find player by internal UUID
   */
  async findById(id: string) {
    return this.prisma.player.findUnique({
      where: { id },
      include: {
        statistics: true,
        accounts: {
          where: { deleted: false }
        }
      }
    });
  }

  /**
   * Find player by profile URL (username slug)
   */
  async findByProfileUrl(profileUrl: string) {
    return this.prisma.player.findUnique({
      where: { profileUrl },
      include: {
        statistics: true,
        accounts: {
          where: { deleted: false }
        }
      }
    });
  }

  /**
   * Find player by FIDE ID
   */
  async findByFideId(fideId: string) {
    return this.prisma.player.findUnique({
      where: { fideId },
      include: {
        statistics: true
      }
    });
  }

  /**
   * Find player by platform account
   * Use PlayerAccountRepository for direct platform account lookups
   */

  /**
   * Create a new player
   */
  async create(data: Prisma.PlayerCreateInput) {
    return this.prisma.player.create({
      data,
      include: {
        statistics: true
      }
    });
  }

  /**
   * Update an existing player
   */
  async update(id: string, data: Prisma.PlayerUpdateInput) {
    return this.prisma.player.update({
      where: { id },
      data,
      include: {
        statistics: true
      }
    });
  }

  /**
   * Upsert player by FIDE ID
   */
  async upsertByFideId(fideId: string, data: Prisma.PlayerCreateInput) {
    return this.prisma.player.upsert({
      where: { fideId },
      create: data,
      update: data,
      include: {
        statistics: true
      }
    });
  }

  /**
   * Upsert methods for platform accounts moved to PlayerAccountRepository
   * Players are now created from FIDE data only
   * Platform accounts (Lichess/Chess.com) are managed separately
   */

  /**
   * Get player tournament history
   */
  async getTournamentHistory(playerId: string, limit = 20) {
    return this.prisma.tournamentStanding.findMany({
      where: { playerId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            platform: true,
            timeControl: true,
            startDate: true,
            slug: true
          }
        }
      }
    });
  }

  /**
   * Get top players by FIDE rating type
   * For Lichess/Chess.com rankings, use PlayerAccountRepository.getTopByRating()
   */
  async getTopByRating(
    ratingField: 'fideClassicalRating' | 'fideRapidRating' | 'fideBlitzRating',
    limit: number = 100
  ) {
    return this.prisma.player.findMany({
      where: {
        deleted: false,
        [ratingField]: {
          not: null
        }
      },
      take: limit,
      orderBy: {
        [ratingField]: 'desc'
      },
      select: {
        id: true,
        fullName: true,
        profileUrl: true,
        title: true,
        countryIso: true,
        avatarUrl: true,
        [ratingField]: true
      }
    });
  }

  /**
   * Soft delete a player
   */
  async softDelete(id: string) {
    return this.prisma.player.update({
      where: { id },
      data: { deleted: true }
    });
  }
}

export const playerRepository = new PlayerRepository();
