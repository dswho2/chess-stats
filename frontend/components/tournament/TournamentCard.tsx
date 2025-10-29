/**
 * TournamentCard Component
 * Displays a tournament in card format with platform color bar, thumbnail, and details
 */

"use client";

import Link from "next/link";
import { Tournament, TournamentStatus } from "@/types";
import { formatDateRange, formatCurrency } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

interface TournamentCardProps {
  tournament: Tournament;
  variant?: "default" | "compact";
}

export function TournamentCard({ tournament, variant = "default" }: TournamentCardProps) {
  const { isDarkMode } = useTheme();
  const {
    id,
    name,
    platform,
    startDate,
    endDate,
    prizePool,
    participantCount,
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
        flexDirection: "column",
        background: isDarkMode ? "#1a1f24" : "#ffffff",
        border: isDarkMode ? "1px solid #2d3339" : "1px solid #e5e7eb",
        borderRadius: "8px",
        overflow: "hidden",
        transition: "all 0.2s",
        cursor: "pointer",
        height: "100%",
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
            width: "100%",
            height: "4px",
            background: getPlatformColor(platform),
            flexShrink: 0,
          }}
        />

        {/* Tournament Content */}
        <div
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            flex: 1,
          }}
        >
          {/* Thumbnail/Logo */}
          {thumbnailUrl && (
            <div
              style={{
                width: "100%",
                height: "120px",
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

          {/* Tournament Name */}
          <h3
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: isDarkMode ? "#e8e8e8" : "#1f2937",
              lineHeight: "1.4",
            }}
          >
            {name}
          </h3>

          {/* Tournament Details */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              fontSize: "14px",
              color: isDarkMode ? "#9ca3af" : "#6b7280",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>{formatDateRange(startDate, endDate)}</span>
              <span>•</span>
              <span
                style={{
                  color: tournament.status === TournamentStatus.ONGOING ? "#10b981" :
                         tournament.status === TournamentStatus.UPCOMING ? "#3b82f6" : "#6b7280",
                  fontWeight: 600,
                  textTransform: "capitalize",
                }}
              >
                {tournament.status}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
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
