import { Router, Request, Response } from 'express';
import { playerService } from '../services/player.service';
import { playerAccountService } from '../services/playerAccount.service';
import { logger } from '../utils/logger';
import { cache } from '../middleware/cache';
import { TTL } from '../services/cache.service';

const router = Router();

/**
 * GET /api/players
 * Get players from database with filtering and pagination
 * Cache: 10 minutes
 */
router.get('/', cache({ ttl: TTL.SHORT }), async (req: Request, res: Response) => {
  try {
    const {
      title,
      country,
      search,
      page = '1',
      limit = '20'
    } = req.query;

    const result = await playerService.findAll({
      title: title as string,
      country: country as string,
      search: search as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      source: 'Database',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in GET /api/players', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch players',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/players/:id
 * Get player by ID (UUID) or profileUrl from database
 * Cache: 1 hour
 */
router.get('/:id', cache({ ttl: TTL.LONG }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Player ID or profileUrl is required'
      });
    }

    // UUID regex pattern
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidPattern.test(id);

    // Try to fetch by UUID if it matches UUID format, otherwise try profileUrl
    let player = null;
    if (isUuid) {
      player = await playerService.findById(id);
    }

    if (!player) {
      // If not found by ID (or wasn't UUID), try by profileUrl
      player = await playerService.findByProfileUrl(id);
    }

    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    res.json({
      success: true,
      data: player,
      source: 'Database',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in GET /api/players/:id', { error, playerId: req.params.id });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch player',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/players/:id/tournaments
 * Get player's tournament history from database
 * Cache: 10 minutes
 */
router.get('/:id/tournaments', cache({ ttl: TTL.SHORT }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Player ID is required'
      });
    }

    const tournaments = await playerService.getTournamentHistory(id, limit);

    res.json({
      success: true,
      data: tournaments,
      count: tournaments.length,
      source: 'Database',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in GET /api/players/:id/tournaments', { error, playerId: req.params.id });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch player tournaments',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/players/rankings/:type
 * Get top players by rating type from database
 * Cache: 30 minutes
 *
 * NEW ARCHITECTURE:
 * - FIDE rankings come from Player table
 * - Lichess/Chess.com rankings come from PlayerAccount table (mixed verified/unverified)
 */
router.get('/rankings/:type', cache({ ttl: TTL.MEDIUM }), async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;

    // FIDE rankings (from Player table)
    if (type.startsWith('fide-')) {
      const fideRatingMap: Record<string, 'fideClassicalRating' | 'fideRapidRating' | 'fideBlitzRating'> = {
        'fide-classical': 'fideClassicalRating',
        'fide-rapid': 'fideRapidRating',
        'fide-blitz': 'fideBlitzRating'
      };

      const ratingField = fideRatingMap[type];

      if (!ratingField) {
        return res.status(400).json({
          success: false,
          error: 'Invalid FIDE rating type'
        });
      }

      const players = await playerService.getTopByRating(ratingField, limit);

      // Transform to match frontend RankingPlayer interface
      const formattedPlayers = players.map((player: any) => ({
        account_id: player.id,
        player_id: player.id,
        display_name: player.fullName,
        profile_url: player.profileUrl,
        title: player.title,
        rating: player[ratingField] || 0,
        avatar_url: player.avatarUrl,
        is_verified_player: true, // FIDE players are always verified
        verified: true,
        country_iso: player.countryIso
      }));

      return res.json({
        success: true,
        data: formattedPlayers,
        count: formattedPlayers.length,
        type,
        source: 'Database (Player table - FIDE)',
        timestamp: new Date().toISOString()
      });
    }

    // Platform rankings (from PlayerAccount table - mixed verified/unverified)
    const platformMap: Record<string, { platform: 'lichess' | 'chess-com', timeControl: 'bullet' | 'blitz' | 'rapid' | 'classical' | 'daily' }> = {
      'lichess-bullet': { platform: 'lichess', timeControl: 'bullet' },
      'lichess-blitz': { platform: 'lichess', timeControl: 'blitz' },
      'lichess-rapid': { platform: 'lichess', timeControl: 'rapid' },
      'lichess-classical': { platform: 'lichess', timeControl: 'classical' },
      'chess-com-bullet': { platform: 'chess-com', timeControl: 'bullet' },
      'chess-com-blitz': { platform: 'chess-com', timeControl: 'blitz' },
      'chess-com-rapid': { platform: 'chess-com', timeControl: 'rapid' },
      'chess-com-daily': { platform: 'chess-com', timeControl: 'daily' }
    };

    const platformConfig = platformMap[type];

    if (!platformConfig) {
      return res.status(400).json({
        success: false,
        error: 'Invalid rating type. Valid types: fide-classical, fide-rapid, fide-blitz, lichess-bullet, lichess-blitz, lichess-rapid, lichess-classical, chess-com-bullet, chess-com-blitz, chess-com-rapid, chess-com-daily'
      });
    }

    const leaderboard = await playerAccountService.getLeaderboard({
      platform: platformConfig.platform,
      timeControl: platformConfig.timeControl,
      limit
    });

    res.json({
      success: true,
      data: leaderboard,
      count: leaderboard.length,
      type,
      platform: platformConfig.platform,
      timeControl: platformConfig.timeControl,
      source: 'Database (PlayerAccount table - mixed verified/unverified)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in GET /api/players/rankings/:type', { error, type: req.params.type });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch rankings',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// Sync Endpoints (Admin operations to populate database)
// ============================================================================

/**
 * POST /api/players/sync/fide/top
 * Sync top FIDE players to database
 * Admin endpoint - no cache
 *
 * IMPORTANT: This route MUST come before /sync/fide/:fideId
 */
router.post('/sync/fide/top', async (req: Request, res: Response) => {
  try {
    const results = await playerService.syncTopFromFide();

    res.json({
      success: true,
      results,
      message: 'Top FIDE players sync completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in POST /api/players/sync/fide/top', { error });

    res.status(500).json({
      success: false,
      error: 'Failed to sync top FIDE players',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/players/sync/fide/:fideId
 * Sync a specific FIDE player to database
 * Admin endpoint - no cache
 *
 * IMPORTANT: This route MUST come after /sync/fide/top
 */
router.post('/sync/fide/:fideId', async (req: Request, res: Response) => {
  try {
    const { fideId } = req.params;

    if (!fideId) {
      return res.status(400).json({
        success: false,
        error: 'FIDE ID is required'
      });
    }

    const player = await playerService.getOrSyncFromFide(fideId);

    res.json({
      success: true,
      data: player,
      message: 'Player synced successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in POST /api/players/sync/fide/:fideId', {
      error,
      fideId: req.params.fideId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to sync FIDE player',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/players/sync/lichess/top
 * Sync top Lichess accounts to database
 * Admin endpoint - no cache
 *
 * NEW ARCHITECTURE: Creates PlayerAccounts (standalone/unverified)
 * Query params:
 *   - perfType: bullet | blitz | rapid | classical | ultraBullet (default: blitz)
 *   - count: number of accounts to sync (default: 100)
 *
 * IMPORTANT: This route MUST come before /sync/lichess/:username
 */
router.post('/sync/lichess/top', async (req: Request, res: Response) => {
  try {
    const perfType = (req.query.perfType || 'blitz') as 'bullet' | 'blitz' | 'rapid' | 'classical' | 'ultraBullet';
    const count = parseInt(req.query.count as string) || 100;

    const results = await playerAccountService.syncTopFromLichess(perfType, count);

    res.json({
      success: true,
      results,
      perfType,
      count,
      message: 'Top Lichess accounts sync completed (standalone/unverified)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in POST /api/players/sync/lichess/top', { error });

    res.status(500).json({
      success: false,
      error: 'Failed to sync top Lichess accounts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/players/sync/lichess/:username
 * Sync a Lichess account to database
 * Admin endpoint - no cache
 *
 * NEW ARCHITECTURE: Creates PlayerAccount (not Player)
 * Query params:
 *   - playerId: (optional) Link to existing Player for verification
 *
 * IMPORTANT: This route MUST come after /sync/lichess/top
 */
router.post('/sync/lichess/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const { playerId } = req.query;

    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username is required'
      });
    }

    const account = await playerAccountService.getOrSyncFromLichess(
      username,
      playerId as string | undefined
    );

    res.json({
      success: true,
      data: account,
      message: playerId
        ? 'Lichess account synced and linked to player'
        : 'Lichess account synced as standalone (unverified)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in POST /api/players/sync/lichess/:username', {
      error,
      username: req.params.username,
      playerId: req.query.playerId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to sync Lichess account',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/players/sync/chesscom/top
 * Sync top Chess.com accounts to database
 * Admin endpoint - no cache
 *
 * NEW ARCHITECTURE: Creates PlayerAccounts (standalone/unverified)
 * Query params:
 *   - timeControl: bullet | blitz | rapid | daily (default: blitz)
 *   - count: number of accounts to sync (default: 50, max 50)
 *
 * IMPORTANT: This route MUST come before /sync/chesscom/:username
 */
router.post('/sync/chesscom/top', async (req: Request, res: Response) => {
  try {
    const timeControl = (req.query.timeControl || 'blitz') as 'bullet' | 'blitz' | 'rapid' | 'daily';
    const count = Math.min(parseInt(req.query.count as string) || 50, 50); // Max 50

    const results = await playerAccountService.syncTopFromChessCom(timeControl, count);

    res.json({
      success: true,
      results,
      timeControl,
      count,
      message: 'Top Chess.com accounts sync completed (standalone/unverified)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in POST /api/players/sync/chesscom/top', { error });

    res.status(500).json({
      success: false,
      error: 'Failed to sync top Chess.com accounts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/players/sync/chesscom/:username
 * Sync a Chess.com account to database
 * Admin endpoint - no cache
 *
 * NEW ARCHITECTURE: Creates PlayerAccount (not Player)
 * Query params:
 *   - playerId: (optional) Link to existing Player for verification
 *
 * IMPORTANT: This route MUST come after /sync/chesscom/top
 */
router.post('/sync/chesscom/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const { playerId } = req.query;

    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username is required'
      });
    }

    const account = await playerAccountService.getOrSyncFromChessCom(
      username,
      playerId as string | undefined
    );

    res.json({
      success: true,
      data: account,
      message: playerId
        ? 'Chess.com account synced and linked to player'
        : 'Chess.com account synced as standalone (unverified)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in POST /api/players/sync/chesscom/:username', {
      error,
      username: req.params.username,
      playerId: req.query.playerId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to sync Chess.com account',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// PlayerAccount Endpoints (New Architecture)
// ============================================================================

/**
 * POST /api/players/accounts/link
 * Link a PlayerAccount to a Player (verification)
 * Admin endpoint - no cache
 * Body: { accountId: string, playerId: string }
 */
router.post('/accounts/link', async (req: Request, res: Response) => {
  try {
    const { accountId, playerId } = req.body;

    if (!accountId || !playerId) {
      return res.status(400).json({
        success: false,
        error: 'Both accountId and playerId are required'
      });
    }

    const account = await playerAccountService.linkToPlayer(accountId, playerId);

    res.json({
      success: true,
      data: account,
      message: 'Account successfully linked to player (verified)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in POST /api/players/accounts/link', {
      error,
      accountId: req.body.accountId,
      playerId: req.body.playerId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to link account to player',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/players/accounts/unlink
 * Unlink a PlayerAccount from a Player
 * Admin endpoint - no cache
 * Body: { accountId: string }
 */
router.post('/accounts/unlink', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'accountId is required'
      });
    }

    const account = await playerAccountService.unlinkFromPlayer(accountId);

    res.json({
      success: true,
      data: account,
      message: 'Account successfully unlinked from player',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in POST /api/players/accounts/unlink', {
      error,
      accountId: req.body.accountId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to unlink account from player',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/players/:id/accounts
 * Get all platform accounts for a player
 * Cache: 10 minutes
 */
router.get('/:id/accounts', cache({ ttl: TTL.SHORT }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Player ID is required'
      });
    }

    const accounts = await playerAccountService.findByPlayerId(id);

    res.json({
      success: true,
      data: accounts,
      count: accounts.length,
      source: 'Database',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in GET /api/players/:id/accounts', {
      error,
      playerId: req.params.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch player accounts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/players/accounts/search
 * Search accounts by username
 * Cache: 5 minutes
 */
router.get('/accounts/search', cache({ ttl: TTL.SHORT }), async (req: Request, res: Response) => {
  try {
    const { q, limit } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required'
      });
    }

    const accounts = await playerAccountService.searchByUsername(
      q,
      limit ? parseInt(limit as string) : undefined
    );

    res.json({
      success: true,
      data: accounts,
      count: accounts.length,
      query: q,
      source: 'Database',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in GET /api/players/accounts/search', {
      error,
      query: req.query.q
    });

    res.status(500).json({
      success: false,
      error: 'Failed to search accounts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
