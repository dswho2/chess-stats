/**
 * User Profile Page
 * Display forum user profile with posts and replies
 */

"use client";

import { Card, CardBody } from "@/components/ui/Card";
import Link from "next/link";
import { use, useState } from "react";
import { getForumUserByUsername, getUserActivity } from "@/lib/mockData";
import { notFound } from "next/navigation";

const ACTIVITIES_PER_PAGE = 10;

export default function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const user = getForumUserByUsername(username);
  const allActivities = getUserActivity(username);

  const [currentPage, setCurrentPage] = useState(1);

  if (!user) {
    notFound();
  }

  // Pagination
  const totalPages = Math.ceil(allActivities.length / ACTIVITIES_PER_PAGE);
  const startIndex = (currentPage - 1) * ACTIVITIES_PER_PAGE;
  const endIndex = startIndex + ACTIVITIES_PER_PAGE;
  const paginatedActivities = allActivities.slice(startIndex, endIndex);

  const getCategoryColor = (category?: string): string => {
    if (category === "Tournaments") return "#5b8ac6";
    if (category === "Strategy") return "#4a9d7d";
    if (category === "Players") return "#d88e3b";
    if (category === "Learning") return "#8b7ba8";
    return "#6b7280";
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
      {/* Back Link */}
      <div>
        <Link
          href="/forum"
          className="text-sm text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors"
        >
          ← Back to Forum
        </Link>
      </div>

      {/* User Profile Card */}
      <Card>
        <CardBody>
          <div className="p-6">
            <div className="flex items-start gap-6">
              {/* Avatar/Profile Picture Placeholder */}
              <div className="w-24 h-24 rounded-full bg-[--color-tertiary-bg] flex items-center justify-center flex-shrink-0">
                <span className="text-4xl text-[--color-text-muted]">
                  {user.displayName.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-[--color-text-primary] mb-2">
                  {user.displayName}
                </h1>

                {/* Badges */}
                {user.badges.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {user.badges.map((badge) => (
                      <span
                        key={badge}
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-500 border border-blue-500/30"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                )}

                {/* Bio */}
                {user.bio && (
                  <p className="text-base text-[--color-text-secondary] mb-4 leading-relaxed">
                    {user.bio}
                  </p>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-[--color-text-muted] mb-1">Member Since</div>
                    <div className="text-sm font-semibold text-[--color-text-primary]">
                      {user.dateRegistered}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[--color-text-muted] mb-1">Last Active</div>
                    <div className="text-sm font-semibold text-[--color-text-primary]">
                      {user.lastPostTime}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[--color-text-muted] mb-1">Posts</div>
                    <div className="text-sm font-semibold text-[--color-text-primary]">
                      {user.totalPosts}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[--color-text-muted] mb-1">Replies</div>
                    <div className="text-sm font-semibold text-[--color-text-primary]">
                      {user.totalReplies}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Activity Section */}
      <div>
        <h2 className="text-2xl font-bold text-[--color-text-primary] mb-4">
          Recent Activity ({allActivities.length})
        </h2>

        {allActivities.length > 0 ? (
          <>
            <div className="flex flex-col gap-3">
              {paginatedActivities.map((activity) => (
                <Link
                  key={activity.id}
                  href={`/forum/${activity.postId}`}
                  className="block"
                >
                  <Card className="hover:border-blue-500 transition-colors">
                    <CardBody>
                      <div className="p-4">
                        {/* Activity Type Badge */}
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              activity.type === "post"
                                ? "bg-green-500/20 text-green-500 border border-green-500/30"
                                : "bg-purple-500/20 text-purple-500 border border-purple-500/30"
                            }`}
                          >
                            {activity.type === "post" ? "Post" : "Reply"}
                          </span>
                          {activity.category && (
                            <span
                              className="px-2 py-0.5 rounded text-xs font-semibold text-white"
                              style={{ backgroundColor: getCategoryColor(activity.category) }}
                            >
                              {activity.category}
                            </span>
                          )}
                          <span className="text-xs text-[--color-text-muted] ml-auto">
                            {activity.createdAt}
                          </span>
                        </div>

                        {/* Post Title (if applicable) */}
                        {activity.postTitle && (
                          <h3 className="text-base font-semibold text-[--color-text-primary] mb-2">
                            {activity.postTitle}
                          </h3>
                        )}

                        {/* Content Preview */}
                        <p className="text-sm text-[--color-text-secondary] mb-2 line-clamp-2">
                          {activity.content}
                        </p>

                        {/* Meta Info */}
                        <div className="flex items-center gap-4 text-xs text-[--color-text-muted]">
                          <span>↑ {activity.upvotes} upvotes</span>
                          {activity.type === "post" && activity.replies !== undefined && (
                            <span>💬 {activity.replies} replies</span>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination />
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardBody>
              <div className="text-center py-12 text-[--color-text-secondary]">
                No activity yet.
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
