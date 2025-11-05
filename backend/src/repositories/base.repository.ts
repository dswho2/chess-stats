import prisma from '../utils/prisma';

/**
 * Base Repository Class
 * Provides common database utilities for all repositories
 */
export abstract class BaseRepository {
  protected prisma = prisma;

  /**
   * Check database health
   * @returns true if database is reachable, false otherwise
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Disconnect from database (cleanup)
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
