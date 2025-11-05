"use client";

/**
 * Header Component
 * Global navigation header with Home/Icon, Search, and Nav links
 * Layout: [Home Icon] [Search Bar] [Tournaments] [Forum] [Rankings] [Stats]
 */

import Link from "next/link";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Tournaments", href: "/tournaments" },
  { label: "Forum", href: "/forum" },
  { label: "Rankings", href: "/rankings" },
  { label: "Stats", href: "/stats" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <header
      className="sticky top-0 z-50 w-full border-b backdrop-blur"
      style={{
        borderColor: isDarkMode ? "#2d3339" : "#e5e7eb",
        background: isDarkMode ? "rgba(15, 20, 25, 0.95)" : "rgba(255, 255, 255, 0.95)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div style={{ display: "flex", height: "64px", alignItems: "center", gap: "24px", width: "100%" }}>
          {/* Logo/Home - Left */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              opacity: 1,
              transition: "opacity 0.2s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            title="Home"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-[#10b981] to-[#3b82f6] rounded-md flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">♔</span>
            </div>
            <span
              className="text-xl font-bold hidden sm:block"
              style={{ color: isDarkMode ? "#e8e8e8" : "#1f2937" }}
            >
              ChessStats
            </span>
          </Link>

          {/* Search Bar - Center/Left */}
          <div className="hidden md:flex items-center flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '4px',
                background: isDarkMode ? '#1a1f24' : '#f9fafb',
                border: isDarkMode ? '1px solid #2d3339' : '1px solid #e5e7eb',
                fontSize: '14px',
                color: isDarkMode ? '#e8e8e8' : '#1f2937',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = isDarkMode ? '#2d3339' : '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Desktop Navigation - Center */}
          <nav className="hidden md:flex items-center" style={{ gap: "8px" }}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: isDarkMode ? "#9ca3af" : "#6b7280",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = isDarkMode ? "#e8e8e8" : "#1f2937";
                  e.currentTarget.style.background = isDarkMode ? "#1a1f24" : "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = isDarkMode ? "#9ca3af" : "#6b7280";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Spacer to push right items to far right */}
          <div style={{ flex: 1 }} className="hidden md:block" />

          {/* Right Side Actions - Theme Toggle & Login */}
          <div className="hidden md:flex items-center" style={{ gap: "8px" }}>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              style={{
                padding: "8px",
                borderRadius: "6px",
                color: isDarkMode ? "#9ca3af" : "#6b7280",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = isDarkMode ? "#e8e8e8" : "#1f2937";
                e.currentTarget.style.background = isDarkMode ? "#1a1f24" : "#f3f4f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = isDarkMode ? "#9ca3af" : "#6b7280";
                e.currentTarget.style.background = "transparent";
              }}
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                // Moon icon for dark mode
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              ) : (
                // Sun icon for light mode
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              )}
            </button>

            {/* Login Button */}
            <Link
              href="/login"
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: 500,
                color: isDarkMode ? "#9ca3af" : "#6b7280",
                background: "transparent",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = isDarkMode ? "#e8e8e8" : "#1f2937";
                e.currentTarget.style.background = isDarkMode ? "#1a1f24" : "#f3f4f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = isDarkMode ? "#9ca3af" : "#6b7280";
                e.currentTarget.style.background = "transparent";
              }}
            >
              Log In
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-[#9ca3af] hover:text-[#e8e8e8] hover:bg-[#1a1f24] transition-colors ml-auto"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-[#2d3339] space-y-1">
            {/* Mobile Search */}
            <div className="px-2 py-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-4 w-4 text-[#6b7280]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  className={cn(
                    "w-full pl-10 pr-4 py-2 rounded-md",
                    "bg-[#1a1f24] border border-[#2d3339]",
                    "text-sm text-[#e8e8e8] placeholder-[#6b7280]",
                    "focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                  )}
                />
              </div>
            </div>

            {/* Mobile Nav Links */}
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-2 text-sm font-medium text-[#9ca3af] hover:text-[#e8e8e8] hover:bg-[#1a1f24] rounded-md transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            {/* Mobile Theme Toggle & Login */}
            <div className="flex items-center gap-2 px-2 pt-2">
              <button
                onClick={toggleTheme}
                className="flex-1 px-4 py-2 text-sm font-medium text-[#9ca3af] hover:text-[#e8e8e8] hover:bg-[#1a1f24] rounded-md transition-colors flex items-center justify-center gap-2"
              >
                {isDarkMode ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                    Dark
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="5"></circle>
                      <line x1="12" y1="1" x2="12" y2="3"></line>
                      <line x1="12" y1="21" x2="12" y2="23"></line>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                      <line x1="1" y1="12" x2="3" y2="12"></line>
                      <line x1="21" y1="12" x2="23" y2="12"></line>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                    Light
                  </>
                )}
              </button>
              <Link
                href="/login"
                className="flex-1 px-4 py-2 text-sm font-medium text-[#9ca3af] hover:text-[#e8e8e8] hover:bg-[#1a1f24] rounded-md transition-colors text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log In
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
