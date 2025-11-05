/**
 * VoteButtons Component
 * Reusable upvote/downvote buttons with vote count
 * Used across forum posts, comments, and replies
 */

"use client";

import { useState } from "react";

interface VoteButtonsProps {
  initialVotes: number;
  size?: "small" | "medium" | "large";
  orientation?: "horizontal" | "vertical";
}

export function VoteButtons({
  initialVotes,
  size = "medium",
  orientation = "horizontal"
}: VoteButtonsProps) {
  const [votes, setVotes] = useState(initialVotes);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);

  const handleVote = (type: "up" | "down", e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

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

  // Size configurations
  const sizeConfig = {
    small: {
      iconSize: 16,
      padding: "p-1",
      fontSize: "text-sm",
      minWidth: "min-w-[30px]",
    },
    medium: {
      iconSize: 18,
      padding: "p-1.5",
      fontSize: "text-base",
      minWidth: "min-w-[40px]",
    },
    large: {
      iconSize: 20,
      padding: "p-2",
      fontSize: "text-lg",
      minWidth: "min-w-[50px]",
    },
  };

  const config = sizeConfig[size];

  const isVertical = orientation === "vertical";

  return (
    <div className={`flex items-center ${isVertical ? 'flex-col gap-0' : 'gap-2'}`}>
      {/* Upvote Button */}
      <button
        onClick={(e) => handleVote("up", e)}
        className={`flex items-center justify-center ${config.padding} rounded transition-all ${
          userVote === "up"
            ? "text-amber-500"
            : "text-[--color-text-muted] hover:text-amber-500"
        }`}
      >
        <svg width={config.iconSize} height={config.iconSize} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4l8 8h-6v8h-4v-8H4z" />
        </svg>
      </button>

      {/* Vote Count */}
      <span
        className={`${config.fontSize} font-bold ${config.minWidth} text-center ${
          userVote === "up"
            ? "text-amber-500"
            : userVote === "down"
            ? "text-blue-500"
            : "text-[--color-text-primary]"
        } ${isVertical ? 'leading-none' : ''}`}
      >
        {votes}
      </span>

      {/* Downvote Button */}
      <button
        onClick={(e) => handleVote("down", e)}
        className={`flex items-center justify-center ${config.padding} rounded transition-all ${
          userVote === "down"
            ? "text-blue-500"
            : "text-[--color-text-muted] hover:text-blue-500"
        }`}
      >
        <svg width={config.iconSize} height={config.iconSize} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 20l-8-8h6V4h4v8h6z" />
        </svg>
      </button>
    </div>
  );
}
