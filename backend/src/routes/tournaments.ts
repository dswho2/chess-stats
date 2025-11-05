import { Router, Request, Response } from 'express';
import { tournamentService } from '../services/tournament.service';
import { logger } from '../utils/logger';
import { cache } from '../middleware/cache';
import { TTL } from '../services/cache.service';

const router = Router();

/**
 * GET /api/tournaments
 * Get tournaments from database with filtering and pagination
 * Cache: 5 minutes
 */
router.get('/', cache({ ttl: TTL.LIVE }), async (req: Request, res: Response) => {
  try {
    const {
      platform,
      status,
      timeControl,
      page = '1',
      limit = '20'
    } = req.query;

    const result = await tournamentService.findAll({
      platform: platform as string,
      status: status as string,
      timeControl: timeControl as string,
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
    logger.error('Error in GET /api/tournaments', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tournaments',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/tournaments/:id
 * Get specific tournament details from database
 * Cache: 10 minutes
 */
router.get('/:id', cache({ ttl: TTL.SHORT }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Tournament ID is required'
      });
    }

    const tournament = await tournamentService.findById(id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    res.json({
      success: true,
      data: tournament,
      source: 'Database',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in GET /api/tournaments/:id', {
      error,
      tournamentId: req.params.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch tournament',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/tournaments/:id/standings
 * Get tournament standings from database
 * Cache: 5 minutes
 */
router.get('/:id/standings', cache({ ttl: TTL.LIVE }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { stageId } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Tournament ID is required'
      });
    }

    const standings = await tournamentService.getStandings(id, stageId as string);

    res.json({
      success: true,
      data: standings,
      count: standings.length,
      source: 'Database',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in GET /api/tournaments/:id/standings', {
      error,
      tournamentId: req.params.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch tournament standings',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/tournaments/:id/games
 * Get tournament games from database
 * Cache: 10 minutes
 */
router.get('/:id/games', cache({ ttl: TTL.SHORT }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { round } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Tournament ID is required'
      });
    }

    const games = await tournamentService.getGames(
      id,
      round ? parseInt(round as string) : undefined
    );

    res.json({
      success: true,
      data: games,
      count: games.length,
      source: 'Database',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in GET /api/tournaments/:id/games', {
      error,
      tournamentId: req.params.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch tournament games',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/tournaments/featured
 * Get featured tournaments from database
 * Cache: 5 minutes
 */
router.get('/featured', cache({ ttl: TTL.LIVE }), async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const tournaments = await tournamentService.getFeatured(limit);

    res.json({
      success: true,
      data: tournaments,
      count: tournaments.length,
      source: 'Database',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in GET /api/tournaments/featured', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured tournaments',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/tournaments/sync/lichess/:id
 * Sync a specific Lichess tournament to database
 * Admin endpoint - no cache
 */
router.post('/sync/lichess/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isSwiss } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Tournament ID is required'
      });
    }

    const tournament = await tournamentService.getOrSyncFromLichess(
      id,
      isSwiss === 'true'
    );

    res.json({
      success: true,
      data: tournament,
      message: 'Tournament synced successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in POST /api/tournaments/sync/lichess/:id', {
      error,
      tournamentId: req.params.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to sync tournament',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/tournaments/sync/lichess/current
 * Sync all current Lichess tournaments to database
 * Admin endpoint - no cache
 */
router.post('/sync/lichess/current', async (req: Request, res: Response) => {
  try {
    const results = await tournamentService.syncCurrentFromLichess();

    res.json({
      success: true,
      results,
      message: 'Current tournaments sync completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in POST /api/tournaments/sync/lichess/current', { error });

    res.status(500).json({
      success: false,
      error: 'Failed to sync current tournaments',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
