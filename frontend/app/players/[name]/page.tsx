"use client";

/**
 * Player Detail Page
 * Shows player profile, stats, recent games, and tournament history
 */

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getCountryFlag } from "@/lib/api/mappers";

interface PlayerAccount {
  id: string;
  playerId: string | null;
  platform: string;
  accountId: string;
  username: string | null;
  verified: boolean;
  profileUrl: string | null;
  avatarUrl: string | null;
  chessComBulletRating: number | null;
  chessComBlitzRating: number | null;
  chessComRapidRating: number | null;
  chessComDailyRating: number | null;
  lichessBulletRating: number | null;
  lichessBlitzRating: number | null;
  lichessRapidRating: number | null;
  lichessClassicalRating: number | null;
  lichessUltrabulletRating: number | null;
  createdAt: string;
  updatedAt: string;
}

interface Player {
  id: string;
  fullName: string;
  profileUrl: string;
  title: string | null;
  countryFide: string | null;
  countryIso: string | null;
  avatarUrl: string | null;
  fideId: string | null;
  fideClassicalRating: number | null;
  fideRapidRating: number | null;
  fideBlitzRating: number | null;
  birthYear: number | null;
  createdAt: string;
  updatedAt: string;
  statistics?: {
    tournamentsPlayed: number;
    totalGames: number;
    wins: number;
    draws: number;
    losses: number;
    winRate: number;
    averagePlacement: number | null;
    bestPerformanceRating: number | null;
  };
}

interface PlayerResponse {
  success: boolean;
  data: Player;
  source: string;
  timestamp: string;
}

interface AccountsResponse {
  success: boolean;
  data: PlayerAccount[];
  count: number;
  source: string;
  timestamp: string;
}

interface PlayerPageProps {
  params: Promise<{ name: string }>;
}

export default function PlayerPage({ params }: PlayerPageProps) {
  const { name } = use(params);
  const [player, setPlayer] = useState<Player | null>(null);
  const [accounts, setAccounts] = useState<PlayerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlayer() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`http://localhost:4000/api/players/${name}`);

        if (response.status === 404) {
          setError('Player not found');
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json: PlayerResponse = await response.json();
        setPlayer(json.data);

        // Fetch player accounts
        const accountsResponse = await fetch(`http://localhost:4000/api/players/${json.data.id}/accounts`);
        if (accountsResponse.ok) {
          const accountsJson: AccountsResponse = await accountsResponse.json();
          setAccounts(accountsJson.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch player');
      } finally {
        setLoading(false);
      }
    }

    fetchPlayer();
  }, [name]);

  const getPlacementColor = (placement: number): string => {
    if (placement === 1) return "text-amber-400";
    if (placement === 2) return "text-gray-400";
    if (placement === 3) return "text-orange-600";
    return "text-[--color-text-secondary]";
  };

  const getPlatformUrl = (account: PlayerAccount): string => {
    if (account.profileUrl) return account.profileUrl;

    if (account.platform === 'chess-com' && account.username) {
      return `https://www.chess.com/member/${account.username}`;
    }
    if (account.platform === 'lichess' && account.username) {
      return `https://lichess.org/@/${account.username}`;
    }
    return '#';
  };

  // Get highest ratings from all accounts for each platform
  const getHighestRatings = () => {
    const chessComAccounts = accounts.filter(acc => acc.platform === 'chess-com');
    const lichessAccounts = accounts.filter(acc => acc.platform === 'lichess');

    const chessComRatings = {
      bullet: Math.max(0, ...chessComAccounts.map(acc => acc.chessComBulletRating || 0)),
      blitz: Math.max(0, ...chessComAccounts.map(acc => acc.chessComBlitzRating || 0)),
      rapid: Math.max(0, ...chessComAccounts.map(acc => acc.chessComRapidRating || 0)),
      daily: Math.max(0, ...chessComAccounts.map(acc => acc.chessComDailyRating || 0)),
    };

    const lichessRatings = {
      bullet: Math.max(0, ...lichessAccounts.map(acc => acc.lichessBulletRating || 0)),
      blitz: Math.max(0, ...lichessAccounts.map(acc => acc.lichessBlitzRating || 0)),
      rapid: Math.max(0, ...lichessAccounts.map(acc => acc.lichessRapidRating || 0)),
      classical: Math.max(0, ...lichessAccounts.map(acc => acc.lichessClassicalRating || 0)),
    };

    return { chessComRatings, lichessRatings, hasChessCom: chessComAccounts.length > 0, hasLichess: lichessAccounts.length > 0 };
  };

  if (loading) {
    return <LoadingSpinner message="Loading player profile..." />;
  }

  if (error || !player) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Link
            href="/rankings"
            className="text-sm text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors"
          >
            ← Back to Rankings
          </Link>
        </div>
        <div className="bg-[--color-secondary-bg] border border-[--color-border] rounded-lg p-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-[--color-text-primary] mb-2">
              Player Not Found
            </h2>
            <p className="text-[--color-text-secondary]">
              The player "{name}" could not be found in our database.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { chessComRatings, lichessRatings, hasChessCom, hasLichess } = getHighestRatings();

  // Mock tournament data - will be replaced with real data later
  const recentPlacements: Array<{ tournamentId: string; tournament: string; date: string; placement: number; prize: number }> = [];
  const totalWinnings = recentPlacements.reduce((sum, p) => sum + p.prize, 0);

  // Statistics
  const stats = player.statistics || {
    tournamentsPlayed: 0,
    totalGames: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    winRate: 0,
    averagePlacement: null,
    bestPerformanceRating: null,
  };

  const hasAnyStats = stats.tournamentsPlayed > 0 || stats.totalGames > 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Back Link */}
      <div>
        <Link
          href="/rankings"
          className="text-sm text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors"
        >
          ← Back to Rankings
        </Link>
      </div>

      {/* Player Header Card */}
      <div className="bg-[--color-secondary-bg] dark:bg-[--color-secondary-bg] light:bg-white border border-[--color-border] dark:border-[--color-border] light:border-gray-200 rounded-lg p-8">
        <div className="flex gap-8 items-start">
          {/* Avatar */}
          <div className="w-[120px] h-[120px] rounded-lg bg-[--color-tertiary-bg] dark:bg-[--color-tertiary-bg] light:bg-gray-100 flex items-center justify-center text-5xl font-bold text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-500 flex-shrink-0">
            {player.avatarUrl ? (
              <img
                src={player.avatarUrl}
                alt={player.fullName}
                className="w-full h-full rounded-lg object-cover"
              />
            ) : (
              player.fullName.charAt(0)
            )}
          </div>

          {/* Player Info */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Name and Title */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 m-0">
                  {player.fullName}
                </h1>
                {player.title && (
                  <span className="text-base font-bold text-blue-500 bg-blue-500/10 py-1 px-3 rounded">
                    {player.title}
                  </span>
                )}
                {player.countryIso && (
                  <>
                    <span className="text-3xl">{getCountryFlag(player.countryIso)}</span>
                    <span className="text-base text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600">
                      {player.countryFide}
                    </span>
                  </>
                )}
              </div>
              {player.fideId && (
                <p className="text-base text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 m-0">
                  FIDE ID: {player.fideId}
                  {player.birthYear && ` • Born: ${player.birthYear}`}
                </p>
              )}
            </div>

            {/* Ratings - Compact inline display */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* FIDE Ratings */}
              {(player.fideClassicalRating || player.fideRapidRating || player.fideBlitzRating) && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800">
                      FIDE:
                    </span>
                    <div className="flex gap-2">
                      {player.fideClassicalRating && (
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 uppercase">Classical</span>
                          <span className="text-base font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 font-mono">
                            {player.fideClassicalRating}
                          </span>
                        </div>
                      )}
                      {player.fideRapidRating && (
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 uppercase">Rapid</span>
                          <span className="text-base font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 font-mono">
                            {player.fideRapidRating}
                          </span>
                        </div>
                      )}
                      {player.fideBlitzRating && (
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 uppercase">Blitz</span>
                          <span className="text-base font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 font-mono">
                            {player.fideBlitzRating}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {(hasChessCom || hasLichess) && (
                    <div className="w-px h-8 bg-[--color-border] dark:bg-[--color-border] light:bg-gray-200" />
                  )}
                </>
              )}

              {/* Chess.com Ratings */}
              {hasChessCom && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[--color-chess-com]">Chess.com:</span>
                    <div className="flex gap-2">
                      {chessComRatings.bullet > 0 && (
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 uppercase">Bullet</span>
                          <span className="text-base font-bold text-[--color-chess-com] font-mono">
                            {chessComRatings.bullet}
                          </span>
                        </div>
                      )}
                      {chessComRatings.blitz > 0 && (
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 uppercase">Blitz</span>
                          <span className="text-base font-bold text-[--color-chess-com] font-mono">
                            {chessComRatings.blitz}
                          </span>
                        </div>
                      )}
                      {chessComRatings.rapid > 0 && (
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 uppercase">Rapid</span>
                          <span className="text-base font-bold text-[--color-chess-com] font-mono">
                            {chessComRatings.rapid}
                          </span>
                        </div>
                      )}
                      {chessComRatings.daily > 0 && (
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 uppercase">Daily</span>
                          <span className="text-base font-bold text-[--color-chess-com] font-mono">
                            {chessComRatings.daily}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {hasLichess && (
                    <div className="w-px h-8 bg-[--color-border] dark:bg-[--color-border] light:bg-gray-200" />
                  )}
                </>
              )}

              {/* Lichess Ratings */}
              {hasLichess && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[--color-lichess]">Lichess:</span>
                  <div className="flex gap-2">
                    {lichessRatings.bullet > 0 && (
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 uppercase">Bullet</span>
                        <span className="text-base font-bold text-[--color-lichess] font-mono">
                          {lichessRatings.bullet}
                        </span>
                      </div>
                    )}
                    {lichessRatings.blitz > 0 && (
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 uppercase">Blitz</span>
                        <span className="text-base font-bold text-[--color-lichess] font-mono">
                          {lichessRatings.blitz}
                        </span>
                      </div>
                    )}
                    {lichessRatings.rapid > 0 && (
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 uppercase">Rapid</span>
                        <span className="text-base font-bold text-[--color-lichess] font-mono">
                          {lichessRatings.rapid}
                        </span>
                      </div>
                    )}
                    {lichessRatings.classical > 0 && (
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 uppercase">Classical</span>
                        <span className="text-base font-bold text-[--color-lichess] font-mono">
                          {lichessRatings.classical}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        {/* Left Column - Stats and Accounts */}
        <div className="flex flex-col gap-8">
          {/* Platform Accounts */}
          {accounts.length > 0 && (
            <div className="bg-[--color-secondary-bg] dark:bg-[--color-secondary-bg] light:bg-white border border-[--color-border] dark:border-[--color-border] light:border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 m-0 mb-5">
                Platform Accounts
              </h2>
              <div className="flex flex-col gap-3">
                {accounts.map((account) => (
                  <a
                    key={account.id}
                    href={getPlatformUrl(account)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-[--color-tertiary-bg] dark:bg-[--color-tertiary-bg] light:bg-gray-50 rounded-lg hover:bg-[--color-border] transition-colors no-underline"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold ${account.platform === 'chess-com' ? 'text-[--color-chess-com]' : 'text-[--color-lichess]'}`}>
                        {account.platform === 'chess-com' ? 'Chess.com' : 'Lichess'}
                      </span>
                      <span className="text-[--color-text-secondary]">•</span>
                      <span className="text-[--color-text-primary] font-semibold">
                        {account.username || account.accountId}
                      </span>
                      {account.verified && (
                        <span className="text-xs bg-blue-500/20 text-blue-500 px-2 py-1 rounded">
                          Verified
                        </span>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-[--color-text-secondary]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Career Stats */}
          <div className="bg-[--color-secondary-bg] dark:bg-[--color-secondary-bg] light:bg-white border border-[--color-border] dark:border-[--color-border] light:border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 m-0 mb-5">
              Career Statistics
            </h2>
            {hasAnyStats ? (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-6">
                <div>
                  <div className="text-xs text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 mb-1.5">
                    Tournaments
                  </div>
                  <div className="text-3xl font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 font-mono">
                    {stats.tournamentsPlayed}
                  </div>
                </div>
                {stats.totalGames > 0 && (
                  <>
                    <div>
                      <div className="text-xs text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 mb-1.5">
                        Win Rate
                      </div>
                      <div className="text-3xl font-bold text-emerald-500 font-mono">
                        {stats.winRate.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 mb-1.5">
                        Record
                      </div>
                      <div className="text-lg font-semibold font-mono">
                        <span className="text-emerald-500">{stats.wins}</span>
                        <span className="text-[--color-text-secondary]">-</span>
                        <span className="text-amber-500">{stats.draws}</span>
                        <span className="text-[--color-text-secondary]">-</span>
                        <span className="text-red-500">{stats.losses}</span>
                      </div>
                    </div>
                  </>
                )}
                {stats.averagePlacement && (
                  <div>
                    <div className="text-xs text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 mb-1.5">
                      Avg. Placement
                    </div>
                    <div className="text-3xl font-bold text-blue-500 font-mono">
                      {stats.averagePlacement.toFixed(1)}
                    </div>
                  </div>
                )}
                {stats.bestPerformanceRating && (
                  <div>
                    <div className="text-xs text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 mb-1.5">
                      Best Performance
                    </div>
                    <div className="text-3xl font-bold text-purple-500 font-mono">
                      {stats.bestPerformanceRating}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-[--color-text-secondary]">
                No tournament statistics available yet
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="flex flex-col gap-8">
          {/* Total Winnings */}
          {recentPlacements.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-6 text-white">
              <div className="text-sm opacity-90 mb-2">Total Winnings</div>
              <div className="text-4xl font-bold font-mono">
                ${totalWinnings.toLocaleString()}
              </div>
              <div className="text-xs opacity-80 mt-1">Last {recentPlacements.length} tournaments</div>
            </div>
          )}

          {/* Recent Placements */}
          <div className="bg-[--color-secondary-bg] dark:bg-[--color-secondary-bg] light:bg-white border border-[--color-border] dark:border-[--color-border] light:border-gray-200 rounded-lg overflow-hidden">
            <div className="p-5 border-b border-[--color-border] dark:border-[--color-border] light:border-gray-200">
              <h2 className="text-lg font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 m-0">
                Recent Placements
              </h2>
            </div>
            {recentPlacements.length > 0 ? (
              <div className="flex flex-col">
                {recentPlacements.map((placement, index) => (
                  <Link
                    key={index}
                    href={`/tournaments/${placement.tournamentId}`}
                    className={`py-4 px-5 transition-colors hover:bg-[--color-tertiary-bg] dark:hover:bg-[--color-tertiary-bg] light:hover:bg-gray-50 no-underline cursor-pointer ${
                      index < recentPlacements.length - 1 ? "border-b border-[--color-border] dark:border-[--color-border] light:border-gray-200" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 mb-1 hover:text-blue-500 transition-colors">
                          {placement.tournament}
                        </div>
                        <div className="text-xs text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600">
                          {placement.date}
                        </div>
                      </div>
                      <div className={`text-xl font-bold font-mono ${getPlacementColor(placement.placement)}`}>
                        #{placement.placement}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-emerald-500">
                      ${placement.prize.toLocaleString()}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-[--color-text-secondary]">
                No tournament placements available yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
