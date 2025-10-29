/**
 * PlayerRankings Component
 * Displays top-ranked players for homepage
 */

"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

interface RankedPlayer {
  rank: number;
  playerId: string;
  playerName: string;
  title?: string;
  rating: number;
  country?: string;
  ratingChange?: number;
}

interface PlayerRankingsProps {
  players: RankedPlayer[];
  maxItems?: number;
  title?: string;
}

export function PlayerRankings({ players, maxItems = 10, title = "Top Players" }: PlayerRankingsProps) {
  const displayPlayers = players.slice(0, maxItems);

  if (displayPlayers.length === 0) {
    return (
      <div className="text-center py-8 text-[#6b7280]">
        No player data available
      </div>
    );
  }

  return (
    <div>
      {title && (
        <h3 className="text-lg font-semibold text-[#e8e8e8] mb-4">{title}</h3>
      )}
      <div className="space-y-2">
        {displayPlayers.map((player) => (
          <PlayerRankItem key={player.playerId} player={player} />
        ))}
      </div>
    </div>
  );
}

interface PlayerRankItemProps {
  player: RankedPlayer;
}

function PlayerRankItem({ player }: PlayerRankItemProps) {
  const { rank, playerId, playerName, title, rating, ratingChange } = player;

  const getRankColor = (rank: number): string => {
    if (rank === 1) return "#fbbf24"; // Gold
    if (rank === 2) return "#9ca3af"; // Silver
    if (rank === 3) return "#cd7f32"; // Bronze
    return "#6b7280"; // Default
  };

  return (
    <Link href={`/players/${playerId}`}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "10px 12px",
          background: "#1a1f24",
          border: "1px solid #2d3339",
          borderRadius: "6px",
          transition: "all 0.2s",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#252a2f";
          e.currentTarget.style.borderColor = "#3b82f6";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#1a1f24";
          e.currentTarget.style.borderColor = "#2d3339";
        }}
      >
        {/* Rank */}
        <div
          style={{
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            fontWeight: 700,
            color: getRankColor(rank),
            flexShrink: 0,
          }}
        >
          {rank}
        </div>

        {/* Player Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "2px",
            }}
          >
            {title && (
              <Badge variant="default" size="sm">
                {title}
              </Badge>
            )}
            <span
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#e8e8e8",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {playerName}
            </span>
          </div>
        </div>

        {/* Rating */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#e8e8e8",
              fontFamily: "var(--font-geist-mono)",
            }}
          >
            {rating}
          </span>
          {ratingChange !== undefined && ratingChange !== 0 && (
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: ratingChange > 0 ? "#10b981" : "#ef4444",
              }}
            >
              {ratingChange > 0 ? "+" : ""}
              {ratingChange}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
