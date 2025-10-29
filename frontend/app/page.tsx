/**
 * Homepage
 * Main landing page with hero section, featured tournaments, and all tournaments list
 */

"use client";

import { Card, CardBody } from "@/components/ui/Card";
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

  return (
    <div className="flex flex-col gap-12">
      {/* Featured Tournaments */}
      {featuredTournaments.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 mb-5">
            Featured Tournaments
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
            {featuredTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </section>
      )}

      {/* Main Content - 2 Column Layout */}
      <div className="main-grid grid grid-cols-1 gap-8">
        {/* Left Column - Tournaments */}
        <div className="flex flex-col gap-12">
          {/* Ongoing Tournaments */}
          {ongoingTournaments.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800">
                  Ongoing Tournaments
                </h2>
                <div className="w-2 h-2 rounded-full bg-[--color-accent-primary] animate-pulse" />
              </div>
              <TournamentList tournaments={ongoingTournaments} />
            </section>
          )}

          {/* Upcoming Tournaments */}
          {upcomingTournaments.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 mb-4">
                Upcoming Tournaments
              </h2>
              <TournamentList tournaments={upcomingTournaments} />
            </section>
          )}

          {/* Completed Tournaments */}
          {completedTournaments.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 mb-4">
                Recently Completed
              </h2>
              <TournamentList tournaments={completedTournaments} />
            </section>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="flex flex-col gap-12">
          {/* Forum Discussions */}
          <section>
            <h2 className="text-xl font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 mb-4">
              Top Discussions
            </h2>
            <Card>
              <CardBody>
                <ForumPostsList posts={mockForumPosts} maxItems={5} />
              </CardBody>
            </Card>
          </section>

          {/* Player Rankings with Tabs */}
          <section>
            <h2 className="text-xl font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 mb-4">
              Player Rankings
            </h2>
            <Card>
              <CardBody>
                <TabbedRankings categories={rankingCategories} maxItems={10} />
              </CardBody>
            </Card>
          </section>

          {/* Top Performers */}
          <section>
            <h2 className="text-xl font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 mb-4">
              Top Performers This Month
            </h2>
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
