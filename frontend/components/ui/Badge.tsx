/**
 * Badge Component
 * Reusable pill-shaped badge for platforms, status, formats, etc.
 * Variants match VLR.gg style with platform-specific colors
 */

import { cn } from "@/lib/utils";

export interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "chess-com"
    | "lichess"
    | "fide"
    | "ongoing"
    | "completed"
    | "upcoming"
    | "swiss"
    | "knockout"
    | "arena"
    | "round-robin"
    | "default";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const variantStyles: Record<string, string> = {
  // Platform badges
  "chess-com": "bg-[#7fa650] text-white",
  lichess: "bg-[#f59e0b] text-white",
  fide: "bg-[#3b82f6] text-white",

  // Status badges
  ongoing: "bg-[#10b981] text-white animate-pulse",
  completed: "bg-[#6b7280] text-white",
  upcoming: "bg-[#3b82f6] text-white",

  // Format badges
  swiss: "bg-[#252a2f] text-[#9ca3af] border border-[#2d3339]",
  knockout: "bg-[#252a2f] text-[#9ca3af] border border-[#2d3339]",
  arena: "bg-[#252a2f] text-[#9ca3af] border border-[#2d3339]",
  "round-robin": "bg-[#252a2f] text-[#9ca3af] border border-[#2d3339]",

  // Default
  default: "bg-[#252a2f] text-[#e8e8e8] border border-[#2d3339]",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-1.5 text-base",
};

export function Badge({
  children,
  variant = "default",
  size = "sm",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        // Base styles
        "inline-flex items-center justify-center rounded-full font-semibold whitespace-nowrap",
        "transition-colors duration-150",
        // Variant styles
        variantStyles[variant],
        // Size styles
        sizeStyles[size],
        // Custom className
        className
      )}
    >
      {children}
    </span>
  );
}
