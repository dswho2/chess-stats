/**
 * Button Component
 * Reusable button with multiple variants and sizes
 * Optimized for accessibility and loading states
 */

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles = {
  primary: "bg-[#10b981] text-white hover:bg-[#059669] active:bg-[#047857]",
  secondary: "bg-[#3b82f6] text-white hover:bg-[#2563eb] active:bg-[#1d4ed8]",
  outline:
    "bg-transparent border-2 border-[#2d3339] text-[#e8e8e8] hover:bg-[#252a2f] active:bg-[#1a1f24]",
  ghost: "bg-transparent text-[#e8e8e8] hover:bg-[#252a2f] active:bg-[#1a1f24]",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        // Base styles
        "inline-flex items-center justify-center rounded-md font-medium",
        "transition-colors duration-150",
        "focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:ring-offset-2 focus:ring-offset-[#0f1419]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        // Variant styles
        variantStyles[variant],
        // Size styles
        sizeStyles[size],
        // Custom className
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
