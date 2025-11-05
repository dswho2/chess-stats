'use client';

import { useState, useEffect } from 'react';
import api from '../api/client';
import type {
  TournamentsListResponse,
  Tournament,
  TournamentStanding,
  Game,
  TournamentGamesOptions
} from '../api/types';

/**
 * Hook to fetch current tournaments
 */
export function useCurrentTournaments() {
  const [data, setData] = useState<TournamentsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchTournaments() {
      try {
        setLoading(true);
        const response = await api.tournaments.getCurrent();

        if (isMounted) {
          setData(response);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch tournaments'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchTournaments();

    return () => {
      isMounted = false;
    };
  }, []);

  return { data, loading, error };
}

/**
 * Hook to fetch a specific tournament
 */
export function useTournament(platform: 'lichess' | 'swiss', id: string | null) {
  const [data, setData] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchTournament() {
      try {
        setLoading(true);
        const response = await api.tournaments.getById(platform, id);

        if (isMounted) {
          setData(response.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch tournament'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchTournament();

    return () => {
      isMounted = false;
    };
  }, [platform, id]);

  return { data, loading, error };
}

/**
 * Hook to fetch tournament standings
 */
export function useTournamentStandings(
  platform: 'lichess',
  id: string | null,
  limit: number = 100
) {
  const [data, setData] = useState<TournamentStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchStandings() {
      try {
        setLoading(true);
        const response = await api.tournaments.getResults(platform, id, limit);

        if (isMounted) {
          setData(response.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch standings'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchStandings();

    return () => {
      isMounted = false;
    };
  }, [platform, id, limit]);

  return { data, loading, error };
}

/**
 * Hook to fetch tournament games
 */
export function useTournamentGames(
  platform: 'lichess',
  id: string | null,
  options?: TournamentGamesOptions
) {
  const [data, setData] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchGames() {
      try {
        setLoading(true);
        const response = await api.tournaments.getGames(platform, id, options);

        if (isMounted) {
          setData(response.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch games'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchGames();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, id, JSON.stringify(options)]);

  return { data, loading, error };
}
