import { Prisma } from '@prisma/client';
import { fideToIso } from '../utils/countryCodeMapper';

/**
 * Player Mapper
 * Maps external API responses to Prisma Player schema format
 */
export class PlayerMapper {
  /**
   * Map FIDE API player data to Prisma format
   */
  static fromFide(data: any): Prisma.PlayerCreateInput {
    // Fix name format from "Last, First" to "First Last"
    let fullName = data.name;
    if (fullName && fullName.includes(',')) {
      const parts = fullName.split(',').map((p: string) => p.trim());
      if (parts.length === 2) {
        fullName = `${parts[1]} ${parts[0]}`; // "Last, First" -> "First Last"
      }
    }

    const profileUrl = this.generateProfileUrl(fullName);

    // Handle both full country names and country codes
    const rawCountry = data.country || data.federation;

    // fideToIso() already handles both full names and codes
    const countryIso = fideToIso(rawCountry || '');

    // Convert ISO back to FIDE 3-letter code for storage
    const countryFide = this.isoToFide(countryIso);

    // Parse ratings - API might return strings or numbers
    const parseRating = (rating: any) => rating ? parseInt(rating.toString()) : undefined;

    // Convert full FIDE titles to abbreviations
    const parseFideTitle = (title: any): string | undefined => {
      if (!title) return undefined;
      const titleStr = title.toString().trim();

      // Map full titles to abbreviations
      const titleMap: Record<string, string> = {
        'Grandmaster': 'GM',
        'International Master': 'IM',
        'FIDE Master': 'FM',
        'Candidate Master': 'CM',
        'Woman Grandmaster': 'WGM',
        'Woman International Master': 'WIM',
        'Woman FIDE Master': 'WFM',
        'Woman Candidate Master': 'WCM'
      };

      return titleMap[titleStr] || titleStr;
    };

    return {
      fideId: data.fide_id?.toString(),
      fullName,
      profileUrl,
      title: parseFideTitle(data.title || data.fide_title),
      countryFide,
      countryIso,
      fideClassicalRating: parseRating(data.classical_rating || data.standard_rating || data.rating),
      fideRapidRating: parseRating(data.rapid_rating),
      fideBlitzRating: parseRating(data.blitz_rating),
      birthYear: data.birth_year ? parseInt(data.birth_year.toString()) : undefined
    };
  }

  /**
   * Map Lichess player data - DEPRECATED
   * Use PlayerAccountMapper.fromLichess() instead
   *
   * Lichess accounts are now stored in PlayerAccount table, not Player table.
   */

  /**
   * Update existing player with FIDE data
   * Used when player already exists and we're adding FIDE info
   */
  static updateWithFide(data: any): Prisma.PlayerUpdateInput {
    const parseRating = (rating: any) => rating ? parseInt(rating.toString()) : undefined;

    return {
      fideId: data.fide_id?.toString(),
      title: data.title || undefined,
      countryFide: data.federation,
      countryIso: fideToIso(data.federation || ''),
      fideClassicalRating: parseRating(data.standard_rating || data.rating),
      fideRapidRating: parseRating(data.rapid_rating),
      fideBlitzRating: parseRating(data.blitz_rating),
      birthYear: data.birth_year ? parseInt(data.birth_year.toString()) : undefined
    };
  }

  /**
   * Update existing player with Lichess data - DEPRECATED
   * Use PlayerAccountMapper.updateFromLichess() instead
   */

  /**
   * Generate URL-friendly profile slug from name
   */
  private static generateProfileUrl(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Convert ISO 2-letter code to FIDE 3-letter code
   * Creates reverse mapping from the FIDE_TO_ISO table
   */
  private static isoToFide(iso: string): string {
    if (!iso) return '';

    // Import the FIDE_TO_ISO mapping from utils
    const { FIDE_TO_ISO } = require('../utils/countryCodeMapper');

    // Create reverse lookup
    for (const [fideCode, isoCode] of Object.entries(FIDE_TO_ISO)) {
      if (isoCode === iso) {
        return fideCode;
      }
    }

    // If not found, return empty string (unmapped country)
    return '';
  }

  /**
   * Map Lichess top player to simplified format
   * Used for rankings endpoints
   */
  static topPlayerFromLichess(data: any, rank: number) {
    return {
      rank,
      username: data.id,
      fullName: data.username,
      title: data.title,
      rating: data.perfs?.blitz?.rating || data.rating,
      country: data.profile?.country
    };
  }

  /**
   * Map FIDE top player to simplified format
   * Used for rankings endpoints
   */
  static topPlayerFromFide(data: any, rank: number) {
    return {
      rank,
      fideId: data.fide_id?.toString(),
      fullName: data.name,
      title: data.title,
      rating: data.standard_rating || data.rating,
      country: fideToIso(data.federation || '')
    };
  }
}
