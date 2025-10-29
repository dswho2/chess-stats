"use client";

/**
 * Tournament Detail Page
 * Shows tournament info, standings, rounds, and stats
 */

import { use } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { getTournamentById, getStandingsForTournament } from "@/lib/mockData";
import { TournamentStanding } from "@/types";
import { formatDate, formatCurrency, formatNumber, getPlatformName } from "@/lib/utils";

export default function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const tournament = getTournamentById(id);
  const standings = getStandingsForTournament(id);

  if (!tournament) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-[#e8e8e8] mb-4">Tournament Not Found</h1>
        <p className="text-[#9ca3af] mb-6">The tournament you're looking for doesn't exist.</p>
        <Link
          href="/"
          className="text-[#3b82f6] hover:text-[#2563eb] underline"
        >
          Go back home
        </Link>
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
              ? "text-[#fbbf24]"
              : value === 2
              ? "text-[#9ca3af]"
              : value === 3
              ? "text-[#d97706]"
              : "text-[#e8e8e8]"
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
      render: (value: string, row: TournamentStanding) => (
        <div className="flex items-center gap-2">
          <span className="text-[#9ca3af] text-xs font-semibold">{row.playerTitle}</span>
          <span className="font-medium">{value}</span>
          <span className="text-lg">{getFlagEmoji(row.playerCountry || "")}</span>
        </div>
      ),
    },
    {
      key: "score",
      label: "Points",
      sortable: true,
      align: "center",
      render: (value: number) => (
        <span className="font-bold font-mono text-[#10b981]">{value}</span>
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
        <span className="font-mono text-[#3b82f6]">{value || "-"}</span>
      ),
    },
    {
      key: "buchholzScore",
      label: "Buchholz",
      sortable: true,
      align: "center",
      render: (value: number | undefined) => (
        <span className="font-mono text-[#6b7280] text-sm">{value?.toFixed(1) || "-"}</span>
      ),
    },
    {
      key: "wins",
      label: "W-D-L",
      sortable: false,
      align: "center",
      render: (value: number, row: TournamentStanding) => (
        <span className="font-mono text-sm">
          <span className="text-[#10b981]">{row.wins}</span>-
          <span className="text-[#f59e0b]">{row.draws}</span>-
          <span className="text-[#ef4444]">{row.losses}</span>
        </span>
      ),
    },
  ];

  const platformVariant = tournament.platform as any;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-[#6b7280]">
        <Link href="/" className="hover:text-[#e8e8e8]">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/tournaments" className="hover:text-[#e8e8e8]">
          Tournaments
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[#e8e8e8]">{tournament.name}</span>
      </nav>

      {/* Tournament Header */}
      <div className="bg-[#1a1f24] border border-[#2d3339] rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl font-bold text-[#e8e8e8]">{tournament.name}</h1>
              <Badge variant={platformVariant}>{getPlatformName(tournament.platform)}</Badge>
            </div>
            <p className="text-[#9ca3af] mb-4">{tournament.description}</p>
          </div>
          <Badge
            variant={tournament.status}
            size="md"
          >
            {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
          </Badge>
        </div>

        {/* Tournament Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-[#6b7280] uppercase mb-1">Format</div>
            <div className="text-[#e8e8e8] font-medium">
              {tournament.format.charAt(0).toUpperCase() + tournament.format.slice(1)}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#6b7280] uppercase mb-1">Time Control</div>
            <div className="text-[#e8e8e8] font-medium">
              {tournament.timeControl.charAt(0).toUpperCase() + tournament.timeControl.slice(1)}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#6b7280] uppercase mb-1">Players</div>
            <div className="text-[#e8e8e8] font-medium">
              {formatNumber(tournament.participantCount)}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#6b7280] uppercase mb-1">Prize Pool</div>
            <div className="text-[#10b981] font-bold">
              {formatCurrency(tournament.prizePool || 0, tournament.prizeCurrency)}
            </div>
          </div>
          {tournament.rounds && (
            <div>
              <div className="text-xs text-[#6b7280] uppercase mb-1">Rounds</div>
              <div className="text-[#e8e8e8] font-medium">{tournament.rounds}</div>
            </div>
          )}
          <div>
            <div className="text-xs text-[#6b7280] uppercase mb-1">Dates</div>
            <div className="text-[#e8e8e8] font-medium text-sm">
              {formatDate(tournament.startDate, "short")}
            </div>
          </div>
          {tournament.location && (
            <div>
              <div className="text-xs text-[#6b7280] uppercase mb-1">Location</div>
              <div className="text-[#e8e8e8] font-medium">{tournament.location}</div>
            </div>
          )}
          {tournament.officialUrl && (
            <div>
              <div className="text-xs text-[#6b7280] uppercase mb-1">Official Site</div>
              <a
                href={tournament.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3b82f6] hover:text-[#2563eb] underline text-sm"
              >
                View on {getPlatformName(tournament.platform)}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Tabs/Sections */}
      <div className="border-b border-[#2d3339]">
        <nav className="flex gap-6">
          <button className="px-1 py-3 text-sm font-medium text-[#e8e8e8] border-b-2 border-[#3b82f6]">
            Standings
          </button>
          <button className="px-1 py-3 text-sm font-medium text-[#6b7280] hover:text-[#e8e8e8]">
            Rounds
          </button>
          <button className="px-1 py-3 text-sm font-medium text-[#6b7280] hover:text-[#e8e8e8]">
            Stats
          </button>
        </nav>
      </div>

      {/* Standings Table */}
      <div className="bg-[#1a1f24] border border-[#2d3339] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#2d3339]">
          <h2 className="text-xl font-bold text-[#e8e8e8]">Final Standings</h2>
          <p className="text-sm text-[#6b7280] mt-1">
            Top {standings.length} players • Click column headers to sort
          </p>
        </div>
        <DataTable
          columns={columns}
          data={standings}
          keyExtractor={(row) => row.playerId}
        />
      </div>

      {/* Prize Distribution (if applicable) */}
      {tournament.prizePool && (
        <div className="bg-[#1a1f24] border border-[#2d3339] rounded-lg p-6">
          <h2 className="text-xl font-bold text-[#e8e8e8] mb-4">Prize Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl mb-1">🥇</div>
              <div className="text-xs text-[#6b7280] mb-1">1st Place</div>
              <div className="text-[#10b981] font-bold">
                ${((tournament.prizePool * 0.3)).toFixed(0)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🥈</div>
              <div className="text-xs text-[#6b7280] mb-1">2nd Place</div>
              <div className="text-[#10b981] font-bold">
                ${((tournament.prizePool * 0.2)).toFixed(0)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🥉</div>
              <div className="text-xs text-[#6b7280] mb-1">3rd Place</div>
              <div className="text-[#10b981] font-bold">
                ${((tournament.prizePool * 0.15)).toFixed(0)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">4️⃣</div>
              <div className="text-xs text-[#6b7280] mb-1">4th Place</div>
              <div className="text-[#10b981] font-bold">
                ${((tournament.prizePool * 0.1)).toFixed(0)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">5️⃣</div>
              <div className="text-xs text-[#6b7280] mb-1">5th Place</div>
              <div className="text-[#10b981] font-bold">
                ${((tournament.prizePool * 0.08)).toFixed(0)}
              </div>
            </div>
          </div>
          <p className="text-xs text-[#6b7280] mt-4 text-center">
            * Prize distribution is approximate and based on tournament regulations
          </p>
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
