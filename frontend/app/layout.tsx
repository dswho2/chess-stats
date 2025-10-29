import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Providers } from "@/components/providers/Providers";
import "./globals.css";

// Load Inter font for body text
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Load JetBrains Mono for stats and numbers
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ChessStats - Tournament Tracking & Player Statistics",
  description:
    "Track chess tournaments, analyze player performance, and explore competitive chess statistics across Chess.com, Lichess, and FIDE.",
  keywords: [
    "chess",
    "tournament",
    "statistics",
    "chess.com",
    "lichess",
    "FIDE",
    "titled tuesday",
    "chess stats",
  ],
  authors: [{ name: "ChessStats" }],
  openGraph: {
    type: "website",
    title: "ChessStats - Chess Tournament Statistics",
    description: "Track tournaments and analyze player performance across all major chess platforms",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased min-h-screen">
        <Providers>
          <Header />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
