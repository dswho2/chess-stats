'use client';

import { useState, useEffect } from 'react';
import api from '../api/client';
import type {
  Player,
  TopPlayer,
  FidePlayer,
  FideRatingHistory,
  Game,
  PlayerGamesOptions,
  PerfType
} from '../api/types';

/**
 * Hook to fetch top FIDE players
 */
export function useFideTopPlayers() {
  const [data, setData] = useState<FidePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchPlayers() {
      try {
        setLoading(true);
        const response = await api.players.getFideTop();

        if (isMounted) {
          setData(response.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch FIDE top players'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchPlayers();

    return () => {
      isMounted = false;
    };
  }, []);

  return { data, loading, error };
}

/**
 * Hook to fetch FIDE player
 */
export function useFidePlayer(fideId: string | null) {
  const [data, setData] = useState<FidePlayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!fideId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchPlayer() {
      try {
        setLoading(true);
        const response = await api.players.getFidePlayer(fideId);

        if (isMounted) {
          setData(response.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch FIDE player'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchPlayer();

    return () => {
      isMounted = false;
    };
  }, [fideId]);

  return { data, loading, error };
}

/**
 * Hook to fetch FIDE player rating history
 */
export function useFideHistory(fideId: string | null) {
  const [data, setData] = useState<FideRatingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!fideId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchHistory() {
      try {
        setLoading(true);
        const response = await api.players.getFideHistory(fideId);

        if (isMounted) {
          setData(response.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch rating history'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [fideId]);

  return { data, loading, error };
}

/**
 * Hook to fetch top Lichess players
 */
export function useLichessTopPlayers(
  perfType: PerfType = 'blitz',
  count: number = 100
) {
  const [data, setData] = useState<TopPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchPlayers() {
      try {
        setLoading(true);
        const response = await api.players.getLichessTop(perfType, count);

        if (isMounted) {
          setData(response.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch Lichess top players'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchPlayers();

    return () => {
      isMounted = false;
    };
  }, [perfType, count]);

  return { data, loading, error };
}

/**
 * Hook to fetch Lichess player
 */
export function useLichessPlayer(username: string | null) {
  const [data, setData] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchPlayer() {
      try {
        setLoading(true);
        const response = await api.players.getLichessPlayer(username);

        if (isMounted) {
          setData(response.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch Lichess player'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchPlayer();

    return () => {
      isMounted = false;
    };
  }, [username]);

  return { data, loading, error };
}

/**
 * Hook to fetch Lichess player games
 */
export function useLichessGames(
  username: string | null,
  options?: PlayerGamesOptions
) {
  const [data, setData] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchGames() {
      try {
        setLoading(true);
        const response = await api.players.getLichessGames(username, options);

        if (isMounted) {
          setData(response.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch player games'));
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
  }, [username, JSON.stringify(options)]);

  return { data, loading, error };
}
