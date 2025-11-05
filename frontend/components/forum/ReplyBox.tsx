/**
 * ReplyBox Component
 * Reusable reply textarea with submit/cancel buttons
 */

"use client";

import { useState } from "react";

interface ReplyBoxProps {
  onSubmit: (content: string) => void;
  onCancel: () => void;
  placeholder?: string;
  size?: "small" | "medium" | "large";
}

export function ReplyBox({
  onSubmit,
  onCancel,
  placeholder = "Write your reply...",
  size = "medium"
}: ReplyBoxProps) {
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content);
      setContent("");
    }
  };

  // Size configurations
  const sizeConfig = {
    small: {
      minHeight: "min-h-[60px]",
      padding: "p-2",
      buttonPadding: "py-1 px-2.5",
      buttonText: "text-xs",
      containerPadding: "p-2",
      gap: "gap-1",
    },
    medium: {
      minHeight: "min-h-[100px]",
      padding: "p-3",
      buttonPadding: "py-2 px-4",
      buttonText: "text-sm",
      containerPadding: "p-4",
      gap: "gap-2",
    },
    large: {
      minHeight: "min-h-[120px]",
      padding: "p-4",
      buttonPadding: "py-2.5 px-5",
      buttonText: "text-base",
      containerPadding: "p-5",
      gap: "gap-3",
    },
  };

  const config = sizeConfig[size];

  return (
    <div className={`mt-4 ${config.containerPadding} rounded-md bg-[--color-tertiary-bg] border border-[--color-border]`}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className={`w-full ${config.minHeight} ${config.padding} rounded-md bg-[--color-secondary-bg] border border-[--color-border] text-[--color-text-primary] ${config.buttonText} resize-vertical outline-none focus:border-blue-500 transition-colors`}
      />
      <div className={`flex justify-end ${config.gap} mt-3`}>
        <button
          onClick={() => {
            onCancel();
            setContent("");
          }}
          className={`${config.buttonPadding} rounded-md bg-[--color-secondary-bg] border border-[--color-border] text-[--color-text-secondary] ${config.buttonText} font-semibold cursor-pointer transition-all hover:bg-[--color-tertiary-bg]`}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!content.trim()}
          className={`${config.buttonPadding} rounded-md bg-blue-500 border-none text-white ${config.buttonText} font-semibold cursor-pointer transition-all hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Post Reply
        </button>
      </div>
    </div>
  );
}
