/**
 * Tournaments Page
 * Browse and filter all tournaments
 */

"use client";

import { Card, CardBody } from "@/components/ui/Card";
import { useTheme } from "@/contexts/ThemeContext";
import { TournamentCard } from "@/components/tournament/TournamentCard";
import { TournamentList } from "@/components/tournament/TournamentList";
import { mockTournaments } from "@/lib/mockData";
import { TournamentStatus } from "@/types";
import { useState } from "react";

export default function TournamentsPage() {
  const { isDarkMode } = useTheme();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");

  // Group tournaments by status
  const featuredTournaments = mockTournaments.filter((t) => t.featured);
  const ongoingTournaments = mockTournaments.filter((t) => t.status === TournamentStatus.ONGOING);
  const upcomingTournaments = mockTournaments.filter((t) => t.status === TournamentStatus.UPCOMING);
  const completedTournaments = mockTournaments.filter((t) => t.status === TournamentStatus.COMPLETED);

  // Filter tournaments based on selections
  const getFilteredTournaments = () => {
    let filtered = mockTournaments;

    if (selectedStatus !== "all") {
      filtered = filtered.filter((t) => t.status === selectedStatus);
    }

    if (selectedPlatform !== "all") {
      filtered = filtered.filter((t) => t.platform === selectedPlatform);
    }

    return filtered;
  };

  const filteredTournaments = getFilteredTournaments();

  const headingColor = isDarkMode ? "#e8e8e8" : "#1f2937";
  const textColor = isDarkMode ? "#9ca3af" : "#6b7280";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: "32px", fontWeight: 700, color: headingColor, marginBottom: "12px" }}>
          Tournaments
        </h1>
        <p style={{ fontSize: "16px", color: textColor }}>
          Browse and join chess tournaments from Chess.com, Lichess, and FIDE
        </p>
      </div>

      {/* Featured Tournaments */}
      {featuredTournaments.length > 0 && (
        <section>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: headingColor, marginBottom: "24px" }}>
            Featured Tournaments
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
            {featuredTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </section>
      )}

      {/* Filters */}
      <section>
        <Card>
          <CardBody>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: headingColor }}>Filters</h3>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                {/* Status Filter */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "14px", fontWeight: 500, color: headingColor }}>
                    Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "6px",
                      background: isDarkMode ? "#1a1f24" : "#f9fafb",
                      border: isDarkMode ? "1px solid #2d3339" : "1px solid #e5e7eb",
                      color: isDarkMode ? "#e8e8e8" : "#1f2937",
                      fontSize: "14px",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    <option value="all">All Statuses</option>
                    <option value={TournamentStatus.ONGOING}>Ongoing</option>
                    <option value={TournamentStatus.UPCOMING}>Upcoming</option>
                    <option value={TournamentStatus.COMPLETED}>Completed</option>
                  </select>
                </div>

                {/* Platform Filter */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "14px", fontWeight: 500, color: headingColor }}>
                    Platform
                  </label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "6px",
                      background: isDarkMode ? "#1a1f24" : "#f9fafb",
                      border: isDarkMode ? "1px solid #2d3339" : "1px solid #e5e7eb",
                      color: isDarkMode ? "#e8e8e8" : "#1f2937",
                      fontSize: "14px",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    <option value="all">All Platforms</option>
                    <option value="chess-com">Chess.com</option>
                    <option value="lichess">Lichess</option>
                    <option value="fide">FIDE</option>
                  </select>
                </div>
              </div>

              {/* Active Filters Summary */}
              {(selectedStatus !== "all" || selectedPlatform !== "all") && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "14px", color: textColor }}>
                    Showing {filteredTournaments.length} tournament{filteredTournaments.length !== 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedStatus("all");
                      setSelectedPlatform("all");
                    }}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "4px",
                      background: "transparent",
                      border: isDarkMode ? "1px solid #2d3339" : "1px solid #e5e7eb",
                      color: textColor,
                      fontSize: "13px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#3b82f6";
                      e.currentTarget.style.color = "#3b82f6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isDarkMode ? "#2d3339" : "#e5e7eb";
                      e.currentTarget.style.color = textColor;
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </section>

      {/* Filtered Results or All Tournaments by Status */}
      {(selectedStatus !== "all" || selectedPlatform !== "all") ? (
        <section>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: headingColor, marginBottom: "24px" }}>
            Results ({filteredTournaments.length})
          </h2>
          {filteredTournaments.length > 0 ? (
            <TournamentList tournaments={filteredTournaments} />
          ) : (
            <Card>
              <CardBody>
                <div style={{ textAlign: "center", padding: "40px 20px", color: textColor }}>
                  No tournaments match your filters. Try adjusting your selection.
                </div>
              </CardBody>
            </Card>
          )}
        </section>
      ) : (
        <>
          {/* Ongoing Tournaments */}
          {ongoingTournaments.length > 0 && (
            <section>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "24px", fontWeight: 700, color: headingColor }}>Ongoing Tournaments</h2>
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#10b981",
                    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                  }}
                />
              </div>
              <TournamentList tournaments={ongoingTournaments} />
            </section>
          )}

          {/* Upcoming Tournaments */}
          {upcomingTournaments.length > 0 && (
            <section>
              <h2 style={{ fontSize: "24px", fontWeight: 700, color: headingColor, marginBottom: "16px" }}>
                Upcoming Tournaments
              </h2>
              <TournamentList tournaments={upcomingTournaments} />
            </section>
          )}

          {/* Completed Tournaments */}
          {completedTournaments.length > 0 && (
            <section>
              <h2 style={{ fontSize: "24px", fontWeight: 700, color: headingColor, marginBottom: "16px" }}>
                Recently Completed
              </h2>
              <TournamentList tournaments={completedTournaments} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
