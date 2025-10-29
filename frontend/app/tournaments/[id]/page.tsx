"use client";

/**
 * Tournament Detail Page
 * Shows tournament info, standings, rounds, and stats
 */

import { use } from "react";
import { DataTable, Column } from "@/components/ui/DataTable";
import { GameCard } from "@/components/tournament/GameCard";
import { getTournamentById, getStandingsForTournament } from "@/lib/mockData";
import { TournamentStanding, TournamentStatus } from "@/types";
import { formatDate, formatCurrency, formatNumber, getPlatformName } from "@/lib/utils";

export default function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const tournament = getTournamentById(id);
  const standings = getStandingsForTournament(id);

  if (!tournament) {
    return (
      <div className="text-center py-20 px-5">
        <h1 className="text-3xl font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 mb-4">
          Tournament Not Found
        </h1>
        <p className="text-base text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 mb-8">
          The tournament you're looking for doesn't exist.
        </p>
        <a
          href="/tournaments"
          className="text-base text-blue-500 underline hover:text-blue-600 transition-colors"
        >
          Browse all tournaments
        </a>
      </div>
    );
  }

  const columns: Column<TournamentStanding>[] = [
    {
      key: "rank",
      label: "#",
      sortable: false,
      align: "center",
      width: "w-16",
      render: (value: number, row: TournamentStanding) => (
        <span
          className={`font-bold font-mono ${
            value === 1
              ? "text-amber-400"
              : value === 2
              ? "text-gray-400"
              : value === 3
              ? "text-orange-600"
              : "text-[--color-text-primary]"
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "playerName",
      label: "Player",
      sortable: true,
      render: (value: string, row: TournamentStanding) => {
        const playerSlug = value.toLowerCase().replace(/\s+/g, '-');
        return (
          <div className="flex items-center gap-2">
            <span className="text-[--color-text-secondary] text-xs font-semibold">{row.playerTitle}</span>
            <a
              href={`/players/${playerSlug}`}
              className="font-medium text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 no-underline hover:underline hover:text-blue-500 transition-all"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {value}
            </a>
            <span className="text-lg">{getFlagEmoji(row.playerCountry || "")}</span>
          </div>
        );
      },
    },
    {
      key: "score",
      label: "Points",
      sortable: true,
      align: "center",
      render: (value: number) => (
        <span className="font-bold font-mono text-emerald-500">{value}</span>
      ),
    },
    {
      key: "rating",
      label: "Rating",
      sortable: true,
      align: "center",
      render: (value: number) => <span className="font-mono">{value}</span>,
    },
    {
      key: "performanceRating",
      label: "Performance",
      sortable: true,
      align: "center",
      render: (value: number | undefined) => (
        <span className="font-mono text-blue-500">{value || "-"}</span>
      ),
    },
    {
      key: "buchholzScore",
      label: "Buchholz",
      sortable: true,
      align: "center",
      render: (value: number | undefined) => (
        <span className="font-mono text-[--color-text-muted] text-sm">{value?.toFixed(1) || "-"}</span>
      ),
    },
    {
      key: "wins",
      label: "W-D-L",
      sortable: false,
      align: "center",
      render: (value: number, row: TournamentStanding) => (
        <span className="font-mono text-sm">
          <span className="text-emerald-500">{row.wins}</span>-
          <span className="text-amber-500">{row.draws}</span>-
          <span className="text-red-500">{row.losses}</span>
        </span>
      ),
    },
  ];

  const getPlatformColor = (platform: string): string => {
    if (platform === "chess-com") return "#7fa650";
    if (platform === "lichess") return "#f59e0b";
    if (platform === "fide") return "#3b82f6";
    return "#6b7280";
  };

  const getStatusColor = (status: string): string => {
    if (status === TournamentStatus.ONGOING) return "#10b981";
    if (status === TournamentStatus.UPCOMING) return "#3b82f6";
    return "#6b7280";
  };

  // Generate notable games from standings data
  // In the future, this will come from the API
  const notableGames = standings.length >= 4 ? [
    {
      id: 1,
      round: tournament.rounds || 11,
      whitePlayer: standings[0]?.playerName || "Player 1",
      whiteRating: standings[0]?.rating || 2800,
      blackPlayer: standings[1]?.playerName || "Player 2",
      blackRating: standings[1]?.rating || 2795,
      result: "1-0" as const,
    },
    {
      id: 2,
      round: (tournament.rounds || 11) - 1,
      whitePlayer: standings[2]?.playerName || "Player 3",
      whiteRating: standings[2]?.rating || 2790,
      blackPlayer: standings[0]?.playerName || "Player 1",
      blackRating: standings[0]?.rating || 2800,
      result: "½-½" as const,
    },
    {
      id: 3,
      round: (tournament.rounds || 11) - 2,
      whitePlayer: standings[1]?.playerName || "Player 2",
      whiteRating: standings[1]?.rating || 2795,
      blackPlayer: standings[3]?.playerName || "Player 4",
      blackRating: standings[3]?.rating || 2785,
      result: "1-0" as const,
    },
  ] : [];

  return (
    <div className="flex flex-col gap-8">
      {/* Tournament Header Card */}
      <div className="bg-[--color-secondary-bg] dark:bg-[--color-secondary-bg] light:bg-white border border-[--color-border] dark:border-[--color-border] light:border-gray-200 rounded-lg overflow-hidden">
        {/* Platform Color Bar */}
        <div
          className="w-full h-1"
          style={{ background: getPlatformColor(tournament.platform) }}
        />

        {/* Tournament Content */}
        <div className="p-8">
          {/* Tournament Name and Status */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h1 className="text-3xl font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 m-0">
                {tournament.name}
              </h1>
              <span
                className="text-sm font-semibold capitalize"
                style={{ color: getStatusColor(tournament.status) }}
              >
                {tournament.status}
              </span>
            </div>
            <p className="text-base text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 m-0">
              {tournament.description}
            </p>
          </div>

          {/* Tournament Info Grid */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-6">
            <div>
              <div className="text-xs text-[--color-text-muted] dark:text-[--color-text-muted] light:text-gray-500 uppercase mb-1.5">
                Platform
              </div>
              <div className="text-base text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 font-medium">
                {getPlatformName(tournament.platform)}
              </div>
            </div>
            <div>
              <div className="text-xs text-[--color-text-muted] dark:text-[--color-text-muted] light:text-gray-500 uppercase mb-1.5">
                Format
              </div>
              <div className="text-base text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 font-medium">
                {tournament.format.charAt(0).toUpperCase() + tournament.format.slice(1)}
              </div>
            </div>
            <div>
              <div className="text-xs text-[--color-text-muted] dark:text-[--color-text-muted] light:text-gray-500 uppercase mb-1.5">
                Time Control
              </div>
              <div className="text-base text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 font-medium">
                {tournament.timeControl.charAt(0).toUpperCase() + tournament.timeControl.slice(1)}
              </div>
            </div>
            <div>
              <div className="text-xs text-[--color-text-muted] dark:text-[--color-text-muted] light:text-gray-500 uppercase mb-1.5">
                Players
              </div>
              <div className="text-base text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 font-medium">
                {formatNumber(tournament.participantCount)}
              </div>
            </div>
            <div>
              <div className="text-xs text-[--color-text-muted] dark:text-[--color-text-muted] light:text-gray-500 uppercase mb-1.5">
                Prize Pool
              </div>
              <div className="text-base text-emerald-500 font-bold">
                {formatCurrency(tournament.prizePool || 0, tournament.prizeCurrency)}
              </div>
            </div>
            {tournament.rounds && (
              <div>
                <div className="text-xs text-[--color-text-muted] dark:text-[--color-text-muted] light:text-gray-500 uppercase mb-1.5">
                  Rounds
                </div>
                <div className="text-base text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 font-medium">
                  {tournament.rounds}
                </div>
              </div>
            )}
            <div>
              <div className="text-xs text-[--color-text-muted] dark:text-[--color-text-muted] light:text-gray-500 uppercase mb-1.5">
                Dates
              </div>
              <div className="text-sm text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 font-medium">
                {formatDate(tournament.startDate, "short")}
              </div>
            </div>
            {tournament.location && (
              <div>
                <div className="text-xs text-[--color-text-muted] dark:text-[--color-text-muted] light:text-gray-500 uppercase mb-1.5">
                  Location
                </div>
                <div className="text-base text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 font-medium">
                  {tournament.location}
                </div>
              </div>
            )}
            {tournament.officialUrl && (
              <div>
                <div className="text-xs text-[--color-text-muted] dark:text-[--color-text-muted] light:text-gray-500 uppercase mb-1.5">
                  Official Site
                </div>
                <a
                  href={tournament.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 underline font-medium hover:text-blue-600"
                >
                  View on {getPlatformName(tournament.platform)}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs/Sections */}
      <div className="border-b border-[--color-border] dark:border-[--color-border] light:border-gray-200 pt-2">
        <nav className="flex gap-6">
          <button className="py-3 px-1 text-sm font-semibold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 border-b-2 border-blue-500 bg-transparent cursor-pointer">
            Standings
          </button>
          <button className="py-3 px-1 text-sm font-medium text-[--color-text-muted] dark:text-[--color-text-muted] light:text-gray-500 bg-transparent border-none cursor-pointer transition-colors hover:text-[--color-text-primary]">
            Matches
          </button>
          <button className="py-3 px-1 text-sm font-medium text-[--color-text-muted] dark:text-[--color-text-muted] light:text-gray-500 bg-transparent border-none cursor-pointer transition-colors hover:text-[--color-text-primary]">
            Stats
          </button>
        </nav>
      </div>

      {/* Standings Table */}
      <div className="bg-[--color-secondary-bg] dark:bg-[--color-secondary-bg] light:bg-white border border-[--color-border] dark:border-[--color-border] light:border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-[--color-border] dark:border-[--color-border] light:border-gray-200">
          <h2 className="text-xl font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 m-0 mb-1.5">
            Final Standings
          </h2>
          <p className="text-sm text-[--color-text-muted] dark:text-[--color-text-muted] light:text-gray-500 m-0">
            Top {standings.length} players • Click column headers to sort
          </p>
        </div>
        <DataTable
          columns={columns}
          data={standings}
          keyExtractor={(row) => row.playerId}
        />
      </div>

      {/* Matches Section - Placeholder for PGN games */}
      {notableGames.length > 0 && (
        <div className="bg-[--color-secondary-bg] dark:bg-[--color-secondary-bg] light:bg-white border border-[--color-border] dark:border-[--color-border] light:border-gray-200 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-[--color-border] dark:border-[--color-border] light:border-gray-200">
            <h2 className="text-xl font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 m-0 mb-1.5">
              Notable Games
            </h2>
            <p className="text-sm text-[--color-text-muted] dark:text-[--color-text-muted] light:text-gray-500 m-0">
              Featured games from this tournament
            </p>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
              {notableGames.map((game) => (
                <GameCard
                  key={game.id}
                  round={game.round}
                  whitePlayer={game.whitePlayer}
                  whiteRating={game.whiteRating}
                  blackPlayer={game.blackPlayer}
                  blackRating={game.blackRating}
                  result={game.result}
                  onClick={() => {
                    // Future: Open game viewer modal or navigate to game detail page
                    console.log(`Viewing game ${game.id}`);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to get flag emoji from country code
function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
