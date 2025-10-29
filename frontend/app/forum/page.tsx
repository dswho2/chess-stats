/**
 * Forum Page
 * Browse and filter chess discussions and forum posts
 */

"use client";

import { Card, CardBody } from "@/components/ui/Card";
import { useTheme } from "@/contexts/ThemeContext";
import Link from "next/link";
import { mockForumPosts } from "@/lib/mockData";
import { useState } from "react";

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
  const { isDarkMode } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("activity");

  const headingColor = isDarkMode ? "#e8e8e8" : "#1f2937";
  const textColor = isDarkMode ? "#9ca3af" : "#6b7280";

  // Get unique categories from posts
  const categories = Array.from(new Set(mockForumPosts.map((post) => post.category).filter(Boolean)));

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
    <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: "32px", fontWeight: 700, color: headingColor, marginBottom: "12px" }}>
          Chess Forum
        </h1>
        <p style={{ fontSize: "16px", color: textColor }}>
          Join the discussion about tournaments, strategies, players, and more
        </p>
      </div>

      {/* Filters and Sorting */}
      <section>
        <Card>
          <CardBody>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                {/* Category Filter */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "14px", fontWeight: 500, color: headingColor }}>
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
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
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "14px", fontWeight: 500, color: headingColor }}>
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
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
                    <option value="activity">Recent Activity</option>
                    <option value="replies">Most Replies</option>
                    <option value="views">Most Views</option>
                  </select>
                </div>
              </div>

              {/* Active Filters Summary */}
              {selectedCategory !== "all" && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "14px", color: textColor }}>
                    Showing {displayPosts.length} discussion{displayPosts.length !== 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={() => setSelectedCategory("all")}
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

      {/* Forum Posts List */}
      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: headingColor }}>
            Discussions ({displayPosts.length})
          </h2>
          <button
            style={{
              padding: "10px 20px",
              borderRadius: "6px",
              background: "#3b82f6",
              border: "none",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#2563eb";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#3b82f6";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            New Discussion
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {displayPosts.length > 0 ? (
            displayPosts.map((post) => (
              <ForumPostCard key={post.id} post={post} isDarkMode={isDarkMode} />
            ))
          ) : (
            <Card>
              <CardBody>
                <div style={{ textAlign: "center", padding: "40px 20px", color: textColor }}>
                  No discussions found in this category.
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </section>

      {/* Category Sidebar / Quick Links */}
      <section>
        <h2 style={{ fontSize: "24px", fontWeight: 700, color: headingColor, marginBottom: "24px" }}>
          Browse by Category
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
          {categories.map((category) => {
            const categoryPosts = mockForumPosts.filter((post) => post.category === category);
            const totalReplies = categoryPosts.reduce((sum, post) => sum + post.replies, 0);

            return (
              <Card
                key={category}
                hover
                onClick={() => setSelectedCategory(category)}
              >
                <CardBody>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 600, color: headingColor }}>
                      {category}
                    </h3>
                    <div style={{ display: "flex", gap: "16px", fontSize: "14px", color: textColor }}>
                      <div>
                        <span style={{ fontWeight: 600, color: isDarkMode ? "#e8e8e8" : "#1f2937" }}>
                          {categoryPosts.length}
                        </span>{" "}
                        threads
                      </div>
                      <div>
                        <span style={{ fontWeight: 600, color: isDarkMode ? "#e8e8e8" : "#1f2937" }}>
                          {totalReplies}
                        </span>{" "}
                        replies
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// Forum Post Card Component
function ForumPostCard({ post, isDarkMode }: { post: ForumPost; isDarkMode: boolean }) {
  const [votes, setVotes] = useState(post.upvotes || Math.floor(Math.random() * 100) + 10);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);

  const getCategoryColor = (category?: string): string => {
    if (category === "Tournaments") return "#5b8ac6";
    if (category === "Strategy") return "#4a9d7d";
    if (category === "Players") return "#d88e3b";
    if (category === "Improvement") return "#8b7ba8";
    return "#6b7280";
  };

  const handleVote = (type: 'up' | 'down', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (userVote === type) {
      // Remove vote
      setVotes(votes + (type === 'up' ? -1 : 1));
      setUserVote(null);
    } else if (userVote === null) {
      // Add vote
      setVotes(votes + (type === 'up' ? 1 : -1));
      setUserVote(type);
    } else {
      // Change vote
      setVotes(votes + (type === 'up' ? 2 : -2));
      setUserVote(type);
    }
  };

  const handleCardClick = () => {
    window.location.href = `/forum/${post.id}`;
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        padding: "12px 16px",
        background: isDarkMode ? "#1a1f24" : "#ffffff",
        border: isDarkMode ? "1px solid #2d3339" : "1px solid #e5e7eb",
        borderRadius: "6px",
        transition: "all 0.2s",
        cursor: "pointer",
      }}
      onClick={handleCardClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isDarkMode ? "#252a2f" : "#f9fafb";
        e.currentTarget.style.borderColor = "#3b82f6";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isDarkMode ? "#1a1f24" : "#ffffff";
        e.currentTarget.style.borderColor = isDarkMode ? "#2d3339" : "#e5e7eb";
      }}
    >
        {/* Voting Section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0px",
            minWidth: "32px",
          }}
        >
          {/* Upvote */}
          <button
            onClick={(e) => handleVote('up', e)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "2px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: userVote === 'up' ? "#f59e0b" : isDarkMode ? "#6b7280" : "#9ca3af",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (userVote !== 'up') {
                e.currentTarget.style.color = isDarkMode ? "#9ca3af" : "#6b7280";
              }
            }}
            onMouseLeave={(e) => {
              if (userVote !== 'up') {
                e.currentTarget.style.color = isDarkMode ? "#6b7280" : "#9ca3af";
              }
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4l8 8h-6v8h-4v-8H4z" />
            </svg>
          </button>

          {/* Vote Count */}
          <span
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: userVote === 'up' ? "#f59e0b" : userVote === 'down' ? "#3b82f6" : isDarkMode ? "#e8e8e8" : "#1f2937",
              lineHeight: "1",
            }}
          >
            {votes}
          </span>

          {/* Downvote */}
          <button
            onClick={(e) => handleVote('down', e)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "2px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: userVote === 'down' ? "#3b82f6" : isDarkMode ? "#6b7280" : "#9ca3af",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (userVote !== 'down') {
                e.currentTarget.style.color = isDarkMode ? "#9ca3af" : "#6b7280";
              }
            }}
            onMouseLeave={(e) => {
              if (userVote !== 'down') {
                e.currentTarget.style.color = isDarkMode ? "#6b7280" : "#9ca3af";
              }
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 20l-8-8h6V4h4v8h6z" />
            </svg>
          </button>
        </div>

        {/* Post Content */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
          {/* Title */}
          <h3
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: isDarkMode ? "#e8e8e8" : "#1f2937",
              lineHeight: "1.3",
            }}
          >
            {post.title}
          </h3>

          {/* Category Badge and Author/Time in same row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            {/* Category Badge */}
            {post.category && (
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: "3px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#ffffff",
                  background: getCategoryColor(post.category),
                }}
              >
                {post.category}
              </span>
            )}

            {/* Author and Time */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: isDarkMode ? "#6b7280" : "#9ca3af",
              }}
            >
              <span>by </span>
              <Link
                href={`/players/${post.author.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                  color: isDarkMode ? "#9ca3af" : "#6b7280",
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = "underline";
                  e.currentTarget.style.color = isDarkMode ? "#e8e8e8" : "#1f2937";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = "none";
                  e.currentTarget.style.color = isDarkMode ? "#9ca3af" : "#6b7280";
                }}
              >
                {post.author}
              </Link>
              <span>•</span>
              <span>{post.lastActivity}</span>
            </div>
          </div>
        </div>

        {/* Stats (replies and views) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexShrink: 0,
            fontSize: "12px",
            color: isDarkMode ? "#9ca3af" : "#6b7280",
          }}
          className="hidden md:flex"
        >
          <div style={{ textAlign: "center", minWidth: "50px" }}>
            <div style={{ fontWeight: 700, fontSize: "15px", color: isDarkMode ? "#e8e8e8" : "#1f2937" }}>
              {post.replies}
            </div>
            <div style={{ fontSize: "11px" }}>replies</div>
          </div>
          <div style={{ textAlign: "center", minWidth: "50px" }}>
            <div style={{ fontWeight: 700, fontSize: "15px", color: isDarkMode ? "#e8e8e8" : "#1f2937" }}>
              {post.views.toLocaleString()}
            </div>
            <div style={{ fontSize: "11px" }}>views</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
