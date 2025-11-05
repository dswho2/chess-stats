import { useState, useEffect } from 'react';

export interface RankingPlayer {
  account_id: string;
  player_id: string | null;
  display_name: string;
  profile_url: string;
  title: string | null;
  rating: number;
  avatar_url: string | null;
  is_verified_player: boolean;
  verified: boolean;
  country_iso: string | null;
}

export interface RankingsResponse {
  success: boolean;
  data: RankingPlayer[];
  count: number;
  type: string;
  platform?: string;
  timeControl?: string;
  source: string;
  timestamp: string;
}

export type RankingType =
  | 'fide-classical'
  | 'fide-rapid'
  | 'fide-blitz'
  | 'lichess-bullet'
  | 'lichess-blitz'
  | 'lichess-rapid'
  | 'lichess-classical'
  | 'chess-com-bullet'
  | 'chess-com-blitz'
  | 'chess-com-rapid'
  | 'chess-com-daily';

export function useRankings(type: RankingType, limit: number = 100) {
  const [data, setData] = useState<RankingPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchRankings() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `http://localhost:4000/api/players/rankings/${type}?limit=${limit}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json: RankingsResponse = await response.json();

        if (isMounted) {
          setData(json.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch rankings');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchRankings();

    return () => {
      isMounted = false;
    };
  }, [type, limit]);

  return { data, loading, error };
}
