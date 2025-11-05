import { BaseRepository } from './base.repository';
import { Prisma, Tournament } from '@prisma/client';

/**
 * Tournament Repository
 * Handles all database operations for tournaments
 */
export class TournamentRepository extends BaseRepository {
  /**
   * Find all tournaments with filtering and pagination
   */
  async findAll(params: {
    platform?: string;
    status?: string;
    timeControl?: string;
    page: number;
    limit: number;
  }) {
    const { platform, status, timeControl, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.TournamentWhereInput = {
      ...(platform && { platform }),
      ...(status && { status }),
      ...(timeControl && { timeControl }),
    };

    const [tournaments, total] = await Promise.all([
      this.prisma.tournament.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'desc' },
        include: {
          series: true,
          _count: {
            select: { standings: true, games: true }
          }
        }
      }),
      this.prisma.tournament.count({ where })
    ]);

    return {
      data: tournaments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find tournament by internal UUID
   */
  async findById(id: string) {
    return this.prisma.tournament.findUnique({
      where: { id },
      include: {
        series: true,
        stages: {
          orderBy: { stageNumber: 'asc' }
        },
        prizeDistribution: {
          orderBy: { placement: 'asc' }
        },
        _count: {
          select: {
            standings: true,
            games: true,
            stages: true
          }
        }
      }
    });
  }

  /**
   * Find tournament by external ID and platform
   * Used to check if a tournament from external API already exists
   */
  async findByExternalId(externalId: string, platform: string) {
    return this.prisma.tournament.findUnique({
      where: {
        tournaments_external_id_platform_key: {
          externalId,
          platform
        }
      }
    });
  }

  /**
   * Create a new tournament
   */
  async create(data: Prisma.TournamentCreateInput) {
    return this.prisma.tournament.create({ data });
  }

  /**
   * Update an existing tournament
   */
  async update(id: string, data: Prisma.TournamentUpdateInput) {
    return this.prisma.tournament.update({
      where: { id },
      data
    });
  }

  /**
   * Upsert tournament by external ID
   * Creates if doesn't exist, updates if it does
   * Used for syncing data from external APIs
   */
  async upsertByExternalId(
    externalId: string,
    platform: string,
    data: Prisma.TournamentCreateInput
  ) {
    return this.prisma.tournament.upsert({
      where: {
        tournaments_external_id_platform_key: {
          externalId,
          platform
        }
      },
      create: data,
      update: data
    });
  }

  /**
   * Get tournament standings
   * Optionally filtered by stage (for multi-stage tournaments)
   */
  async getStandings(tournamentId: string, stageId?: string) {
    return this.prisma.tournamentStanding.findMany({
      where: {
        tournamentId,
        ...(stageId && { stageId })
      },
      orderBy: [
        { placement: 'asc' }
      ],
      include: {
        player: {
          select: {
            id: true,
            fullName: true,
            profileUrl: true,
            title: true,
            countryIso: true,
            avatarUrl: true
          }
        }
      }
    });
  }

  /**
   * Get tournament games
   * Optionally filtered by round
   */
  async getGames(tournamentId: string, roundNumber?: number) {
    return this.prisma.game.findMany({
      where: {
        tournamentId,
        ...(roundNumber && { roundNumber })
      },
      orderBy: [
        { roundNumber: 'asc' },
        { boardNumber: 'asc' }
      ],
      include: {
        whitePlayer: {
          select: {
            id: true,
            fullName: true,
            profileUrl: true,
            title: true,
            countryIso: true
          }
        },
        blackPlayer: {
          select: {
            id: true,
            fullName: true,
            profileUrl: true,
            title: true,
            countryIso: true
          }
        }
      }
    });
  }

  /**
   * Get featured tournaments
   */
  async getFeatured(limit: number = 10) {
    return this.prisma.tournament.findMany({
      where: {
        featured: true,
        status: {
          in: ['upcoming', 'ongoing']
        }
      },
      take: limit,
      orderBy: { startDate: 'desc' },
      include: {
        series: true,
        _count: {
          select: { standings: true }
        }
      }
    });
  }

  /**
   * Delete a tournament
   */
  async delete(id: string) {
    return this.prisma.tournament.delete({
      where: { id }
    });
  }
}

export const tournamentRepository = new TournamentRepository();
