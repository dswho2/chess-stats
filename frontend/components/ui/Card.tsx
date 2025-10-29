/**
 * Card Component
 * Reusable card container with hover effects
 * Used for tournament cards, player cards, etc.
 */

"use client";

import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hover?: boolean;
  onClick?: () => void;
  as?: "div" | "article" | "section";
}

export function Card({
  children,
  className,
  style,
  hover = false,
  onClick,
  as: Component = "div",
}: CardProps) {
  const { isDarkMode } = useTheme();

  return (
    <Component
      style={{
        background: isDarkMode ? "#1a1f24" : "#ffffff",
        border: `1px solid ${isDarkMode ? "#2d3339" : "#e5e7eb"}`,
        borderRadius: "8px",
        transition: "all 0.15s",
        cursor: onClick || hover ? "pointer" : "default",
        ...style,
      }}
      className={className}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onMouseEnter={(e) => {
        if (hover) {
          e.currentTarget.style.background = isDarkMode ? "#1f2429" : "#f9fafb";
          e.currentTarget.style.borderColor = isDarkMode ? "#3a3f44" : "#d1d5db";
          e.currentTarget.style.boxShadow = isDarkMode
            ? "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
            : "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
        }
      }}
      onMouseLeave={(e) => {
        if (hover) {
          e.currentTarget.style.background = isDarkMode ? "#1a1f24" : "#ffffff";
          e.currentTarget.style.borderColor = isDarkMode ? "#2d3339" : "#e5e7eb";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </Component>
  );
}

/**
 * CardHeader Component
 * Header section of a card with consistent padding
 */
export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isDarkMode } = useTheme();

  return (
    <div
      style={{
        padding: "16px 24px",
        borderBottom: `1px solid ${isDarkMode ? "#2d3339" : "#e5e7eb"}`,
      }}
      className={className}
    >
      {children}
    </div>
  );
}

/**
 * CardBody Component
 * Main content area of a card
 */
export function CardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("px-6 py-4", className)}>{children}</div>;
}

/**
 * CardFooter Component
 * Footer section of a card
 */
export function CardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isDarkMode } = useTheme();

  return (
    <div
      style={{
        padding: "16px 24px",
        borderTop: `1px solid ${isDarkMode ? "#2d3339" : "#e5e7eb"}`,
        background: isDarkMode ? "#151a1f" : "#f9fafb",
      }}
      className={className}
    >
      {children}
    </div>
  );
}
