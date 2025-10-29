"use client";

/**
 * Player Detail Page
 * Shows player profile, stats, recent games, and tournament history
 */

import { use } from "react";
import Link from "next/link";
import { GameCard } from "@/components/tournament/GameCard";
import { getPlayerByName, getPlayerPlacements, mockStandings } from "@/lib/mockData";

interface PlayerPageProps {
  params: Promise<{ name: string }>;
}

export default function PlayerPage({ params }: PlayerPageProps) {
  const { name } = use(params);

  // Get player data from mock data
  const player = getPlayerByName(name);
  const placements = getPlayerPlacements(name);

  // If player not found, show fallback with generated data
  const playerData = player || {
    name: name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    title: "GM",
    country: "US",
    countryName: "United States",
    avatar: null,
    ratings: {
      fide: {
        classical: 2750,
        rapid: 2780,
        blitz: 2850,
      },
      chesscom: {
        bullet: 3050,
        blitz: 3100,
        rapid: 3025,
        daily: 2900,
      },
      lichess: {
        bullet: 2920,
        blitz: 2950,
        rapid: 2890,
        classical: 2810,
      },
    },
    bio: "International chess grandmaster",
    stats: {
      tournamentsPlayed: 100,
      wins: 600,
      draws: 150,
      losses: 120,
      winRate: 65.0,
      averagePlacement: 5.0,
      bestPerformance: 2900,
    },
  };

  const stats = playerData.stats;

  // Generate recent games from standings
  const recentGames = mockStandings.length >= 4 ? [
    {
      id: 1,
      round: 11,
      whitePlayer: playerData.name,
      whiteRating: playerData.ratings.fide.classical,
      blackPlayer: mockStandings[1]?.playerName || "Magnus Carlsen",
      blackRating: mockStandings[1]?.rating || 2910,
      result: "1-0" as const,
    },
    {
      id: 2,
      round: 10,
      whitePlayer: mockStandings[2]?.playerName || "Alireza Firouzja",
      whiteRating: mockStandings[2]?.rating || 2785,
      blackPlayer: playerData.name,
      blackRating: playerData.ratings.fide.classical,
      result: "½-½" as const,
    },
    {
      id: 3,
      round: 9,
      whitePlayer: playerData.name,
      whiteRating: playerData.ratings.fide.classical,
      blackPlayer: mockStandings[3]?.playerName || "Fabiano Caruana",
      blackRating: mockStandings[3]?.rating || 2795,
      result: "1-0" as const,
    },
  ] : [];

  const recentPlacements = placements.length > 0 ? placements : [
    { tournamentId: "titled-tuesday-oct-29", tournament: "Titled Tuesday Late", date: "Oct 29, 2024", placement: 1, prize: 1000 },
    { tournamentId: "speed-chess-championship-2024", tournament: "Speed Chess Championship", date: "Oct 22, 2024", placement: 2, prize: 7500 },
    { tournamentId: "titled-tuesday-oct-29", tournament: "Titled Tuesday Early", date: "Oct 22, 2024", placement: 3, prize: 400 },
    { tournamentId: "pro-chess-league-week-5", tournament: "Champions Tour Finals", date: "Oct 15, 2024", placement: 2, prize: 50000 },
    { tournamentId: "titled-tuesday-oct-29", tournament: "Titled Tuesday Late", date: "Oct 8, 2024", placement: 1, prize: 1000 },
  ];

  const totalWinnings = recentPlacements.reduce((sum, p) => sum + p.prize, 0);

  // Helper function to get flag emoji
  const getFlagEmoji = (countryCode: string): string => {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const getPlacementColor = (placement: number): string => {
    if (placement === 1) return "text-amber-400";
    if (placement === 2) return "text-gray-400";
    if (placement === 3) return "text-orange-600";
    return "text-[--color-text-secondary]";
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Player Header Card */}
      <div className="bg-[--color-secondary-bg] dark:bg-[--color-secondary-bg] light:bg-white border border-[--color-border] dark:border-[--color-border] light:border-gray-200 rounded-lg p-8">
        <div className="flex gap-8 items-start">
          {/* Avatar */}
          <div className="w-[120px] h-[120px] rounded-lg bg-[--color-tertiary-bg] dark:bg-[--color-tertiary-bg] light:bg-gray-100 flex items-center justify-center text-5xl font-bold text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-500 flex-shrink-0">
            {playerData.name.charAt(0)}
          </div>

          {/* Player Info */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Name and Title */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 m-0">
                  {playerData.name}
                </h1>
                <span className="text-base font-bold text-blue-500 bg-blue-500/10 py-1 px-3 rounded">
                  {playerData.title}
                </span>
                <span className="text-3xl">{getFlagEmoji(playerData.country)}</span>
                <span className="text-base text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600">
                  {playerData.countryName}
                </span>
              </div>
              <p className="text-base text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 m-0">
                {playerData.bio}
              </p>
            </div>

            {/* Ratings - Compact inline display */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* FIDE Ratings */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800">
                  FIDE:
                </span>
                <div className="flex gap-2">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 uppercase">Classical</span>
                    <span className="text-base font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 font-mono">
                      {playerData.ratings.fide.classical}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 uppercase">Rapid</span>
                    <span className="text-base font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 font-mono">
                      {playerData.ratings.fide.rapid}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 uppercase">Blitz</span>
                    <span className="text-base font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 font-mono">
                      {playerData.ratings.fide.blitz}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-px h-8 bg-[--color-border] dark:bg-[--color-border] light:bg-gray-200" />

              {/* Chess.com Ratings */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[--color-chess-com]">Chess.com:</span>
                <div className="flex gap-2">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 uppercase">Bullet</span>
                    <span className="text-base font-bold text-[--color-chess-com] font-mono">
                      {playerData.ratings.chesscom.bullet}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 uppercase">Blitz</span>
                    <span className="text-base font-bold text-[--color-chess-com] font-mono">
                      {playerData.ratings.chesscom.blitz}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 uppercase">Rapid</span>
                    <span className="text-base font-bold text-[--color-chess-com] font-mono">
                      {playerData.ratings.chesscom.rapid}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 uppercase">Daily</span>
                    <span className="text-base font-bold text-[--color-chess-com] font-mono">
                      {playerData.ratings.chesscom.daily}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-px h-8 bg-[--color-border] dark:bg-[--color-border] light:bg-gray-200" />

              {/* Lichess Ratings */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[--color-lichess]">Lichess:</span>
                <div className="flex gap-2">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 uppercase">Bullet</span>
                    <span className="text-base font-bold text-[--color-lichess] font-mono">
                      {playerData.ratings.lichess.bullet}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 uppercase">Blitz</span>
                    <span className="text-base font-bold text-[--color-lichess] font-mono">
                      {playerData.ratings.lichess.blitz}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 uppercase">Rapid</span>
                    <span className="text-base font-bold text-[--color-lichess] font-mono">
                      {playerData.ratings.lichess.rapid}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 uppercase">Classical</span>
                    <span className="text-base font-bold text-[--color-lichess] font-mono">
                      {playerData.ratings.lichess.classical}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        {/* Left Column - Stats and Recent Games */}
        <div className="flex flex-col gap-8">
          {/* Career Stats */}
          <div className="bg-[--color-secondary-bg] dark:bg-[--color-secondary-bg] light:bg-white border border-[--color-border] dark:border-[--color-border] light:border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 m-0 mb-5">
              Career Statistics
            </h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-6">
              <div>
                <div className="text-xs text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 mb-1.5">
                  Tournaments
                </div>
                <div className="text-3xl font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 font-mono">
                  {stats.tournamentsPlayed}
                </div>
              </div>
              <div>
                <div className="text-xs text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 mb-1.5">
                  Win Rate
                </div>
                <div className="text-3xl font-bold text-emerald-500 font-mono">
                  {stats.winRate}%
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
              <div>
                <div className="text-xs text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 mb-1.5">
                  Avg. Placement
                </div>
                <div className="text-3xl font-bold text-blue-500 font-mono">
                  {stats.averagePlacement}
                </div>
              </div>
              <div>
                <div className="text-xs text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 mb-1.5">
                  Best Performance
                </div>
                <div className="text-3xl font-bold text-purple-500 font-mono">
                  {stats.bestPerformance}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Games */}
          {recentGames.length > 0 && (
            <div className="bg-[--color-secondary-bg] dark:bg-[--color-secondary-bg] light:bg-white border border-[--color-border] dark:border-[--color-border] light:border-gray-200 rounded-lg overflow-hidden">
              <div className="p-6 border-b border-[--color-border] dark:border-[--color-border] light:border-gray-200">
                <h2 className="text-xl font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 m-0">
                  Recent Games
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                  {recentGames.map((game) => (
                    <GameCard
                      key={game.id}
                      round={game.round}
                      whitePlayer={game.whitePlayer}
                      whiteRating={game.whiteRating}
                      blackPlayer={game.blackPlayer}
                      blackRating={game.blackRating}
                      result={game.result}
                      onClick={() => {
                        console.log(`Viewing game ${game.id}`);
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="flex flex-col gap-8">
          {/* Total Winnings */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-6 text-white">
            <div className="text-sm opacity-90 mb-2">Total Winnings</div>
            <div className="text-4xl font-bold font-mono">
              ${totalWinnings.toLocaleString()}
            </div>
            <div className="text-xs opacity-80 mt-1">Last 5 tournaments</div>
          </div>

          {/* Recent Placements */}
          <div className="bg-[--color-secondary-bg] dark:bg-[--color-secondary-bg] light:bg-white border border-[--color-border] dark:border-[--color-border] light:border-gray-200 rounded-lg overflow-hidden">
            <div className="p-5 border-b border-[--color-border] dark:border-[--color-border] light:border-gray-200">
              <h2 className="text-lg font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 m-0">
                Recent Placements
              </h2>
            </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}
