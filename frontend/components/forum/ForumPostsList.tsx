/**
 * ForumPostsList Component
 * Displays top forum posts/discussions for homepage
 */

"use client";

import Link from "next/link";

interface ForumPost {
  id: string;
  title: string;
  author: string;
  replies: number;
  views: number;
  lastActivity: string;
  category?: string;
}

interface ForumPostsListProps {
  posts: ForumPost[];
  maxItems?: number;
}

export function ForumPostsList({ posts, maxItems = 5 }: ForumPostsListProps) {
  const displayPosts = posts.slice(0, maxItems);

  if (displayPosts.length === 0) {
    return (
      <div className="text-center py-8 text-[#6b7280]">
        No forum posts yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {displayPosts.map((post) => (
        <ForumPostItem key={post.id} post={post} />
      ))}
    </div>
  );
}

interface ForumPostItemProps {
  post: ForumPost;
}

function ForumPostItem({ post }: ForumPostItemProps) {
  const { id, title, author, replies, views, lastActivity, category } = post;

  return (
    <Link href={`/forum/${id}`}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: "#1a1f24",
          border: "1px solid #2d3339",
          borderRadius: "6px",
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
        {/* Post Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#e8e8e8",
              marginBottom: "4px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </h4>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "12px",
              color: "#6b7280",
            }}
          >
            <span>by {author}</span>
            {category && (
              <>
                <span>•</span>
                <span>{category}</span>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexShrink: 0,
            fontSize: "12px",
            color: "#9ca3af",
          }}
        >
          <div style={{ textAlign: "center", minWidth: "50px" }}>
            <div style={{ fontWeight: 600, color: "#e8e8e8" }}>{replies}</div>
            <div>replies</div>
          </div>
          <div style={{ textAlign: "center", minWidth: "50px" }}>
            <div style={{ fontWeight: 600, color: "#e8e8e8" }}>{views}</div>
            <div>views</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
