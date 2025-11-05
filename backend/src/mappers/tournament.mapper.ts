import { Prisma } from '@prisma/client';

/**
 * Tournament Mapper
 * Maps external API responses to Prisma Tournament schema format
 */
export class TournamentMapper {
  /**
   * Map Lichess tournament to Prisma format
   */
  static fromLichess(data: any): Prisma.TournamentCreateInput {
    // Determine status
    let status = 'upcoming';
    if (data.status === 30) status = 'completed';
    else if (data.status === 20) status = 'ongoing';
    else if (data.status === 10) status = 'upcoming';

    // Determine format
    let format = 'arena';
    if (data.variant === 'swiss') format = 'swiss';

    // Determine time control
    let timeControl = 'blitz';
    if (data.clock) {
      const totalSeconds = data.clock.limit + (data.clock.increment * 40);
      if (totalSeconds < 180) timeControl = 'bullet';
      else if (totalSeconds < 600) timeControl = 'blitz';
      else if (totalSeconds < 1500) timeControl = 'rapid';
      else timeControl = 'classical';
    }

    return {
      externalId: data.id,
      platform: 'lichess',
      name: data.fullName || data.name,
      slug: this.generateSlug(data.fullName || data.name),
      status,
      primaryFormat: format,
      timeControl,
      startDate: new Date(data.startsAt),
      endDate: data.finishesAt ? new Date(data.finishesAt) : undefined,
      participantCount: data.nbPlayers || 0,
      isOnline: true,
      isRated: true,
      officialUrl: `https://lichess.org/tournament/${data.id}`,
      description: data.description,
      metadata: data
    };
  }

  /**
   * Map Lichess Swiss tournament to Prisma format
   */
  static fromLichessSwiss(data: any): Prisma.TournamentCreateInput {
    // Determine status
    let status = 'upcoming';
    if (data.status === 'finished') status = 'completed';
    else if (data.status === 'started') status = 'ongoing';
    else if (data.status === 'created') status = 'upcoming';

    // Determine time control
    let timeControl = 'blitz';
    if (data.clock) {
      const totalSeconds = data.clock.limit + (data.clock.increment * 40);
      if (totalSeconds < 180) timeControl = 'bullet';
      else if (totalSeconds < 600) timeControl = 'blitz';
      else if (totalSeconds < 1500) timeControl = 'rapid';
      else timeControl = 'classical';
    }

    return {
      externalId: data.id,
      platform: 'lichess',
      name: data.name,
      slug: this.generateSlug(data.name),
      status,
      primaryFormat: 'swiss',
      timeControl,
      startDate: new Date(data.startsAt),
      endDate: data.finishesAt ? new Date(data.finishesAt) : undefined,
      participantCount: data.nbPlayers || 0,
      totalRounds: data.nbRounds,
      isOnline: true,
      isRated: data.rated !== false,
      officialUrl: `https://lichess.org/swiss/${data.id}`,
      description: data.description,
      metadata: data
    };
  }

  /**
   * Generate URL-friendly slug from tournament name
   */
  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Map Lichess tournament standing to Prisma format
   */
  static standingFromLichess(
    data: any,
    tournamentId: string,
    playerId: string
  ): Prisma.TournamentStandingCreateInput {
    return {
      tournament: { connect: { id: tournamentId } },
      player: { connect: { id: playerId } },
      placement: data.rank,
      score: data.score,
      rating: data.rating,
      performanceRating: data.performance,
      wins: data.nbWins || 0,
      draws: data.nbDraws || 0,
      losses: data.nbLosses || 0,
      gamesPlayed: data.nbGames || 0
    };
  }

  /**
   * Map Lichess game to Prisma format
   */
  static gameFromLichess(
    data: any,
    tournamentId: string,
    whitePlayerId: string,
    blackPlayerId: string
  ): Prisma.GameCreateInput {
    // Determine result
    let result: string = '*'; // Default to ongoing/unknown
    if (data.winner === 'white') result = '1-0';
    else if (data.winner === 'black') result = '0-1';
    else if (data.status === 'draw') result = '1/2-1/2';

    return {
      externalId: data.id,
      platform: 'lichess',
      tournament: { connect: { id: tournamentId } },
      whitePlayer: { connect: { id: whitePlayerId } },
      blackPlayer: { connect: { id: blackPlayerId } },
      roundNumber: data.round || 1,
      result,
      openingName: data.opening?.name,
      openingEco: data.opening?.eco,
      moves: data.moves,
      pgnUrl: `https://lichess.org/game/export/${data.id}`,
      analysisUrl: `https://lichess.org/${data.id}`,
      startTime: data.createdAt ? new Date(data.createdAt) : undefined,
      endTime: data.lastMoveAt ? new Date(data.lastMoveAt) : undefined,
      metadata: data
    };
  }
}
