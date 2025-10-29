/**
 * GameCard Component
 * Displays a single game from a tournament with player names, ratings, and result
 */

"use client";

interface GameCardProps {
  round: string | number;
  whitePlayer: string;
  whiteRating: number | string;
  blackPlayer: string;
  blackRating: number | string;
  result: "1-0" | "0-1" | "½-½" | string;
  onClick?: () => void;
}

export function GameCard({
  round,
  whitePlayer,
  whiteRating,
  blackPlayer,
  blackRating,
  result,
  onClick,
}: GameCardProps) {
  const getResultColor = (result: string): string => {
    if (result === "1-0") return "#10b981"; // Green for white win
    if (result === "0-1") return "#ef4444"; // Red for black win
    if (result === "½-½") return "#f59e0b"; // Amber for draw
    return "#6b7280";
  };

  const renderPlayerName = (playerName: string, rating: number | string) => {
    const playerSlug = playerName.toLowerCase().replace(/\s+/g, '-');
    return (
      <>
        <a
          href={`/players/${playerSlug}`}
          style={{
            fontSize: "15px",
            color: "#e8e8e8",
            fontWeight: 600,
            textDecoration: "none",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = "underline";
            e.currentTarget.style.color = "#3b82f6";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = "none";
            e.currentTarget.style.color = "#e8e8e8";
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {playerName}
        </a>
        <span style={{ fontSize: "13px", color: "#9ca3af" }}>({rating})</span>
      </>
    );
  };

  return (
    <div
      style={{
        background: "#252a2f",
        border: "1px solid #2d3339",
        borderRadius: "6px",
        padding: "20px",
        transition: "all 0.2s",
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.background = "#2d3238";
          e.currentTarget.style.borderColor = "#3b82f6";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.background = "#252a2f";
          e.currentTarget.style.borderColor = "#2d3339";
        }
      }}
    >
      {/* Round and Result */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            color: "#6b7280",
            textTransform: "uppercase",
          }}
        >
          Round {round}
        </span>
        <span
          style={{
            fontSize: "12px",
            color: getResultColor(result),
            fontWeight: 600,
          }}
        >
          {result}
        </span>
      </div>

      {/* Players */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* White Player */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#e8e8e8",
            }}
          ></div>
          {renderPlayerName(whitePlayer, whiteRating)}
        </div>

        {/* Black Player */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#3b3f44",
            }}
          ></div>
          {renderPlayerName(blackPlayer, blackRating)}
        </div>
      </div>

      {/* PGN Placeholder */}
      <div
        style={{
          marginTop: "16px",
          padding: "12px",
          background: "#1a1f24",
          borderRadius: "4px",
          fontSize: "13px",
          color: "#9ca3af",
          fontFamily: "monospace",
        }}
      >
        PGN viewer will be integrated here
      </div>
    </div>
  );
}
