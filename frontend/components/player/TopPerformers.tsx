/**
 * TopPerformers Component
 * Displays top performing players of the month with their achievements
 */

"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

interface TopPerformer {
  playerId: string;
  playerName: string;
  title?: string;
  achievement: string;
  stat: string;
  trend: "up" | "hot" | "new";
}

interface TopPerformersProps {
  performers: TopPerformer[];
  maxItems?: number;
}

export function TopPerformers({ performers, maxItems = 5 }: TopPerformersProps) {
  const displayPerformers = performers.slice(0, maxItems);

  if (displayPerformers.length === 0) {
    return (
      <div className="text-center py-8 text-[#6b7280]">
        No data available
      </div>
    );
  }

  const getTrendIcon = (trend: string) => {
    if (trend === "hot") return "🔥";
    if (trend === "new") return "⭐";
    return "📈";
  };

  const getTrendColor = (trend: string) => {
    if (trend === "hot") return "#ef4444";
    if (trend === "new") return "#fbbf24";
    return "#10b981";
  };

  return (
    <div className="space-y-3">
      {displayPerformers.map((performer) => (
        <Link key={performer.playerId} href={`/players/${performer.playerId}`}>
          <div
            style={{
              padding: "12px",
              background: "#1a1f24",
              border: "1px solid #2d3339",
              borderRadius: "8px",
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {performer.title && (
                  <Badge variant="default" size="sm">
                    {performer.title}
                  </Badge>
                )}
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#e8e8e8",
                  }}
                >
                  {performer.playerName}
                </span>
              </div>
              <span
                style={{
                  fontSize: "18px",
                }}
              >
                {getTrendIcon(performer.trend)}
              </span>
            </div>

            <div
              style={{
                fontSize: "13px",
                color: "#9ca3af",
                marginBottom: "4px",
              }}
            >
              {performer.achievement}
            </div>

            <div
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: getTrendColor(performer.trend),
              }}
            >
              {performer.stat}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
