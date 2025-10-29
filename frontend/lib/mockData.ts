/**
 * Mock Data for Development
 * Sample tournaments, players, and standings
 */

import {
  Tournament,
  TournamentStanding,
  Platform,
  TournamentFormat,
  TournamentStatus,
  TimeControl,
  PlayerTitle,
} from "@/types";

export const mockTournaments: Tournament[] = [
  {
    id: "titled-tuesday-oct-29",
    name: "Titled Tuesday Late",
    platform: Platform.CHESS_COM,
    format: TournamentFormat.SWISS,
    status: TournamentStatus.COMPLETED,
    timeControl: TimeControl.BLITZ,
    startDate: "2024-10-29T18:00:00Z",
    endDate: "2024-10-29T21:30:00Z",
    prizePool: 1600,
    prizeCurrency: "USD",
    participantCount: 523,
    rounds: 11,
    featured: true,
    thumbnailUrl: "https://images.chesscomfiles.com/uploads/v1/images_users/tiny_mce/PedroPinhata/phpkXK09k.png",
    officialUrl: "https://www.chess.com/tournament/titled-tuesday",
    description: "Weekly blitz tournament for titled players with $1,600 prize pool",
  },
  {
    id: "world-rapid-2024",
    name: "World Rapid Championship 2024",
    platform: Platform.FIDE,
    format: TournamentFormat.SWISS,
    status: TournamentStatus.COMPLETED,
    timeControl: TimeControl.RAPID,
    startDate: "2024-10-27T10:00:00Z",
    endDate: "2024-10-29T18:00:00Z",
    prizePool: 175000,
    prizeCurrency: "USD",
    participantCount: 180,
    rounds: 13,
    featured: true,
    thumbnailUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/b/b8/FIDE_Logo.svg/200px-FIDE_Logo.svg.png",
    location: "New York, USA",
    officialUrl: "https://fide.com",
    description: "Official FIDE World Rapid Championship",
  },
  {
    id: "lichess-titled-arena-nov",
    name: "Lichess Titled Arena",
    platform: Platform.LICHESS,
    format: TournamentFormat.ARENA,
    status: TournamentStatus.UPCOMING,
    timeControl: TimeControl.BLITZ,
    startDate: "2024-11-05T19:00:00Z",
    endDate: "2024-11-05T20:30:00Z",
    prizePool: 250,
    prizeCurrency: "USD",
    participantCount: 350,
    featured: true,
    thumbnailUrl: "https://images.prismic.io/lichess/5cfd2630-2a8f-42fa-8838-b0c9d5cfb75c_lichess-box-1024.png",
    officialUrl: "https://lichess.org/tournament",
    description: "Monthly arena tournament for titled players",
  },
  {
    id: "speed-chess-championship-2024",
    name: "Speed Chess Championship 2024",
    platform: Platform.CHESS_COM,
    format: TournamentFormat.KNOCKOUT,
    status: TournamentStatus.ONGOING,
    timeControl: TimeControl.BLITZ,
    startDate: "2024-10-30T15:00:00Z",
    endDate: "2024-11-15T20:00:00Z",
    prizePool: 100000,
    prizeCurrency: "USD",
    participantCount: 32,
    thumbnailUrl: "https://images.chesscomfiles.com/uploads/v1/images_users/tiny_mce/PedroPinhata/phpkXK09k.png",
    officialUrl: "https://www.chess.com/tournament/speed-chess-championship",
    description: "Elite knockout tournament featuring the world's best speed chess players",
  },
  {
    id: "fide-grand-swiss-2024",
    name: "FIDE Grand Swiss 2024",
    platform: Platform.FIDE,
    format: TournamentFormat.SWISS,
    status: TournamentStatus.COMPLETED,
    timeControl: TimeControl.CLASSICAL,
    startDate: "2024-10-15T14:00:00Z",
    endDate: "2024-10-28T18:00:00Z",
    prizePool: 400000,
    prizeCurrency: "USD",
    participantCount: 156,
    rounds: 11,
    thumbnailUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/b/b8/FIDE_Logo.svg/200px-FIDE_Logo.svg.png",
    location: "Douglas, Isle of Man",
    officialUrl: "https://fide.com/grand-swiss",
    description: "Major qualifying event for the Candidates Tournament",
  },
  {
    id: "lichess-bullet-arena-oct-30",
    name: "Lichess Bullet Arena",
    platform: Platform.LICHESS,
    format: TournamentFormat.ARENA,
    status: TournamentStatus.UPCOMING,
    timeControl: TimeControl.BULLET,
    startDate: "2024-10-30T18:00:00Z",
    endDate: "2024-10-30T19:00:00Z",
    prizePool: 150,
    prizeCurrency: "USD",
    participantCount: 500,
    thumbnailUrl: "https://images.prismic.io/lichess/5cfd2630-2a8f-42fa-8838-b0c9d5cfb75c_lichess-box-1024.png",
    officialUrl: "https://lichess.org/tournament",
    description: "Fast-paced bullet tournament open to all players",
  },
  {
    id: "chesscom-blitz-titled-oct-31",
    name: "Chess.com Blitz Battle",
    platform: Platform.CHESS_COM,
    format: TournamentFormat.SWISS,
    status: TournamentStatus.UPCOMING,
    timeControl: TimeControl.BLITZ,
    startDate: "2024-10-31T20:00:00Z",
    endDate: "2024-10-31T23:00:00Z",
    prizePool: 2000,
    prizeCurrency: "USD",
    participantCount: 450,
    rounds: 9,
    thumbnailUrl: "https://images.chesscomfiles.com/uploads/v1/images_users/tiny_mce/PedroPinhata/phpkXK09k.png",
    officialUrl: "https://www.chess.com/tournament",
    description: "High-stakes blitz tournament with strong prize pool",
  },
  {
    id: "pro-chess-league-week-5",
    name: "PRO Chess League - Week 5",
    platform: Platform.CHESS_COM,
    format: TournamentFormat.ROUND_ROBIN,
    status: TournamentStatus.ONGOING,
    timeControl: TimeControl.RAPID,
    startDate: "2024-10-29T19:00:00Z",
    endDate: "2024-10-29T22:00:00Z",
    prizePool: 50000,
    prizeCurrency: "USD",
    participantCount: 48,
    thumbnailUrl: "https://images.chesscomfiles.com/uploads/v1/images_users/tiny_mce/PedroPinhata/phpkXK09k.png",
    officialUrl: "https://www.chess.com/article/pro-chess-league",
    description: "Team-based professional chess league",
  },
];

export const mockStandings: TournamentStanding[] = [
  {
    rank: 1,
    playerId: "hikaru-nakamura",
    playerName: "Hikaru Nakamura",
    playerTitle: PlayerTitle.GM,
    playerCountry: "US",
    score: 10,
    rating: 3265,
    performanceRating: 3012,
    buchholzScore: 84.5,
    wins: 10,
    draws: 0,
    losses: 1,
    gamesPlayed: 11,
    whiteGames: 6,
    blackGames: 5,
  },
  {
    rank: 2,
    playerId: "magnus-carlsen",
    playerName: "Magnus Carlsen",
    playerTitle: PlayerTitle.GM,
    playerCountry: "NO",
    score: 9.5,
    rating: 3210,
    performanceRating: 2980,
    buchholzScore: 83.0,
    wins: 9,
    draws: 1,
    losses: 1,
    gamesPlayed: 11,
    whiteGames: 5,
    blackGames: 6,
  },
  {
    rank: 3,
    playerId: "alireza-firouzja",
    playerName: "Alireza Firouzja",
    playerTitle: PlayerTitle.GM,
    playerCountry: "FR",
    score: 9.5,
    rating: 3195,
    performanceRating: 2975,
    buchholzScore: 82.5,
    wins: 9,
    draws: 1,
    losses: 1,
    gamesPlayed: 11,
    whiteGames: 6,
    blackGames: 5,
  },
  {
    rank: 4,
    playerId: "fabiano-caruana",
    playerName: "Fabiano Caruana",
    playerTitle: PlayerTitle.GM,
    playerCountry: "US",
    score: 9,
    rating: 3150,
    performanceRating: 2950,
    buchholzScore: 81.5,
    wins: 8,
    draws: 2,
    losses: 1,
    gamesPlayed: 11,
    whiteGames: 5,
    blackGames: 6,
  },
  {
    rank: 5,
    playerId: "wesley-so",
    playerName: "Wesley So",
    playerTitle: PlayerTitle.GM,
    playerCountry: "US",
    score: 9,
    rating: 3140,
    performanceRating: 2945,
    buchholzScore: 80.0,
    wins: 8,
    draws: 2,
    losses: 1,
    gamesPlayed: 11,
    whiteGames: 6,
    blackGames: 5,
  },
  {
    rank: 6,
    playerId: "levon-aronian",
    playerName: "Levon Aronian",
    playerTitle: PlayerTitle.GM,
    playerCountry: "US",
    score: 8.5,
    rating: 3120,
    performanceRating: 2920,
    buchholzScore: 79.5,
    wins: 7,
    draws: 3,
    losses: 1,
    gamesPlayed: 11,
    whiteGames: 5,
    blackGames: 6,
  },
  {
    rank: 7,
    playerId: "anish-giri",
    playerName: "Anish Giri",
    playerTitle: PlayerTitle.GM,
    playerCountry: "NL",
    score: 8.5,
    rating: 3110,
    performanceRating: 2915,
    buchholzScore: 78.5,
    wins: 7,
    draws: 3,
    losses: 1,
    gamesPlayed: 11,
    whiteGames: 6,
    blackGames: 5,
  },
  {
    rank: 8,
    playerId: "ian-nepomniachtchi",
    playerName: "Ian Nepomniachtchi",
    playerTitle: PlayerTitle.GM,
    playerCountry: "RU",
    score: 8,
    rating: 3105,
    performanceRating: 2900,
    buchholzScore: 77.0,
    wins: 7,
    draws: 2,
    losses: 2,
    gamesPlayed: 11,
    whiteGames: 5,
    blackGames: 6,
  },
  {
    rank: 9,
    playerId: "ding-liren",
    playerName: "Ding Liren",
    playerTitle: PlayerTitle.GM,
    playerCountry: "CN",
    score: 8,
    rating: 3095,
    performanceRating: 2895,
    buchholzScore: 76.5,
    wins: 6,
    draws: 4,
    losses: 1,
    gamesPlayed: 11,
    whiteGames: 6,
    blackGames: 5,
  },
  {
    rank: 10,
    playerId: "maxime-vachier-lagrave",
    playerName: "Maxime Vachier-Lagrave",
    playerTitle: PlayerTitle.GM,
    playerCountry: "FR",
    score: 8,
    rating: 3080,
    performanceRating: 2890,
    buchholzScore: 75.0,
    wins: 7,
    draws: 2,
    losses: 2,
    gamesPlayed: 11,
    whiteGames: 5,
    blackGames: 6,
  },
];

// Mock Forum Posts
export const mockForumPosts = [
  {
    id: "1",
    title: "Titled Tuesday Discussion - October 29th Results",
    author: "ChessFan123",
    replies: 47,
    views: 1203,
    lastActivity: "2 hours ago",
    category: "Tournaments",
    content: "What an incredible tournament! Hikaru completely dominated with 10/11. His performance in the endgame was absolutely phenomenal. Did anyone else notice his opening preparation in the Najdorf? Would love to hear everyone's thoughts on the key games.",
    createdAt: "1 day ago",
    upvotes: 89,
  },
  {
    id: "2",
    title: "Best opening preparation for rapid tournaments?",
    author: "TacticsMaster",
    replies: 89,
    views: 2456,
    lastActivity: "5 hours ago",
    category: "Strategy",
    content: "I'm preparing for an upcoming rapid tournament and struggling with how much opening theory to memorize versus understanding middlegame principles. For rapid time controls (15+10), what's your approach? Do you stick to a limited repertoire or try to be more flexible?",
    createdAt: "2 days ago",
    upvotes: 124,
  },
  {
    id: "3",
    title: "Magnus Carlsen's performance in recent online events",
    author: "ChessAnalyst",
    replies: 134,
    views: 3872,
    lastActivity: "1 day ago",
    category: "Players",
    content: "Looking at Magnus's recent online tournament results, there's been an interesting shift in his playing style. He's been much more aggressive in the opening phase and taking more calculated risks. His win rate in rapid time controls is absolutely insane - 73% over the last 6 months. Let's discuss what makes his online play so dominant.",
    createdAt: "3 days ago",
    upvotes: 256,
  },
  {
    id: "4",
    title: "How to improve from 2000 to 2200 rating?",
    author: "AspiringIM",
    replies: 67,
    views: 1891,
    lastActivity: "3 hours ago",
    category: "Learning",
    content: "I've been stuck around 2000 FIDE for the past year and really want to break through to 2200. I've been working on tactics, endgames, and analyzing my games, but progress has been slow. What specific areas should I focus on? Any recommendations for training methods that worked for you at this level?",
    createdAt: "1 day ago",
    upvotes: 143,
  },
  {
    id: "5",
    title: "FIDE Grand Swiss 2024 - Post-Tournament Analysis",
    author: "GrandmasterPro",
    replies: 92,
    views: 2634,
    lastActivity: "6 hours ago",
    category: "Tournaments",
    content: "The FIDE Grand Swiss concluded yesterday with some absolutely spectacular games. Caruana's endgame technique in the final round was a masterclass. I've done a deep analysis of the top 10 players' games and found some interesting opening trends. The Najdorf and Queen's Gambit Declined were by far the most popular choices.",
    createdAt: "1 day ago",
    upvotes: 178,
  },
];

// Mock Forum Post Comments
export interface ForumComment {
  id: string;
  postId: string;
  author: string;
  content: string;
  createdAt: string;
  upvotes: number;
  parentCommentId?: string;
}

export const mockForumComments: Record<string, ForumComment[]> = {
  "1": [
    {
      id: "c1",
      postId: "1",
      author: "GrandmasterPro",
      content: "Completely agree about Hikaru's endgame technique. That R+P endgame in round 9 was textbook perfect. The way he converted the extra pawn was a thing of beauty.",
      createdAt: "12 hours ago",
      upvotes: 45,
    },
    {
      id: "c2",
      postId: "1",
      author: "TacticsMaster",
      content: "His Najdorf prep was definitely impressive, but I think Magnus's game against Alireza was even more instructive. The piece sacrifice on move 23 was brilliant!",
      createdAt: "10 hours ago",
      upvotes: 32,
    },
    {
      id: "c3",
      postId: "1",
      author: "ChessAnalyst",
      content: "Does anyone have the PGN for Hikaru's round 7 game? I'd love to analyze it more deeply.",
      createdAt: "8 hours ago",
      upvotes: 18,
    },
  ],
  "2": [
    {
      id: "c4",
      postId: "2",
      author: "OpeningExpert",
      content: "For rapid tournaments, I recommend focusing on 2-3 openings as White and 2 solid defenses as Black. The key is understanding the typical plans rather than memorizing 20 moves deep. I usually spend 70% of prep time on middlegame patterns and only 30% on opening theory.",
      createdAt: "4 hours ago",
      upvotes: 67,
    },
    {
      id: "c5",
      postId: "2",
      author: "AspiringIM",
      content: "This is great advice! What openings would you recommend for someone around 2000 rating? I currently play 1.e4 but struggle with all the Sicilian variations.",
      createdAt: "3 hours ago",
      upvotes: 23,
    },
  ],
  "3": [
    {
      id: "c6",
      postId: "3",
      author: "ChessFan123",
      content: "Magnus's mouse speed is also a factor people don't talk about enough. His pre-moving in obvious positions saves crucial seconds that add up over a tournament.",
      createdAt: "2 days ago",
      upvotes: 89,
    },
    {
      id: "c7",
      postId: "3",
      author: "TacticsMaster",
      content: "The psychological factor is huge too. Everyone knows they're playing Magnus, which affects their decision-making. He's in their heads before the game even starts.",
      createdAt: "2 days ago",
      upvotes: 54,
    },
  ],
};

// Mock Player Rankings - FIDE Classical
export const mockFideClassicalRankings = [
  {
    rank: 1,
    playerId: "hikaru-nakamura",
    playerName: "Hikaru Nakamura",
    title: "GM",
    rating: 3265,
    country: "US",
    ratingChange: 12,
  },
  {
    rank: 2,
    playerId: "magnus-carlsen",
    playerName: "Magnus Carlsen",
    title: "GM",
    rating: 3210,
    country: "NO",
    ratingChange: -5,
  },
  {
    rank: 3,
    playerId: "alireza-firouzja",
    playerName: "Alireza Firouzja",
    title: "GM",
    rating: 3195,
    country: "FR",
    ratingChange: 8,
  },
  {
    rank: 4,
    playerId: "fabiano-caruana",
    playerName: "Fabiano Caruana",
    title: "GM",
    rating: 3150,
    country: "US",
    ratingChange: 3,
  },
  {
    rank: 5,
    playerId: "wesley-so",
    playerName: "Wesley So",
    title: "GM",
    rating: 3140,
    country: "US",
    ratingChange: -2,
  },
  {
    rank: 6,
    playerId: "levon-aronian",
    playerName: "Levon Aronian",
    title: "GM",
    rating: 3120,
    country: "US",
    ratingChange: 0,
  },
  {
    rank: 7,
    playerId: "anish-giri",
    playerName: "Anish Giri",
    title: "GM",
    rating: 3110,
    country: "NL",
    ratingChange: 5,
  },
  {
    rank: 8,
    playerId: "ian-nepomniachtchi",
    playerName: "Ian Nepomniachtchi",
    title: "GM",
    rating: 3105,
    country: "RU",
    ratingChange: -7,
  },
  {
    rank: 9,
    playerId: "ding-liren",
    playerName: "Ding Liren",
    title: "GM",
    rating: 3095,
    country: "CN",
    ratingChange: 4,
  },
  {
    rank: 10,
    playerId: "maxime-vachier-lagrave",
    playerName: "Maxime Vachier-Lagrave",
    title: "GM",
    rating: 3080,
    country: "FR",
    ratingChange: 1,
  },
];

// Mock Player Rankings - FIDE Rapid
export const mockFideRapidRankings = [
  { rank: 1, playerId: "magnus-carlsen", playerName: "Magnus Carlsen", title: "GM", rating: 2856, country: "NO", ratingChange: 8 },
  { rank: 2, playerId: "hikaru-nakamura", playerName: "Hikaru Nakamura", title: "GM", rating: 2847, country: "US", ratingChange: 5 },
  { rank: 3, playerId: "fabiano-caruana", playerName: "Fabiano Caruana", title: "GM", rating: 2822, country: "US", ratingChange: -3 },
  { rank: 4, playerId: "alireza-firouzja", playerName: "Alireza Firouzja", title: "GM", rating: 2815, country: "FR", ratingChange: 12 },
  { rank: 5, playerId: "anish-giri", playerName: "Anish Giri", title: "GM", rating: 2803, country: "NL", ratingChange: 0 },
  { rank: 6, playerId: "wesley-so", playerName: "Wesley So", title: "GM", rating: 2795, country: "US", ratingChange: 7 },
  { rank: 7, playerId: "levon-aronian", playerName: "Levon Aronian", title: "GM", rating: 2789, country: "US", ratingChange: -2 },
  { rank: 8, playerId: "ding-liren", playerName: "Ding Liren", title: "GM", rating: 2780, country: "CN", ratingChange: 4 },
  { rank: 9, playerId: "ian-nepomniachtchi", playerName: "Ian Nepomniachtchi", title: "GM", rating: 2775, country: "RU", ratingChange: -5 },
  { rank: 10, playerId: "maxime-vachier-lagrave", playerName: "Maxime Vachier-Lagrave", title: "GM", rating: 2768, country: "FR", ratingChange: 2 },
];

// Mock Player Rankings - FIDE Blitz
export const mockFideBlitzRankings = [
  { rank: 1, playerId: "magnus-carlsen", playerName: "Magnus Carlsen", title: "GM", rating: 2942, country: "NO", ratingChange: 15 },
  { rank: 2, playerId: "hikaru-nakamura", playerName: "Hikaru Nakamura", title: "GM", rating: 2925, country: "US", ratingChange: 18 },
  { rank: 3, playerId: "alireza-firouzja", playerName: "Alireza Firouzja", title: "GM", rating: 2898, country: "FR", ratingChange: 10 },
  { rank: 4, playerId: "ian-nepomniachtchi", playerName: "Ian Nepomniachtchi", title: "GM", rating: 2876, country: "RU", ratingChange: 6 },
  { rank: 5, playerId: "fabiano-caruana", playerName: "Fabiano Caruana", title: "GM", rating: 2865, country: "US", ratingChange: -4 },
  { rank: 6, playerId: "wesley-so", playerName: "Wesley So", title: "GM", rating: 2850, country: "US", ratingChange: 3 },
  { rank: 7, playerId: "maxime-vachier-lagrave", playerName: "Maxime Vachier-Lagrave", title: "GM", rating: 2845, country: "FR", ratingChange: 8 },
  { rank: 8, playerId: "levon-aronian", playerName: "Levon Aronian", title: "GM", rating: 2838, country: "US", ratingChange: -2 },
  { rank: 9, playerId: "ding-liren", playerName: "Ding Liren", title: "GM", rating: 2830, country: "CN", ratingChange: 1 },
  { rank: 10, playerId: "anish-giri", playerName: "Anish Giri", title: "GM", rating: 2825, country: "NL", ratingChange: 5 },
];

// Mock Player Rankings - Chess.com
export const mockChessComRankings = [
  { rank: 1, playerId: "hikaru-nakamura", playerName: "Hikaru Nakamura", title: "GM", rating: 3265, country: "US", ratingChange: 12 },
  { rank: 2, playerId: "magnus-carlsen", playerName: "Magnus Carlsen", title: "GM", rating: 3210, country: "NO", ratingChange: -5 },
  { rank: 3, playerId: "alireza-firouzja", playerName: "Alireza Firouzja", title: "GM", rating: 3195, country: "FR", ratingChange: 8 },
  { rank: 4, playerId: "fabiano-caruana", playerName: "Fabiano Caruana", title: "GM", rating: 3150, country: "US", ratingChange: 3 },
  { rank: 5, playerId: "daniel-naroditsky", playerName: "Daniel Naroditsky", title: "GM", rating: 3142, country: "US", ratingChange: 15 },
  { rank: 6, playerId: "wesley-so", playerName: "Wesley So", title: "GM", rating: 3140, country: "US", ratingChange: -2 },
  { rank: 7, playerId: "levon-aronian", playerName: "Levon Aronian", title: "GM", rating: 3120, country: "US", ratingChange: 0 },
  { rank: 8, playerId: "anish-giri", playerName: "Anish Giri", title: "GM", rating: 3110, country: "NL", ratingChange: 5 },
  { rank: 9, playerId: "ian-nepomniachtchi", playerName: "Ian Nepomniachtchi", title: "GM", rating: 3105, country: "RU", ratingChange: -7 },
  { rank: 10, playerId: "ding-liren", playerName: "Ding Liren", title: "GM", rating: 3095, country: "CN", ratingChange: 4 },
];

// Mock Player Rankings - Lichess
export const mockLichessRankings = [
  { rank: 1, playerId: "magnus-carlsen", playerName: "Magnus Carlsen", title: "GM", rating: 3201, country: "NO", ratingChange: 10 },
  { rank: 2, playerId: "alireza-firouzja", playerName: "Alireza Firouzja", title: "GM", rating: 3185, country: "FR", ratingChange: 22 },
  { rank: 3, playerId: "hikaru-nakamura", playerName: "Hikaru Nakamura", title: "GM", rating: 3175, country: "US", ratingChange: 5 },
  { rank: 4, playerId: "daniel-naroditsky", playerName: "Daniel Naroditsky", title: "GM", rating: 3158, country: "US", ratingChange: 18 },
  { rank: 5, playerId: "fabiano-caruana", playerName: "Fabiano Caruana", title: "GM", rating: 3140, country: "US", ratingChange: 3 },
  { rank: 6, playerId: "wesley-so", playerName: "Wesley So", title: "GM", rating: 3125, country: "US", ratingChange: -5 },
  { rank: 7, playerId: "ian-nepomniachtchi", playerName: "Ian Nepomniachtchi", title: "GM", rating: 3110, country: "RU", ratingChange: 8 },
  { rank: 8, playerId: "anish-giri", playerName: "Anish Giri", title: "GM", rating: 3095, country: "NL", ratingChange: 2 },
  { rank: 9, playerId: "maxime-vachier-lagrave", playerName: "Maxime Vachier-Lagrave", title: "GM", rating: 3088, country: "FR", ratingChange: 12 },
  { rank: 10, playerId: "levon-aronian", playerName: "Levon Aronian", title: "GM", rating: 3075, country: "US", ratingChange: -3 },
];

// Legacy export for backwards compatibility
export const mockPlayerRankings = mockFideClassicalRankings;

// Mock Top Performers
export const mockTopPerformers = [
  {
    playerId: "alireza-firouzja",
    playerName: "Alireza Firouzja",
    title: "GM",
    achievement: "Won 3 consecutive tournaments",
    stat: "+127 rating points",
    trend: "hot" as const,
  },
  {
    playerId: "daniel-naroditsky",
    playerName: "Daniel Naroditsky",
    title: "GM",
    achievement: "15-game winning streak",
    stat: "100% win rate",
    trend: "hot" as const,
  },
  {
    playerId: "hikaru-nakamura",
    playerName: "Hikaru Nakamura",
    title: "GM",
    achievement: "Speed Chess Championship winner",
    stat: "+85 rating points",
    trend: "up" as const,
  },
  {
    playerId: "praggnanandhaa-r",
    playerName: "Praggnanandhaa R",
    title: "GM",
    achievement: "Youngest to reach 2750 rapid",
    stat: "Rising star",
    trend: "new" as const,
  },
  {
    playerId: "magnus-carlsen",
    playerName: "Magnus Carlsen",
    title: "GM",
    achievement: "Defending world rapid champion",
    stat: "12 wins in a row",
    trend: "up" as const,
  },
];

// Mock Player Profiles
export interface PlayerProfile {
  id: string;
  name: string;
  title: string;
  country: string;
  countryName: string;
  avatar: string | null;
  ratings: {
    fide: {
      classical: number;
      rapid: number;
      blitz: number;
    };
    chesscom: {
      bullet: number;
      blitz: number;
      rapid: number;
      daily: number;
    };
    lichess: {
      bullet: number;
      blitz: number;
      rapid: number;
      classical: number;
    };
  };
  bio: string;
  stats: {
    tournamentsPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    winRate: number;
    averagePlacement: number;
    bestPerformance: number;
  };
}

export interface PlayerPlacement {
  tournamentId: string;
  tournament: string;
  date: string;
  placement: number;
  prize: number;
}

export const mockPlayerProfiles: Record<string, PlayerProfile> = {
  "hikaru-nakamura": {
    id: "hikaru-nakamura",
    name: "Hikaru Nakamura",
    title: "GM",
    country: "US",
    countryName: "United States",
    avatar: null,
    ratings: {
      fide: {
        classical: 2802,
        rapid: 2847,
        blitz: 2925,
      },
      chesscom: {
        bullet: 3289,
        blitz: 3265,
        rapid: 3198,
        daily: 2956,
      },
      lichess: {
        bullet: 3012,
        blitz: 2967,
        rapid: 2934,
        classical: 2856,
      },
    },
    bio: "International chess grandmaster, five-time United States Chess Champion, and content creator",
    stats: {
      tournamentsPlayed: 156,
      wins: 892,
      draws: 214,
      losses: 196,
      winRate: 68.4,
      averagePlacement: 4.2,
      bestPerformance: 3012,
    },
  },
  "magnus-carlsen": {
    id: "magnus-carlsen",
    name: "Magnus Carlsen",
    title: "GM",
    country: "NO",
    countryName: "Norway",
    avatar: null,
    ratings: {
      fide: {
        classical: 2831,
        rapid: 2856,
        blitz: 2942,
      },
      chesscom: {
        bullet: 3245,
        blitz: 3210,
        rapid: 3167,
        daily: 2923,
      },
      lichess: {
        bullet: 3078,
        blitz: 3201,
        rapid: 3145,
        classical: 2998,
      },
    },
    bio: "Five-time World Chess Champion and highest-rated player in chess history",
    stats: {
      tournamentsPlayed: 203,
      wins: 1245,
      draws: 387,
      losses: 142,
      winRate: 70.2,
      averagePlacement: 2.8,
      bestPerformance: 2900,
    },
  },
  "alireza-firouzja": {
    id: "alireza-firouzja",
    name: "Alireza Firouzja",
    title: "GM",
    country: "FR",
    countryName: "France",
    avatar: null,
    ratings: {
      fide: {
        classical: 2785,
        rapid: 2815,
        blitz: 2898,
      },
      chesscom: {
        bullet: 3178,
        blitz: 3195,
        rapid: 3142,
        daily: 2887,
      },
      lichess: {
        bullet: 2989,
        blitz: 3185,
        rapid: 3098,
        classical: 2945,
      },
    },
    bio: "Iranian-French grandmaster and youngest player to break 2800 FIDE rating",
    stats: {
      tournamentsPlayed: 98,
      wins: 623,
      draws: 156,
      losses: 89,
      winRate: 71.8,
      averagePlacement: 3.5,
      bestPerformance: 2975,
    },
  },
  "fabiano-caruana": {
    id: "fabiano-caruana",
    name: "Fabiano Caruana",
    title: "GM",
    country: "US",
    countryName: "United States",
    avatar: null,
    ratings: {
      fide: {
        classical: 2795,
        rapid: 2822,
        blitz: 2865,
      },
      chesscom: {
        bullet: 3089,
        blitz: 3150,
        rapid: 3112,
        daily: 2934,
      },
      lichess: {
        bullet: 2912,
        blitz: 3140,
        rapid: 3067,
        classical: 2978,
      },
    },
    bio: "American-Italian grandmaster and 2018 World Championship challenger",
    stats: {
      tournamentsPlayed: 178,
      wins: 967,
      draws: 298,
      losses: 134,
      winRate: 69.2,
      averagePlacement: 3.9,
      bestPerformance: 2950,
    },
  },
};

export const mockPlayerPlacements: Record<string, PlayerPlacement[]> = {
  "hikaru-nakamura": [
    { tournamentId: "titled-tuesday-oct-29", tournament: "Titled Tuesday Late", date: "Oct 29, 2024", placement: 1, prize: 1000 },
    { tournamentId: "speed-chess-championship-2024", tournament: "Speed Chess Championship", date: "Oct 22, 2024", placement: 2, prize: 7500 },
    { tournamentId: "titled-tuesday-oct-29", tournament: "Titled Tuesday Early", date: "Oct 22, 2024", placement: 3, prize: 400 },
    { tournamentId: "pro-chess-league-week-5", tournament: "Champions Tour Finals", date: "Oct 15, 2024", placement: 2, prize: 50000 },
    { tournamentId: "titled-tuesday-oct-29", tournament: "Titled Tuesday Late", date: "Oct 8, 2024", placement: 1, prize: 1000 },
  ],
  "magnus-carlsen": [
    { tournamentId: "world-rapid-2024", tournament: "World Rapid Championship", date: "Oct 29, 2024", placement: 1, prize: 60000 },
    { tournamentId: "titled-tuesday-oct-29", tournament: "Titled Tuesday Late", date: "Oct 22, 2024", placement: 2, prize: 750 },
    { tournamentId: "pro-chess-league-week-5", tournament: "Champions Tour Finals", date: "Oct 15, 2024", placement: 1, prize: 100000 },
    { tournamentId: "speed-chess-championship-2024", tournament: "Speed Chess Championship", date: "Oct 8, 2024", placement: 3, prize: 5000 },
    { tournamentId: "fide-grand-swiss-2024", tournament: "FIDE Grand Swiss", date: "Oct 1, 2024", placement: 2, prize: 80000 },
  ],
  "alireza-firouzja": [
    { tournamentId: "speed-chess-championship-2024", tournament: "Speed Chess Championship", date: "Oct 29, 2024", placement: 1, prize: 15000 },
    { tournamentId: "titled-tuesday-oct-29", tournament: "Titled Tuesday Early", date: "Oct 22, 2024", placement: 1, prize: 1000 },
    { tournamentId: "fide-grand-swiss-2024", tournament: "FIDE Grand Swiss", date: "Oct 15, 2024", placement: 3, prize: 40000 },
    { tournamentId: "titled-tuesday-oct-29", tournament: "Titled Tuesday Late", date: "Oct 8, 2024", placement: 2, prize: 750 },
    { tournamentId: "pro-chess-league-week-5", tournament: "Champions Tour Qualifier", date: "Oct 1, 2024", placement: 1, prize: 5000 },
  ],
  "fabiano-caruana": [
    { tournamentId: "fide-grand-swiss-2024", tournament: "FIDE Grand Swiss", date: "Oct 28, 2024", placement: 1, prize: 120000 },
    { tournamentId: "titled-tuesday-oct-29", tournament: "Titled Tuesday Late", date: "Oct 22, 2024", placement: 4, prize: 300 },
    { tournamentId: "pro-chess-league-week-5", tournament: "US Championship", date: "Oct 15, 2024", placement: 2, prize: 25000 },
    { tournamentId: "speed-chess-championship-2024", tournament: "Speed Chess Championship", date: "Oct 8, 2024", placement: 5, prize: 2000 },
    { tournamentId: "titled-tuesday-oct-29", tournament: "Titled Tuesday Early", date: "Oct 1, 2024", placement: 3, prize: 400 },
  ],
};

export function getTournamentById(id: string): Tournament | undefined {
  return mockTournaments.find((t) => t.id === id);
}

export function getStandingsForTournament(tournamentId: string): TournamentStanding[] {
  // In a real app, this would fetch from API based on tournament ID
  return mockStandings;
}

export function getPlayerByName(name: string): PlayerProfile | undefined {
  return mockPlayerProfiles[name];
}

export function getPlayerPlacements(name: string): PlayerPlacement[] {
  return mockPlayerPlacements[name] || [];
}

export function getForumPostById(id: string) {
  return mockForumPosts.find((post) => post.id === id);
}

export function getCommentsForPost(postId: string): ForumComment[] {
  return mockForumComments[postId] || [];
}

export function getRelatedForumPosts(currentPostId: string, category?: string, limit: number = 5) {
  return mockForumPosts
    .filter((post) => post.id !== currentPostId && (!category || post.category === category))
    .slice(0, limit);
}
