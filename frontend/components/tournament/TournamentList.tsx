/**
 * TournamentList Component
 * Displays tournaments in a vertical list format
 */

"use client";

import Link from "next/link";
import { Tournament } from "@/types";
import { formatDateRange, formatCurrency } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

interface TournamentListProps {
  tournaments: Tournament[];
}

export function TournamentList({ tournaments }: TournamentListProps) {
  if (tournaments.length === 0) {
    return (
      <div className="text-center py-12 text-[#6b7280]">
        No tournaments found
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tournaments.map((tournament) => (
        <TournamentListItem key={tournament.id} tournament={tournament} />
      ))}
    </div>
  );
}

interface TournamentListItemProps {
  tournament: Tournament;
}

function TournamentListItem({ tournament }: TournamentListItemProps) {
  const { isDarkMode } = useTheme();
  const {
    id,
    name,
    platform,
    startDate,
    endDate,
    participantCount,
    prizePool,
    thumbnailUrl,
  } = tournament;

  const getPlatformColor = (platform: string): string => {
    if (platform === "chess-com") return "#7fa650";
    if (platform === "lichess") return "#f59e0b";
    if (platform === "fide") return "#3b82f6";
    return "#6b7280";
  };

  return (
    <Link
      href={`/tournaments/${id}`}
      style={{
        display: "flex",
        alignItems: "stretch",
        background: isDarkMode ? "#1a1f24" : "#ffffff",
        border: isDarkMode ? "1px solid #2d3339" : "1px solid #e5e7eb",
        borderRadius: "8px",
        overflow: "hidden",
        transition: "all 0.2s",
        cursor: "pointer",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isDarkMode ? "#252a2f" : "#f9fafb";
        e.currentTarget.style.borderColor = "#3b82f6";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isDarkMode ? "#1a1f24" : "#ffffff";
        e.currentTarget.style.borderColor = isDarkMode ? "#2d3339" : "#e5e7eb";
      }}
    >
        {/* Platform Color Bar */}
        <div
          style={{
            width: "4px",
            background: getPlatformColor(platform),
            flexShrink: 0,
          }}
        />

        {/* Tournament Info */}
        <div
          style={{
            flex: 1,
            padding: "16px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {/* Thumbnail/Logo */}
          {thumbnailUrl && (
            <div
              style={{
                width: "48px",
                height: "48px",
                flexShrink: 0,
                borderRadius: "6px",
                overflow: "hidden",
                background: "#252a2f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={thumbnailUrl}
                alt={name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: isDarkMode ? "#e8e8e8" : "#1f2937",
                marginBottom: "6px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {name}
            </h3>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                color: isDarkMode ? "#9ca3af" : "#6b7280",
              }}
            >
              <span>{formatDateRange(startDate, endDate)}</span>
              <span>•</span>
              <span>{participantCount}+ players</span>
              {prizePool && (
                <>
                  <span>•</span>
                  <span style={{ color: "#10b981", fontWeight: 600 }}>
                    {formatCurrency(prizePool)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
    </Link>
  );
}
