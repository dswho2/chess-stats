/**
 * Rankings Page
 * Display player rankings across different time formats and platforms
 * NOW USING REAL API DATA!
 */

"use client";

import { Card, CardBody } from "@/components/ui/Card";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { useRankings, type RankingType } from "@/lib/hooks/useRankings";
import { getCountryFlag } from "@/lib/api/mappers";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

type RankingCategory = RankingType;

type TitleFilter = "all" | "GM" | "IM" | "FM" | "WGM" | "WIM" | "WFM";

const PLAYERS_PER_PAGE = 20;

export default function RankingsPage() {
  const [selectedCategory, setSelectedCategory] = useState<RankingCategory>("fide-classical");
  const [selectedTitle, setSelectedTitle] = useState<TitleFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch data from backend API using the new hook
  const { data: rankingsData, loading: isLoading, error } = useRankings(selectedCategory, 100);

  const categories = [
    // FIDE (Fully supported!)
    { id: "fide-classical" as RankingCategory, label: "Classical", platform: "FIDE", color: "#3b82f6" },
    { id: "fide-rapid" as RankingCategory, label: "Rapid", platform: "FIDE", color: "#8b5cf6" },
    { id: "fide-blitz" as RankingCategory, label: "Blitz", platform: "FIDE", color: "#ec4899" },
    // Chess.com (Fully supported!)
    { id: "chess-com-bullet" as RankingCategory, label: "Bullet", platform: "Chess.com", color: "#10b981" },
    { id: "chess-com-blitz" as RankingCategory, label: "Blitz", platform: "Chess.com", color: "#10b981" },
    { id: "chess-com-rapid" as RankingCategory, label: "Rapid", platform: "Chess.com", color: "#10b981" },
    { id: "chess-com-daily" as RankingCategory, label: "Daily", platform: "Chess.com", color: "#10b981" },
    // Lichess (Fully supported!)
    { id: "lichess-bullet" as RankingCategory, label: "Bullet", platform: "Lichess", color: "#f59e0b" },
    { id: "lichess-blitz" as RankingCategory, label: "Blitz", platform: "Lichess", color: "#f59e0b" },
    { id: "lichess-rapid" as RankingCategory, label: "Rapid", platform: "Lichess", color: "#f59e0b" },
    { id: "lichess-classical" as RankingCategory, label: "Classical", platform: "Lichess", color: "#f59e0b" },
  ];

  const titleFilters: TitleFilter[] = ["all", "GM", "IM", "FM", "WGM", "WIM", "WFM"];

  // Map backend data to display format with rank
  const allRankings = useMemo(() => {
    return rankingsData.map((player, index) => ({
      rank: index + 1,
      playerId: player.account_id,
      playerName: player.display_name,
      profileUrl: player.profile_url,
      title: player.title || "—",
      rating: player.rating,
      country: player.country_iso || "XX",
      ratingChange: 0, // Backend doesn't provide this yet
      isVerified: player.is_verified_player
    }));
  }, [rankingsData]);

  // Filter by title
  const filteredRankings = useMemo(() => {
    if (selectedTitle === "all") {
      return allRankings;
    }
    return allRankings.filter((player) => player.title === selectedTitle);
  }, [allRankings, selectedTitle]);

  // Pagination
  const totalPages = Math.ceil(filteredRankings.length / PLAYERS_PER_PAGE);
  const startIndex = (currentPage - 1) * PLAYERS_PER_PAGE;
  const endIndex = startIndex + PLAYERS_PER_PAGE;
  const paginatedRankings = filteredRankings.slice(startIndex, endIndex);

  const selectedCategoryData = categories.find((cat) => cat.id === selectedCategory);

  // Group categories by platform
  const fideCategories = categories.filter((cat) => cat.platform === "FIDE");
  const chesscomCategories = categories.filter((cat) => cat.platform === "Chess.com");
  const lichessCategories = categories.filter((cat) => cat.platform === "Lichess");

  const getRatingChangeColor = (change: number) => {
    if (change > 0) return "text-[#10b981]"; // Green
    if (change < 0) return "text-[#ef4444]"; // Red
    return "text-[#6b7280]"; // Gray
  };

  const getRatingChangeSymbol = (change: number) => {
    if (change > 0) return `+${change}`;
    if (change < 0) return change.toString();
    return "—";
  };

  const handleCategoryChange = (category: RankingCategory) => {
    // Check if category is disabled (Chess.com not supported yet)
    const cat = categories.find(c => c.id === category);
    if (cat?.disabled) return;

    setSelectedCategory(category);
    setCurrentPage(1); // Reset to page 1 when changing category
  };

  const handleTitleFilterChange = (title: TitleFilter) => {
    setSelectedTitle(title);
    setCurrentPage(1); // Reset to page 1 when changing filter
  };

  const Pagination = () => {
    const pageNumbers = [];
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pageNumbers.push(i);
        pageNumbers.push(-1); // Ellipsis
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pageNumbers.push(1);
        pageNumbers.push(-1); // Ellipsis
        for (let i = totalPages - 4; i <= totalPages; i++) pageNumbers.push(i);
      } else {
        pageNumbers.push(1);
        pageNumbers.push(-1); // Ellipsis
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pageNumbers.push(i);
        pageNumbers.push(-2); // Ellipsis
        pageNumbers.push(totalPages);
      }
    }

    return (
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="py-2 px-3 rounded-md bg-[--color-secondary-bg] text-[--color-text-primary] text-sm font-medium transition-colors hover:bg-[--color-tertiary-bg] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ←
        </button>

        {pageNumbers.map((pageNum, index) => {
          if (pageNum < 0) {
            return (
              <span key={`ellipsis-${index}`} className="px-2 text-[--color-text-muted]">
                ...
              </span>
            );
          }

          return (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                currentPage === pageNum
                  ? "bg-blue-500 text-white"
                  : "bg-[--color-secondary-bg] text-[--color-text-primary] hover:bg-[--color-tertiary-bg]"
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="py-2 px-3 rounded-md bg-[--color-secondary-bg] text-[--color-text-primary] text-sm font-medium transition-colors hover:bg-[--color-tertiary-bg] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          →
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-[--color-text-primary]">Player Rankings</h1>
        <p className="text-base text-[--color-text-secondary]">
          View the top players across different time formats and platforms
        </p>
      </div>

      {/* Category Selection - 3 Column Grid */}
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* FIDE Column */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-[--color-text-primary] px-1">FIDE</h3>
            <div className="flex flex-wrap gap-2">
              {fideCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  disabled={category.disabled}
                  className={`py-2 px-4 rounded-md font-semibold text-sm transition-all ${
                    selectedCategory === category.id
                      ? "text-white shadow-md"
                      : category.disabled
                      ? "bg-[--color-secondary-bg] text-[--color-text-muted] opacity-50 cursor-not-allowed"
                      : "bg-[--color-secondary-bg] text-[--color-text-secondary] hover:bg-[--color-tertiary-bg]"
                  }`}
                  style={{
                    backgroundColor: selectedCategory === category.id && !category.disabled ? category.color : undefined,
                  }}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chess.com Column */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-[--color-text-primary] px-1">Chess.com</h3>
            <div className="flex flex-wrap gap-2">
              {chesscomCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  disabled={category.disabled}
                  className={`py-2 px-4 rounded-md font-semibold text-sm transition-all ${
                    selectedCategory === category.id
                      ? "text-white shadow-md"
                      : category.disabled
                      ? "bg-[--color-secondary-bg] text-[--color-text-muted] opacity-50 cursor-not-allowed"
                      : "bg-[--color-secondary-bg] text-[--color-text-secondary] hover:bg-[--color-tertiary-bg]"
                  }`}
                  style={{
                    backgroundColor: selectedCategory === category.id && !category.disabled ? category.color : undefined,
                  }}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lichess Column */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-[--color-text-primary] px-1">Lichess</h3>
            <div className="flex flex-wrap gap-2">
              {lichessCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`py-2 px-4 rounded-md font-semibold text-sm transition-all ${
                    selectedCategory === category.id
                      ? "text-white shadow-md"
                      : "bg-[--color-secondary-bg] text-[--color-text-secondary] hover:bg-[--color-tertiary-bg]"
                  }`}
                  style={{
                    backgroundColor: selectedCategory === category.id ? category.color : undefined,
                  }}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Title Filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[--color-text-secondary]">Filter by Title:</span>
          <div className="flex flex-wrap gap-2">
            {titleFilters.map((title) => (
              <button
                key={title}
                onClick={() => handleTitleFilterChange(title)}
                className={`py-1.5 px-3 rounded-md text-xs font-bold transition-all ${
                  selectedTitle === title
                    ? "bg-blue-500 text-white"
                    : "bg-[--color-secondary-bg] text-[--color-text-secondary] hover:bg-[--color-tertiary-bg]"
                }`}
              >
                {title === "all" ? "All" : title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pagination Top */}
      {totalPages > 1 && <Pagination />}

      {/* Loading State */}
      {isLoading && <LoadingSpinner message="Loading rankings from API..." />}

      {/* Error State */}
      {error && !isLoading && (
        <ErrorMessage error={new Error(error)} onRetry={() => window.location.reload()} />
      )}

      {/* Rankings Table */}
      {!isLoading && !error && (
        <Card>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead>
                <tr className="border-b border-[--color-border]">
                  <th className="text-left py-2 px-3 text-sm font-semibold text-[--color-text-primary]">
                    Rank
                  </th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-[--color-text-primary]">
                    Player
                  </th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-[--color-text-primary]">
                    Title
                  </th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-[--color-text-primary]">
                    Rating
                  </th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-[--color-text-primary]">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRankings.map((player, index) => {
                  const absoluteIndex = startIndex + index;
                  return (
                    <tr
                      key={player.playerId}
                      className={`border-b border-[--color-border] hover:bg-[--color-tertiary-bg] transition-colors ${
                        absoluteIndex < 3 ? "bg-[--color-secondary-bg]" : ""
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-base font-bold ${
                              player.rank === 1
                                ? "text-[#f59e0b]" // Gold
                                : player.rank === 2
                                ? "text-[#94a3b8]" // Silver
                                : player.rank === 3
                                ? "text-[#c2410c]" // Bronze
                                : "text-[--color-text-primary]"
                            }`}
                          >
                            {player.rank}
                          </span>
                          {player.rank <= 3 && (
                            <span className="text-base">
                              {player.rank === 1 ? "🥇" : player.rank === 2 ? "🥈" : "🥉"}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Player Name */}
                      <td className="py-2 px-3">
                        <Link href={`/players/${player.profileUrl}`}>
                          <div className="flex items-center gap-2 text-[--color-text-primary] font-medium hover:text-blue-500 transition-colors cursor-pointer">
                            <span className="text-base">{getCountryFlag(player.country)}</span>
                            <span>{player.playerName}</span>
                          </div>
                        </Link>
                      </td>

                      {/* Title */}
                      <td className="py-2 px-3">
                        <span className="inline-block py-0.5 px-2 rounded text-xs font-bold bg-[--color-tertiary-bg] text-[--color-text-primary]">
                          {player.title}
                        </span>
                      </td>

                      {/* Rating */}
                      <td className="py-2 px-3">
                        <span
                          className="text-base font-bold"
                          style={{
                            color: selectedCategoryData?.color,
                          }}
                        >
                          {player.rating}
                        </span>
                      </td>

                      {/* Rating Change */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1">
                          {player.ratingChange > 0 && (
                            <svg
                              className="w-4 h-4 text-[#10b981]"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                          {player.ratingChange < 0 && (
                            <svg
                              className="w-4 h-4 text-[#ef4444]"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                          <span
                            className={`text-sm font-semibold ${getRatingChangeColor(
                              player.ratingChange
                            )}`}
                          >
                            {getRatingChangeSymbol(player.ratingChange)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
      )}

      {/* Pagination Bottom */}
      {!isLoading && !error && totalPages > 1 && <Pagination />}

      {/* Info Box */}
      <Card>
        <CardBody>
          <div className="p-3">
            <h3 className="text-base font-semibold text-[--color-text-primary] mb-2">
              About Rankings
            </h3>
            <p className="text-sm text-[--color-text-secondary] leading-relaxed">
              Rankings are fetched in real-time from official APIs. FIDE ratings are official
              ratings from the World Chess Federation. Lichess ratings are live platform ratings.
              Chess.com integration coming soon! Data is cached for 30 minutes to 1 hour for optimal performance.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
