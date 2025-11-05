/**
 * Forum Thread Detail Page
 * Shows individual forum post with comments and sidebar
 */

"use client";

import { Card, CardBody } from "@/components/ui/Card";
import Link from "next/link";
import { getForumPostById, getCommentsForPost, getRelatedForumPosts } from "@/lib/mockData";
import { useState, useEffect, use } from "react";
import { notFound } from "next/navigation";
import { VoteButtons } from "@/components/forum/VoteButtons";
import { ReplyBox } from "@/components/forum/ReplyBox";
import { Comment } from "@/components/forum/Comment";

interface ForumPost {
  id: string;
  title: string;
  author: string;
  replies: number;
  views: number;
  lastActivity: string;
  category?: string;
  content: string;
  createdAt: string;
  upvotes: number;
}

interface ForumComment {
  id: string;
  postId: string;
  author: string;
  content: string;
  createdAt: string;
  upvotes: number;
}

interface Reply {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  upvotes: number;
  parentId: string;
}

export default function ForumThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const post = getForumPostById(id);
  const comments = getCommentsForPost(id);
  const relatedPosts = getRelatedForumPosts(id, post?.category, 5);

  // State for managing replies
  const [allReplies, setAllReplies] = useState<Reply[]>([]);

  if (!post) {
    notFound();
  }

  const getCategoryColor = (category?: string): string => {
    if (category === "Tournaments") return "#5b8ac6";
    if (category === "Strategy") return "#4a9d7d";
    if (category === "Players") return "#d88e3b";
    if (category === "Learning") return "#8b7ba8";
    return "#6b7280";
  };

  const addReply = (parentId: string, content: string, author: string = "CurrentUser") => {
    const newReply: Reply = {
      id: `r${Date.now()}`,
      author,
      content,
      createdAt: "Just now",
      upvotes: 0,
      parentId,
    };
    setAllReplies([...allReplies, newReply]);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Content - 2/3 width */}
      <div className="flex-1 lg:w-2/3">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/forum"
            className="text-sm text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors"
          >
            ← Back to Forum
          </Link>
        </div>

        {/* Original Post */}
        <Card className="mb-3">
          <CardBody>
            <div className="p-2">
              {/* Post Header */}
              <div className="mb-2">
                {/* Category Badge */}
                {post.category && (
                  <span
                    className="inline-block py-1 px-3 rounded text-xs font-semibold text-white mb-3"
                    style={{ background: getCategoryColor(post.category) }}
                  >
                    {post.category}
                  </span>
                )}

                {/* Title */}
                <h1 className="text-3xl font-bold text-[--color-text-primary] mb-3">
                  {post.title}
                </h1>

                {/* Author and Meta Info */}
                <div className="flex items-center gap-3 text-sm text-[--color-text-muted]">
                  <Link
                    href={`/users/${post.username}`}
                    className="text-[--color-text-secondary] hover:text-[--color-text-primary] font-medium transition-colors"
                  >
                    {post.author}
                  </Link>
                  <span>•</span>
                  <span>{post.createdAt}</span>
                  <span>•</span>
                  <span>{post.views.toLocaleString()} views</span>
                </div>
              </div>

              {/* Post Content */}
              <div className="mb-2 text-base text-[--color-text-primary] leading-relaxed">
                {post.content}
              </div>

              {/* Post Actions - Voting and Reply */}
              <PostVotingAndReply initialUpvotes={post.upvotes} onReply={(content) => addReply(`post-${post.id}`, content)} />
            </div>
          </CardBody>
        </Card>

        {/* Comments Section */}
        <div className="mb-3">
          <h2 className="text-2xl font-bold text-[--color-text-primary] mb-2">
            {comments.length + allReplies.filter(r => r.parentId.startsWith('post-')).length} {comments.length + allReplies.filter(r => r.parentId.startsWith('post-')).length === 1 ? "Reply" : "Replies"}
          </h2>

          {comments.length > 0 || allReplies.filter(r => r.parentId.startsWith('post-')).length > 0 ? (
            <div className="flex flex-col gap-3">
              {/* Original comments */}
              {comments.map((comment) => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  allReplies={allReplies}
                  onReply={addReply}
                />
              ))}

              {/* Direct replies to the post */}
              {allReplies.filter(r => r.parentId === `post-${post.id}`).map((reply) => (
                <ReplyThread
                  key={reply.id}
                  reply={reply}
                  allReplies={allReplies}
                  onReply={addReply}
                  depth={0}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardBody>
                <div className="text-center py-8 text-[--color-text-secondary]">
                  No comments yet. Be the first to reply!
                </div>
              </CardBody>
            </Card>
          )}
        </div>

      </div>

      {/* Sidebar - 1/3 width */}
      <aside className="lg:w-1/3">
        {/* Related Discussions */}
        <Card className="mb-3">
          <CardBody>
            <div className="p-2">
              <h3 className="text-base font-semibold text-[--color-text-primary] mb-2">
                Related Discussions
              </h3>
              <div className="flex flex-col gap-2">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost.id}
                    href={`/forum/${relatedPost.id}`}
                    className="group block"
                  >
                    <div className="flex flex-col gap-1">
                      <h4 className="text-sm font-semibold text-[--color-text-primary] group-hover:text-blue-500 transition-colors leading-tight">
                        {relatedPost.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-[--color-text-muted]">
                        <span>{relatedPost.replies} replies</span>
                        <span>•</span>
                        <span>{relatedPost.views.toLocaleString()} views</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Recent News / Top Discussions */}
        <Card>
          <CardBody>
            <div className="p-2">
              <h3 className="text-base font-semibold text-[--color-text-primary] mb-2">
                Top Discussions
              </h3>
              <div className="flex flex-col gap-2">
                {/* Show top posts by views/replies */}
                {[...getRelatedForumPosts("", undefined, 5)]
                  .sort((a, b) => b.views - a.views)
                  .slice(0, 5)
                  .map((topPost) => (
                    <Link
                      key={topPost.id}
                      href={`/forum/${topPost.id}`}
                      className="group block"
                    >
                      <div className="flex flex-col gap-1">
                        <h4 className="text-sm font-semibold text-[--color-text-primary] group-hover:text-blue-500 transition-colors leading-tight">
                          {topPost.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-[--color-text-muted]">
                          {topPost.category && (
                            <>
                              <span
                                className="py-0.5 px-2 rounded text-[10px] font-semibold text-white"
                                style={{ background: getCategoryColor(topPost.category) }}
                              >
                                {topPost.category}
                              </span>
                              <span>•</span>
                            </>
                          )}
                          <span>{topPost.views.toLocaleString()} views</span>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          </CardBody>
        </Card>
      </aside>
    </div>
  );
}

function ThreadLine({
  height,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  height: string;
  isHovered: boolean;
  onClick: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  return (
    <div
      className="absolute cursor-pointer z-10 transition-all"
      style={{
        left: '12px',
        top: '0',
        width: '16px',
        height: height,
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title="Click to collapse/expand thread"
    >
      <div
        className="absolute left-1/2 -translate-x-1/2 transition-all"
        style={{
          width: '2px',
          height: '100%',
          backgroundColor: isHovered ? '#6b7280' : '#3f3f46',
        }}
      />
    </div>
  );
}

function CommentThread({
  comment,
  allReplies,
  onReply,
}: {
  comment: ForumComment;
  allReplies: Reply[];
  onReply: (parentId: string, content: string) => void;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hasReplies = allReplies.filter(r => r.parentId === comment.id).length > 0;

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    setIsHovered(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Comment
          comment={comment}
          onReply={(content) => onReply(comment.id, content)}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      </div>

      {!isCollapsed && hasReplies && (
        <div className="relative" style={{ paddingLeft: '40px' }}>
          <ThreadLine
            height="100%"
            isHovered={isHovered}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleCollapse();
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          />

          {allReplies.filter(r => r.parentId === comment.id).map((reply) => (
            <ReplyThread
              key={reply.id}
              reply={reply}
              allReplies={allReplies}
              onReply={onReply}
              depth={1}
              parentHovered={isHovered}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReplyThread({
  reply,
  allReplies,
  onReply,
  depth,
  parentHovered,
}: {
  reply: Reply;
  allReplies: Reply[];
  onReply: (parentId: string, content: string) => void;
  depth: number;
  parentHovered?: boolean;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const shouldHighlight = parentHovered || isHovered;
  const hasReplies = allReplies.filter(r => r.parentId === reply.id).length > 0;

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    setIsHovered(false);
  };

  return (
    <div className="relative mt-2">
      <div className="relative">
        <Comment
          comment={reply}
          onReply={(content) => onReply(reply.id, content)}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      </div>

      {!isCollapsed && hasReplies && (
        <div className="relative" style={{ paddingLeft: '40px' }}>
          <ThreadLine
            height="100%"
            isHovered={shouldHighlight}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleCollapse();
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          />

          {allReplies.filter(r => r.parentId === reply.id).map((nestedReply) => (
            <ReplyThread
              key={nestedReply.id}
              reply={nestedReply}
              allReplies={allReplies}
              onReply={onReply}
              depth={depth + 1}
              parentHovered={shouldHighlight}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Post Voting and Reply Component
function PostVotingAndReply({ initialUpvotes, onReply }: { initialUpvotes: number; onReply: (content: string) => void }) {
  const [showReplyBox, setShowReplyBox] = useState(false);

  const handleReplySubmit = (content: string) => {
    onReply(content);
    setShowReplyBox(false);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        {/* Voting */}
        <VoteButtons initialVotes={initialUpvotes} size="medium" orientation="horizontal" />

        {/* Reply Button */}
        <button
          onClick={() => setShowReplyBox(!showReplyBox)}
          className="py-2 px-4 rounded-md bg-blue-500 border-none text-white text-sm font-semibold cursor-pointer transition-all hover:bg-blue-600"
        >
          Reply
        </button>
      </div>

      {/* Reply Box */}
      {showReplyBox && (
        <ReplyBox
          onSubmit={handleReplySubmit}
          onCancel={() => setShowReplyBox(false)}
          size="medium"
        />
      )}
    </>
  );
}


