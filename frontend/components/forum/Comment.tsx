/**
 * Comment Component
 * Unified component for displaying comments and replies
 * with voting, replying, and collapsing functionality
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { VoteButtons } from "./VoteButtons";
import { ReplyBox } from "./ReplyBox";

interface CommentData {
  id: string;
  author: string;
  username: string;
  content: string;
  createdAt: string;
  upvotes: number;
}

interface CommentProps {
  comment: CommentData;
  onReply: (content: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Comment({
  comment,
  onReply,
  isCollapsed,
  onToggleCollapse,
}: CommentProps) {
  const [showReplyBox, setShowReplyBox] = useState(false);

  const handleReplySubmit = (content: string) => {
    onReply(content);
    setShowReplyBox(false);
  };

  return (
    <Card>
      <CardBody className="!p-0">
        <div className="px-4 py-2">
          {/* Header with author, timestamp, and collapse toggle */}
          <div
            onClick={onToggleCollapse}
            className="flex items-center gap-2 mb-0.5 cursor-pointer hover:bg-[--color-tertiary-bg] px-1 py-0.5 rounded transition-colors"
          >
            <Link
              href={`/users/${comment.username}`}
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-semibold text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors"
            >
              {comment.author}
            </Link>
            <span className="text-xs text-[--color-text-muted]">•</span>
            <span className="text-xs text-[--color-text-muted]">{comment.createdAt}</span>
            <span className="text-xs text-[--color-text-muted] ml-auto">
              {isCollapsed ? "[+]" : "[-]"}
            </span>
          </div>

          {/* Content (shown when not collapsed) */}
          {!isCollapsed && (
            <>
              <p className="text-sm text-[--color-text-primary] pl-1 leading-snug mb-0.5">
                {comment.content}
              </p>

              {/* Actions: Voting and Reply button */}
              <div className="flex items-center justify-between py-0.5">
                <VoteButtons initialVotes={comment.upvotes} size="small" orientation="horizontal" />

                <button
                  onClick={() => setShowReplyBox(!showReplyBox)}
                  className="text-xs text-[--color-text-muted] hover:text-[--color-text-primary] font-medium transition-colors"
                >
                  Reply
                </button>
              </div>

              {/* Reply Box */}
              {showReplyBox && (
                <ReplyBox
                  onSubmit={handleReplySubmit}
                  onCancel={() => setShowReplyBox(false)}
                  size="small"
                />
              )}
            </>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
