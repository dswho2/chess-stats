/**
 * Forum Page
 * Browse and filter chess discussions and forum posts
 */

"use client";

import { Card, CardBody } from "@/components/ui/Card";
import Link from "next/link";
import { mockForumPosts } from "@/lib/mockData";
import { useState, useEffect } from "react";

interface ForumPost {
  id: string;
  title: string;
  author: string;
  replies: number;
  views: number;
  lastActivity: string;
  category?: string;
  upvotes?: number;
}

export default function ForumPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("activity");

  // Get unique categories from posts
  const categories = Array.from(new Set(mockForumPosts.map((post) => post.category).filter(Boolean)));

  const getCategoryColor = (category?: string): string => {
    if (category === "Tournaments") return "#5b8ac6";
    if (category === "Strategy") return "#4a9d7d";
    if (category === "Players") return "#d88e3b";
    if (category === "Learning") return "#8b7ba8";
    return "#6b7280";
  };

  // Filter and sort posts
  const getFilteredAndSortedPosts = () => {
    let filtered = [...mockForumPosts];

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((post) => post.category === selectedCategory);
    }

    // Sort
    if (sortBy === "replies") {
      filtered.sort((a, b) => b.replies - a.replies);
    } else if (sortBy === "views") {
      filtered.sort((a, b) => b.views - a.views);
    }
    // Default is by activity (already sorted in mock data)

    return filtered;
  };

  const displayPosts = getFilteredAndSortedPosts();

  return (
    <div className="flex flex-col gap-12">
      {/* Page Header and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-start">
        {/* Page Header */}
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 mb-3">
            Chess Forum
          </h1>
          <p className="text-base text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600">
            Join the discussion about tournaments, strategies, players, and more
          </p>
        </div>

        {/* Filters and Sorting */}
        <Card className="w-full lg:w-[500px]">
          <CardBody>
            <div className="flex flex-col gap-5 p-2">
              {/* Sort By */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="py-2.5 px-3 rounded-md bg-[--color-secondary-bg] dark:bg-[--color-secondary-bg] light:bg-gray-50 border border-[--color-border] dark:border-[--color-border] light:border-gray-300 text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 text-sm cursor-pointer outline-none"
                >
                  <option value="activity">Recent Activity</option>
                  <option value="replies">Most Replies</option>
                  <option value="views">Most Views</option>
                </select>
              </div>

              {/* Category Badges */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800">
                  Browse by Category
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`py-2 px-4 rounded-full text-sm font-semibold cursor-pointer transition-all ${
                      selectedCategory === "all"
                        ? "bg-blue-500 border-2 border-blue-500 text-white"
                        : "bg-transparent border-2 border-[--color-border] dark:border-[--color-border] light:border-gray-300 text-[--color-text-secondary] hover:border-blue-500 hover:text-blue-500"
                    }`}
                  >
                    All
                  </button>
                  {categories.map((category) => {
                    const categoryPosts = mockForumPosts.filter((post) => post.category === category);
                    const isSelected = selectedCategory === category;
                    const categoryColor = getCategoryColor(category);

                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`py-2 px-4 rounded-full text-sm font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? "text-white"
                            : "bg-transparent text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600"
                        }`}
                        style={{
                          background: isSelected ? categoryColor : "transparent",
                          borderWidth: "2px",
                          borderStyle: "solid",
                          borderColor: isSelected ? categoryColor : "var(--color-border)",
                        }}
                      >
                        <span>{category}</span>
                        <span
                          className={`text-xs rounded-xl py-0.5 px-1.5 ${
                            isSelected
                              ? "bg-white/20"
                              : "bg-[--color-secondary-bg] dark:bg-[--color-secondary-bg] light:bg-gray-100"
                          }`}
                          style={{ opacity: 0.8 }}
                        >
                          {categoryPosts.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Filters Summary */}
              {selectedCategory !== "all" && (
                <div className="p-3 rounded-md bg-[--color-secondary-bg] dark:bg-[--color-secondary-bg] light:bg-gray-100 text-sm text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600">
                  Showing {displayPosts.length} discussion{displayPosts.length !== 1 ? "s" : ""} in{" "}
                  <strong className="text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800">
                    {selectedCategory}
                  </strong>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Forum Posts List */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800">
            Discussions ({displayPosts.length})
          </h2>
          <button className="py-2.5 px-5 rounded-md bg-blue-500 border-none text-white text-sm font-semibold cursor-pointer transition-all hover:bg-blue-600 hover:-translate-y-px">
            New Discussion
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {displayPosts.length > 0 ? (
            displayPosts.map((post) => <ForumPostCard key={post.id} post={post} getCategoryColor={getCategoryColor} />)
          ) : (
            <Card>
              <CardBody>
                <div className="text-center py-10 px-5 text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600">
                  No discussions found in this category.
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}

// Forum Post Card Component
function ForumPostCard({
  post,
  getCategoryColor,
}: {
  post: ForumPost;
  getCategoryColor: (category?: string) => string;
}) {
  const [votes, setVotes] = useState(post.upvotes || 50);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);

  // Initialize votes with random value on client side only
  useEffect(() => {
    if (!post.upvotes) {
      setVotes(Math.floor(Math.random() * 100) + 10);
    }
  }, [post.upvotes]);

  const handleVote = (type: "up" | "down", e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (userVote === type) {
      // Remove vote
      setVotes(votes + (type === "up" ? -1 : 1));
      setUserVote(null);
    } else if (userVote === null) {
      // Add vote
      setVotes(votes + (type === "up" ? 1 : -1));
      setUserVote(type);
    } else {
      // Change vote
      setVotes(votes + (type === "up" ? 2 : -2));
      setUserVote(type);
    }
  };

  return (
    <Link
      href={`/forum/${post.id}`}
      className="flex gap-3 py-3 px-4 bg-[--color-secondary-bg] dark:bg-[--color-secondary-bg] light:bg-white border border-[--color-border] dark:border-[--color-border] light:border-gray-200 rounded-md transition-all cursor-pointer no-underline hover:bg-[--color-tertiary-bg] dark:hover:bg-[--color-tertiary-bg] light:hover:bg-gray-50 hover:border-blue-500"
    >
      {/* Voting Section */}
      <div className="flex flex-col items-center gap-0 min-w-[32px]">
        {/* Upvote */}
        <button
          onClick={(e) => handleVote("up", e)}
          className={`bg-transparent border-none cursor-pointer p-0.5 flex items-center justify-center transition-all ${
            userVote === "up"
              ? "text-amber-500"
              : "text-[--color-text-muted] dark:text-[--color-text-muted] light:text-gray-400 hover:text-[--color-text-secondary]"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4l8 8h-6v8h-4v-8H4z" />
          </svg>
        </button>

        {/* Vote Count */}
        <span
          className={`text-[13px] font-bold leading-none ${
            userVote === "up"
              ? "text-amber-500"
              : userVote === "down"
              ? "text-blue-500"
              : "text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800"
          }`}
        >
          {votes}
        </span>

        {/* Downvote */}
        <button
          onClick={(e) => handleVote("down", e)}
          className={`bg-transparent border-none cursor-pointer p-0.5 flex items-center justify-center transition-all ${
            userVote === "down"
              ? "text-blue-500"
              : "text-[--color-text-muted] dark:text-[--color-text-muted] light:text-gray-400 hover:text-[--color-text-secondary]"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 20l-8-8h6V4h4v8h6z" />
          </svg>
        </button>
      </div>

      {/* Post Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        {/* Title */}
        <h3 className="text-[15px] font-semibold text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800 leading-tight">
          {post.title}
        </h3>

        {/* Category Badge and Author/Time in same row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Badge */}
          {post.category && (
            <span
              className="py-0.5 px-2 rounded text-[11px] font-semibold text-white"
              style={{ background: getCategoryColor(post.category) }}
            >
              {post.category}
            </span>
          )}

          {/* Author and Time */}
          <div className="flex items-center gap-1.5 text-xs text-[--color-text-muted] dark:text-[--color-text-muted] light:text-gray-500">
            <span>by </span>
            <span
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/players/${post.author.toLowerCase().replace(/\s+/g, "-")}`;
              }}
              className="text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600 no-underline transition-all cursor-pointer hover:underline hover:text-[--color-text-primary]"
            >
              {post.author}
            </span>
            <span>•</span>
            <span>{post.lastActivity}</span>
          </div>
        </div>
      </div>

      {/* Stats (replies and views) */}
      <div className="hidden md:flex items-center gap-4 flex-shrink-0 text-xs text-[--color-text-secondary] dark:text-[--color-text-secondary] light:text-gray-600">
        <div className="text-center min-w-[50px]">
          <div className="font-bold text-base text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800">
            {post.replies}
          </div>
          <div className="text-[11px]">replies</div>
        </div>
        <div className="text-center min-w-[50px]">
          <div className="font-bold text-base text-[--color-text-primary] dark:text-[--color-text-primary] light:text-gray-800">
            {post.views.toLocaleString()}
          </div>
          <div className="text-[11px]">views</div>
        </div>
      </div>
    </Link>
  );
}
