/**
 * Tournaments Page
 * Browse and filter all tournaments
 */

"use client";

import { Card, CardBody } from "@/components/ui/Card";
import { TournamentCard } from "@/components/tournament/TournamentCard";
import { TournamentList } from "@/components/tournament/TournamentList";
import { mockTournaments } from "@/lib/mockData";
import { TournamentStatus } from "@/types";
import { useState } from "react";

export default function TournamentsPage() {
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

  return (
    <div className="flex flex-col gap-12">
      {/* Page Header and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-start">
        {/* Page Header */}
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 mb-3">
            Tournaments
          </h1>
          <p className="text-base text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600">
            Browse and join chess tournaments from Chess.com, Lichess, and FIDE
          </p>
        </div>

        {/* Filters */}
        <Card className="w-full lg:w-[450px]">
          <CardBody>
            <div className="flex flex-col gap-5 p-2">
              <h3 className="text-base font-semibold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800">
                Filters
              </h3>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-4">
                {/* Status Filter */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800">
                    Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="py-2.5 px-3 rounded-md bg-[--color-secondary-bg] dark:bg-[--color-secondary-bg] light:bg-gray-50 border border-[--color-border] dark:border-[--color-border] light:border-gray-300 text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 text-sm cursor-pointer outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value={TournamentStatus.ONGOING}>Ongoing</option>
                    <option value={TournamentStatus.UPCOMING}>Upcoming</option>
                    <option value={TournamentStatus.COMPLETED}>Completed</option>
                  </select>
                </div>

                {/* Platform Filter */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800">
                    Platform
                  </label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="py-2.5 px-3 rounded-md bg-[--color-secondary-bg] dark:bg-[--color-secondary-bg] light:bg-gray-50 border border-[--color-border] dark:border-[--color-border] light:border-gray-300 text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 text-sm cursor-pointer outline-none"
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
                <div className="p-2.5 rounded-md bg-[--color-secondary-bg] dark:bg-[--color-secondary-bg] light:bg-gray-100 text-[13px] text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 flex flex-col gap-2">
                  <div>
                    Showing {filteredTournaments.length} tournament{filteredTournaments.length !== 1 ? "s" : ""}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedStatus("all");
                      setSelectedPlatform("all");
                    }}
                    className="py-1.5 px-3 rounded border border-[--color-border] dark:border-[--color-border] light:border-gray-300 bg-transparent text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 text-[13px] cursor-pointer transition-all hover:border-blue-500 hover:text-blue-500"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Featured Tournaments */}
      {featuredTournaments.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 mb-6">
            Featured Tournaments
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
            {featuredTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </section>
      )}

      {/* Filtered Results or All Tournaments by Status */}
      {(selectedStatus !== "all" || selectedPlatform !== "all") ? (
        <section>
          <h2 className="text-2xl font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 mb-6">
            Results ({filteredTournaments.length})
          </h2>
          {filteredTournaments.length > 0 ? (
            <TournamentList tournaments={filteredTournaments} />
          ) : (
            <Card>
              <CardBody>
                <div className="text-center py-10 px-5 text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600">
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800">
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
              <h2 className="text-2xl font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 mb-4">
                Upcoming Tournaments
              </h2>
              <TournamentList tournaments={upcomingTournaments} />
            </section>
          )}

          {/* Completed Tournaments */}
          {completedTournaments.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 mb-4">
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
