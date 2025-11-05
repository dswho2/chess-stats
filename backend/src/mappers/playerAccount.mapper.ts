import { Prisma } from '@prisma/client';

/**
 * PlayerAccount Mapper
 * Maps platform API responses (Lichess/Chess.com) to PlayerAccount schema
 */
export class PlayerAccountMapper {
  /**
   * Map Lichess player data to PlayerAccount format
   */
  static fromLichess(data: any, playerId?: string): Prisma.PlayerAccountCreateInput {
    // Extract ratings from perfs object
    const lichessBulletRating = data.perfs?.bullet?.rating;
    const lichessBlitzRating = data.perfs?.blitz?.rating;
    const lichessRapidRating = data.perfs?.rapid?.rating;
    const lichessClassicalRating = data.perfs?.classical?.rating;
    const lichessUltrabulletRating = data.perfs?.ultraBullet?.rating;

    return {
      // Link to Player if provided (verified account), otherwise standalone
      player: playerId ? { connect: { id: playerId } } : undefined,

      // Platform info
      platform: 'lichess',
      accountId: data.id,
      username: data.username,

      // Verification status
      verified: !!playerId, // Verified if linked to a Player
      verifiedAt: playerId ? new Date() : undefined,

      // Profile
      profileUrl: `https://lichess.org/@/${data.username}`,
      avatarUrl: data.profile?.avatar,

      // Ratings
      lichessBulletRating,
      lichessBlitzRating,
      lichessRapidRating,
      lichessClassicalRating,
      lichessUltrabulletRating,

      // Metadata (store raw data for future use)
      metadata: {
        title: data.title,
        patron: data.patron,
        online: data.online,
        createdAt: data.createdAt,
        seenAt: data.seenAt,
        profile: data.profile,
        count: data.count,
        playTime: data.playTime
      }
    };
  }

  /**
   * Map Chess.com player data to PlayerAccount format
   */
  static fromChessCom(data: any, playerId?: string): Prisma.PlayerAccountCreateInput {
    // Chess.com stats are in a separate endpoint, passed as data.stats
    const stats = data.stats;

    return {
      // Link to Player if provided (verified account), otherwise standalone
      player: playerId ? { connect: { id: playerId } } : undefined,

      // Platform info
      platform: 'chess-com',
      accountId: data.username, // Chess.com uses username as ID
      username: data.username,

      // Verification status
      verified: !!playerId,
      verifiedAt: playerId ? new Date() : undefined,

      // Profile
      profileUrl: data.url,
      avatarUrl: data.avatar,

      // Ratings (from stats endpoint)
      chessComBulletRating: stats?.chess_bullet?.last?.rating,
      chessComBlitzRating: stats?.chess_blitz?.last?.rating,
      chessComRapidRating: stats?.chess_rapid?.last?.rating,
      chessComDailyRating: stats?.chess_daily?.last?.rating,

      // Metadata
      metadata: {
        playerId: data.player_id,
        title: data.title,
        status: data.status,
        name: data.name,
        country: data.country,
        location: data.location,
        joined: data.joined,
        lastOnline: data.last_online,
        followers: data.followers,
        isStreamer: data.is_streamer,
        verified: data.verified,
        stats: stats
      }
    };
  }

  /**
   * Update existing PlayerAccount with Lichess data
   */
  static updateFromLichess(data: any): Prisma.PlayerAccountUpdateInput {
    const lichessBulletRating = data.perfs?.bullet?.rating;
    const lichessBlitzRating = data.perfs?.blitz?.rating;
    const lichessRapidRating = data.perfs?.rapid?.rating;
    const lichessClassicalRating = data.perfs?.classical?.rating;
    const lichessUltrabulletRating = data.perfs?.ultraBullet?.rating;

    return {
      username: data.username,
      profileUrl: `https://lichess.org/@/${data.username}`,
      avatarUrl: data.profile?.avatar,
      lichessBulletRating,
      lichessBlitzRating,
      lichessRapidRating,
      lichessClassicalRating,
      lichessUltrabulletRating,
      metadata: {
        title: data.title,
        patron: data.patron,
        online: data.online,
        createdAt: data.createdAt,
        seenAt: data.seenAt,
        profile: data.profile,
        count: data.count,
        playTime: data.playTime
      }
    };
  }

  /**
   * Update existing PlayerAccount with Chess.com data
   */
  static updateFromChessCom(data: any): Prisma.PlayerAccountUpdateInput {
    const stats = data.stats;

    return {
      username: data.username,
      profileUrl: data.url,
      avatarUrl: data.avatar,
      chessComBulletRating: stats?.chess_bullet?.last?.rating,
      chessComBlitzRating: stats?.chess_blitz?.last?.rating,
      chessComRapidRating: stats?.chess_rapid?.last?.rating,
      chessComDailyRating: stats?.chess_daily?.last?.rating,
      metadata: {
        playerId: data.player_id,
        title: data.title,
        status: data.status,
        name: data.name,
        country: data.country,
        location: data.location,
        joined: data.joined,
        lastOnline: data.last_online,
        followers: data.followers,
        isStreamer: data.is_streamer,
        verified: data.verified,
        stats: stats
      }
    };
  }

  /**
   * Link an existing standalone account to a Player (verification)
   */
  static linkToPlayer(playerId: string): Prisma.PlayerAccountUpdateInput {
    return {
      player: { connect: { id: playerId } },
      verified: true,
      verifiedAt: new Date()
    };
  }

  /**
   * Unlink an account from a Player
   */
  static unlinkFromPlayer(): Prisma.PlayerAccountUpdateInput {
    return {
      player: { disconnect: true },
      verified: false,
      verifiedAt: null
    };
  }
}
