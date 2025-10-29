/**
 * Homepage
 * Main landing page with hero section, featured tournaments, and all tournaments list
 */

"use client";

import { Card, CardBody } from "@/components/ui/Card";
import { useTheme } from "@/contexts/ThemeContext";
import { TournamentCard } from "@/components/tournament/TournamentCard";
import { TournamentList } from "@/components/tournament/TournamentList";
import { ForumPostsList } from "@/components/forum/ForumPostsList";
import { TabbedRankings } from "@/components/player/TabbedRankings";
import { TopPerformers } from "@/components/player/TopPerformers";
import {
  mockTournaments,
  mockForumPosts,
  mockFideClassicalRankings,
  mockFideRapidRankings,
  mockFideBlitzRankings,
  mockChessComRankings,
  mockLichessRankings,
  mockTopPerformers,
} from "@/lib/mockData";
import { TournamentStatus } from "@/types";

export default function Home() {
  const { isDarkMode } = useTheme();

  // Separate featured tournaments
  const featuredTournaments = mockTournaments.filter((t) => t.featured);

  // Group tournaments by status
  const ongoingTournaments = mockTournaments.filter((t) => t.status === TournamentStatus.ONGOING);
  const upcomingTournaments = mockTournaments.filter((t) => t.status === TournamentStatus.UPCOMING);
  const completedTournaments = mockTournaments.filter((t) => t.status === TournamentStatus.COMPLETED);

  // Prepare ranking categories for tabs
  const rankingCategories = [
    { id: "fide-classical", label: "FIDE Classical", players: mockFideClassicalRankings },
    { id: "fide-rapid", label: "FIDE Rapid", players: mockFideRapidRankings },
    { id: "fide-blitz", label: "FIDE Blitz", players: mockFideBlitzRankings },
    { id: "chesscom", label: "Chess.com", players: mockChessComRankings },
    { id: "lichess", label: "Lichess", players: mockLichessRankings },
  ];

  const headingColor = isDarkMode ? "#e8e8e8" : "#1f2937";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
      {/* Featured Tournaments */}
      {featuredTournaments.length > 0 && (
        <section>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: headingColor, marginBottom: "24px" }}>Featured Tournaments</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
            {featuredTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </section>
      )}

      {/* Main Content - 2 Column Layout */}
      <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px" }}>
        {/* Left Column - Tournaments */}
        <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
          {/* Ongoing Tournaments */}
          {ongoingTournaments.length > 0 && (
            <section>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: headingColor }}>Ongoing Tournaments</h2>
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
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: headingColor, marginBottom: "16px" }}>Upcoming Tournaments</h2>
              <TournamentList tournaments={upcomingTournaments} />
            </section>
          )}

          {/* Completed Tournaments */}
          {completedTournaments.length > 0 && (
            <section>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: headingColor, marginBottom: "16px" }}>Recently Completed</h2>
              <TournamentList tournaments={completedTournaments} />
            </section>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
          {/* Forum Discussions */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: headingColor, marginBottom: "16px" }}>Top Discussions</h2>
            <Card>
              <CardBody>
                <ForumPostsList posts={mockForumPosts} maxItems={5} />
              </CardBody>
            </Card>
          </section>

          {/* Player Rankings with Tabs */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: headingColor, marginBottom: "16px" }}>Player Rankings</h2>
            <Card>
              <CardBody>
                <TabbedRankings categories={rankingCategories} maxItems={10} />
              </CardBody>
            </Card>
          </section>

          {/* Top Performers */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: headingColor, marginBottom: "16px" }}>Top Performers This Month</h2>
            <Card>
              <CardBody>
                <TopPerformers performers={mockTopPerformers} maxItems={5} />
              </CardBody>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
