/**
 * TabbedRankings Component
 * Displays player rankings with tabs for different rating types
 */

"use client";

import { useState } from "react";
import { PlayerRankings } from "./PlayerRankings";

interface RankedPlayer {
  rank: number;
  playerId: string;
  playerName: string;
  title?: string;
  rating: number;
  country?: string;
  ratingChange?: number;
}

interface RankingCategory {
  id: string;
  label: string;
  players: RankedPlayer[];
}

interface TabbedRankingsProps {
  categories: RankingCategory[];
  maxItems?: number;
}

export function TabbedRankings({ categories, maxItems = 10 }: TabbedRankingsProps) {
  const [activeTab, setActiveTab] = useState(categories[0]?.id || "");

  const activeCategory = categories.find((cat) => cat.id === activeTab);

  return (
    <div>
      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #2d3339",
          marginBottom: "16px",
          gap: "4px",
        }}
      >
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveTab(category.id)}
            style={{
              padding: "10px 16px",
              fontSize: "13px",
              fontWeight: 600,
              color: activeTab === category.id ? "#e8e8e8" : "#6b7280",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === category.id ? "2px solid #3b82f6" : "2px solid transparent",
              cursor: "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== category.id) {
                e.currentTarget.style.color = "#9ca3af";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== category.id) {
                e.currentTarget.style.color = "#6b7280";
              }
            }}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      {activeCategory && (
        <PlayerRankings
          players={activeCategory.players}
          maxItems={maxItems}
          title=""
        />
      )}
    </div>
  );
}
