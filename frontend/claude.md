# Frontend Implementation Guide - Chess Stats Platform

A modern, VLR.gg-inspired frontend for chess tournament statistics and player tracking.

## Design Philosophy

**Inspiration**: VLR.gg (Valorant stats site) - clean, data-focused, dark theme
**Goal**: Professional esports aesthetic meets chess statistics
**Priority**: Information clarity, fast navigation, comprehensive stats display

---

## Visual Design System

### Color Scheme (Dark Theme)

```
Primary Background: #0f1419 (very dark blue-gray)
Secondary Background: #1a1f24 (slightly lighter for cards)
Tertiary Background: #252a2f (hover states, inputs)

Text Primary: #e8e8e8 (high contrast white)
Text Secondary: #9ca3af (gray for metadata)
Text Muted: #6b7280 (darker gray for less important info)

Accent Primary: #10b981 (emerald green - for wins, success)
Accent Secondary: #3b82f6 (blue - for links, interactive)
Accent Warning: #f59e0b (amber - for draws, warnings)
Accent Error: #ef4444 (red - for losses, errors)

Border Color: #2d3339 (subtle borders)
Divider Color: #1f2429 (section dividers)
```

### Typography

```
Font Family:
- Primary: 'Inter', system-ui, -apple-system, sans-serif
- Monospace: 'JetBrains Mono', 'Courier New', monospace (for stats)

Font Sizes:
- Heading 1: 2.25rem (36px) - Page titles
- Heading 2: 1.875rem (30px) - Section headers
- Heading 3: 1.5rem (24px) - Subsection headers
- Body Large: 1.125rem (18px) - Important info
- Body: 1rem (16px) - Default text
- Body Small: 0.875rem (14px) - Metadata, captions
- Body Tiny: 0.75rem (12px) - Timestamps, minor info

Font Weights:
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700
```

### Spacing System

```
Base unit: 4px

Scale:
- xs: 4px (0.25rem)
- sm: 8px (0.5rem)
- md: 16px (1rem)
- lg: 24px (1.5rem)
- xl: 32px (2rem)
- 2xl: 48px (3rem)
- 3xl: 64px (4rem)

Container max-width: 1280px (80rem)
Content padding: 16px mobile, 24px desktop
```

### Component Patterns

**Cards**: Rounded corners (6-8px), subtle borders, hover state with slight elevation
**Buttons**: Rounded (6px), clear hover/active states, consistent padding
**Tables**: Alternating row colors, sticky headers, sortable columns
**Badges**: Small rounded pills for platforms, formats, status

---

## Page Layouts & Components

### Global Header (Navbar)

```
┌─────────────────────────────────────────────────────────┐
│ [Logo] Tournaments  Players  Calendar  Stats   [Search] │
└─────────────────────────────────────────────────────────┘

Components:
- Logo: Chess icon + "ChessStats" text (clickable to home)
- Nav items: Hover underline effect
- Search: Expandable search bar (icon -> full input on click)
- Mobile: Hamburger menu
```

**Header Specs:**
- Height: 64px
- Background: Primary background with subtle bottom border
- Position: Sticky top
- Z-index: 50

### Homepage Layout

```
┌─────────────────────────────────────────────────────────┐
│                        HEADER                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Hero Section:                                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Chess Tournament Stats & Analytics              │  │
│  │  [Subtitle explaining the platform]              │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  Featured Tournaments:                                   │
│  ┌──────┐  ┌──────┐  ┌──────┐                         │
│  │ TT   │  │ CCT  │  │ FIDE │  (Tournament cards)     │
│  └──────┘  └──────┘  └──────┘                         │
│                                                          │
│  Upcoming Tournaments:                                   │
│  ┌────────────────────────────────────────────────┐    │
│  │ Nov 5  │ Titled Tuesday Late   │ 500+ players │    │
│  │ Nov 6  │ Champions Tour Finals │ 16 players   │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Recent Results:                                         │
│  ┌────────────────────────────────────────────────┐    │
│  │ Oct 29 │ Titled Tuesday      │ Winner: Hikaru │    │
│  │ Oct 27 │ Lichess Titled Arena│ Winner: Danya  │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Top Players (by recent performance):                    │
│  ┌────────────────────────────────────────────────┐    │
│  │ 1. Hikaru Nakamura    2900 │ Won TT Oct 29    │    │
│  │ 2. Magnus Carlsen     2910 │ 2nd CCT Finals   │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Homepage Components:**

1. **Hero Section**
   - Large heading: "Chess Tournament Stats & Analytics"
   - Subtitle: "Track tournaments, analyze players, explore chess esports"
   - Background: Subtle gradient or chess pattern
   - Height: ~200-300px

2. **Tournament Card** (Featured)
   - Platform badge (Chess.com, Lichess, FIDE)
   - Tournament name
   - Date range
   - Prize pool (if applicable)
   - Participant count
   - Status badge (Upcoming, Live, Completed)
   - Hover effect: Slight scale + shadow

3. **Upcoming Tournaments List**
   - Table-like layout
   - Columns: Date | Tournament Name | Info
   - Sortable by date
   - Max 10 items, "View All" link

4. **Recent Results List**
   - Similar to upcoming tournaments
   - Shows winner/top placement
   - Link to full results

### Tournament Browser Page (`/tournaments`)

```
┌─────────────────────────────────────────────────────────┐
│                        HEADER                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Tournaments                                [Search]     │
│                                                          │
│  Filters:  [Platform ▼] [Format ▼] [Date ▼] [Status ▼] │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Oct 29, 2024                                      │  │
│  │ Titled Tuesday Late                    [Chess.com]│  │
│  │ Swiss • Blitz • 523 players • $1,600 prize       │  │
│  │ Status: Completed                                 │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Oct 27-29, 2024                                   │  │
│  │ Champions Chess Tour Finals             [CCT]     │  │
│  │ Knockout • Rapid • 16 players • $300K prize      │  │
│  │ Status: Completed                                 │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  [Pagination: ← 1 2 3 ... 10 →]                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Filter Components:**
- Multi-select dropdowns
- Platform: Chess.com, Lichess, FIDE, All
- Format: Swiss, Knockout, Round-robin, All
- Date: Date range picker
- Status: Upcoming, Live, Completed, All

**Tournament Card (List view):**
- Date badge (left side)
- Tournament name (large, bold)
- Platform badge (right side, pill shape)
- Metadata row: Format • Time control • Players • Prize
- Status badge with color coding
- Entire card clickable
- Hover: Background color change

### Tournament Detail Page (Swiss) (`/tournaments/[id]`)

```
┌─────────────────────────────────────────────────────────┐
│                        HEADER                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ← Back to Tournaments                                   │
│                                                          │
│  Titled Tuesday Late - Oct 29, 2024      [Chess.com]    │
│  Swiss • Blitz (3+0) • 11 Rounds                        │
│  Prize: $1,600 • Players: 523                           │
│  Status: Completed • Last Updated: 2h ago               │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  [Overview] [Standings] [Rounds] [Pairings] [Stats]     │
│                                                          │
│  ╔═══════════════════════════════════════════════════╗  │
│  ║ STANDINGS                           [Search: __]  ║  │
│  ╠═══════════════════════════════════════════════════╣  │
│  ║ # │ Player            │ Pts │ Buch │ W│D│L │ PR  ║  │
│  ║───┼───────────────────┼─────┼──────┼──────┼─────║  │
│  ║ 1 │ Hikaru Nakamura  │ 10  │ 84.5 │10│0│1│2950║  │
│  ║ 2 │ Magnus Carlsen   │ 9.5 │ 83.0 │ 9│1│1│2920║  │
│  ║ 3 │ Alireza Firouzja │ 9.5 │ 82.5 │ 9│1│1│2915║  │
│  ║...│ ...              │ ... │ ...  │ ... │ ... ║  │
│  ╚═══════════════════════════════════════════════════╝  │
│                                                          │
│  [Show more results]                                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Tournament Header:**
- Breadcrumb navigation
- Tournament name (H1)
- Platform badge
- Metadata row (format, time control, rounds)
- Prize and player count
- Status indicator with timestamp

**Tab Navigation:**
- Overview: Tournament info, winner, highlights
- Standings: Full standings table
- Rounds: Round-by-round pairings and results
- Pairings: Matrix view of who played whom
- Stats: Opening trends, upsets, performance stats

**Standings Table:**
- Fixed header when scrolling
- Sortable columns (click header to sort)
- Columns: Rank, Player Name, Points, Buchholz, W-D-L, Performance Rating
- Player names clickable (link to profile)
- Search/filter box
- Alternating row colors
- Highlight top 3 with subtle background color
- Mobile: Horizontal scroll or simplified columns

### Tournament Detail Page (Knockout) (`/tournaments/[id]`)

```
┌─────────────────────────────────────────────────────────┐
│                        HEADER                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Champions Chess Tour Finals - Oct 2024    [CCT]        │
│  Knockout • Rapid • $300,000 Prize                      │
│                                                          │
│  [Overview] [Bracket] [Matches] [Stats]                 │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │                    BRACKET                          │ │
│  │                                                     │ │
│  │  Round of 16    Quarterfinals  Semifinals  Final   │ │
│  │  ┌─────────┐                                       │ │
│  │  │Carlsen  ├──┐                                    │ │
│  │  │3        │  │ ┌─────────┐                        │ │
│  │  │Naka     │  └─┤Carlsen  ├──┐                     │ │
│  │  │1        │    │3        │  │  ┌─────────┐        │ │
│  │  │         │    │         │  └──┤Carlsen  ├─┐      │ │
│  │  │Fabi     ├──┐ │         │     │3        │ │      │ │
│  │  │2        │  │ ┌─────────┐     │         │ │ Final│ │
│  │  │Aronian  │  └─┤Fabi     ├──┐  │         │ │      │ │
│  │  │3        │    │1        │  │  └─────────┘ │      │ │
│  │  │         │    │         │  │              │Winner│ │
│  │  ...continues...                            │      │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Bracket Visualization:**
- SVG or Canvas-based bracket
- Responsive (horizontal scroll on mobile)
- Each match shows: Player names + score
- Click match to see details popup
- Winner's path highlighted
- Visual distinction for completed vs upcoming matches

### Player Profile Page (`/players/[id]`)

```
┌─────────────────────────────────────────────────────────┐
│                        HEADER                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ← Back to Players                                       │
│                                                          │
│  ┌─────┐  Hikaru Nakamura (GM)  🇺🇸                     │
│  │ IMG │  hikaru                                         │
│  └─────┘                                                 │
│          FIDE: 2802 • Chess.com: 3265 • Lichess: 2967   │
│                                                          │
│          [Chess.com] [Lichess] [FIDE Profile]           │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  [Overview] [Tournaments] [Stats] [Head-to-Head]        │
│                                                          │
│  Career Stats:                                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Tournaments Played: 156                           │  │
│  │ Win Rate: 68.4% (W-D-L: 892-214-196)            │  │
│  │ Average Placement: 4.2                            │  │
│  │ Best Performance Rating: 3012 (TT May 2024)      │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  Recent Tournaments:                                     │
│  ╔═══════════════════════════════════════════════════╗  │
│  ║ Date     │ Tournament          │ Rank │ Score    ║  │
│  ╠═══════════════════════════════════════════════════╣  │
│  ║ Oct 29   │ Titled Tuesday Late │  1st │ 10/11    ║  │
│  ║ Oct 22   │ Titled Tuesday Late │  3rd │ 9.5/11   ║  │
│  ║ Oct 15   │ Speed Chess Champ   │  2nd │ 18.5-17.5║  │
│  ╚═══════════════════════════════════════════════════╝  │
│                                                          │
│  [View All Tournaments]                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Player Header:**
- Profile picture (or chess piece icon placeholder)
- Full name + title (GM, IM, etc.) + country flag
- Username/handle
- Ratings from all platforms (large, prominent)
- Links to external profiles

**Tabs:**
- Overview: Quick stats, recent tournaments
- Tournaments: Full tournament history table (paginated)
- Stats: Advanced analytics (Phase 2)
- Head-to-Head: Search for opponent, compare records

**Career Stats Card:**
- Box with key metrics
- Visual hierarchy: Most important stats larger
- Numbers in monospace font

**Recent Tournaments Table:**
- Last 10 tournaments
- Tournament names clickable
- Show rank and score
- Color coding for placement (1st = gold accent)

### Players List Page (`/players`)

```
┌─────────────────────────────────────────────────────────┐
│                        HEADER                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Players                                    [Search: __] │
│                                                          │
│  Filters: [Title ▼] [Country ▼] [Platform ▼]           │
│                                                          │
│  ╔═══════════════════════════════════════════════════╗  │
│  ║ Player              │ Title │ Rating │ Recent     ║  │
│  ╠═══════════════════════════════════════════════════╣  │
│  ║ Magnus Carlsen 🇳🇴  │  GM   │ 2910   │ CCT Finals ║  │
│  ║ Hikaru Nakamura 🇺🇸 │  GM   │ 2802   │ TT Winner  ║  │
│  ║ Fabiano Caruana 🇺🇸 │  GM   │ 2795   │ FIDE 2024  ║  │
│  ║ ...                 │  ...  │  ...   │ ...        ║  │
│  ╚═══════════════════════════════════════════════════╝  │
│                                                          │
│  [Pagination: ← 1 2 3 ... 10 →]                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Search:**
- Real-time search as you type
- Searches name, username, title

**Filters:**
- Title: GM, IM, FM, WGM, etc.
- Country: Dropdown with flags
- Platform: Filter by where they're active

---

## Component Library

### 1. Badge Component

```tsx
// Platform badges
<Badge variant="chess-com">Chess.com</Badge>
<Badge variant="lichess">Lichess</Badge>
<Badge variant="fide">FIDE</Badge>

// Status badges
<Badge variant="live">Live</Badge>
<Badge variant="completed">Completed</Badge>
<Badge variant="upcoming">Upcoming</Badge>

// Format badges
<Badge variant="swiss">Swiss</Badge>
<Badge variant="knockout">Knockout</Badge>

// Styles:
- Small rounded pill
- Padding: 4px 12px
- Font size: 12px
- Bold font weight
- Platform colors: Chess.com (green), Lichess (orange), FIDE (blue)
- Status colors: Live (red), Completed (gray), Upcoming (blue)
```

### 2. Tournament Card Component

```tsx
<TournamentCard
  name="Titled Tuesday Late"
  platform="chess-com"
  date="Oct 29, 2024"
  format="Swiss"
  timeControl="Blitz (3+0)"
  players={523}
  prize="$1,600"
  status="completed"
/>

// Visual:
- Card with hover effect
- Date badge on left
- Platform badge on right
- Bold tournament name
- Metadata row with icons
- Status at bottom
```

### 3. Data Table Component

```tsx
<DataTable
  columns={[
    { key: 'rank', label: '#', sortable: false },
    { key: 'player', label: 'Player', sortable: true },
    { key: 'score', label: 'Points', sortable: true },
    { key: 'buchholz', label: 'Buchholz', sortable: true },
  ]}
  data={standings}
  onSort={handleSort}
  searchable
/>

// Features:
- Sticky header
- Sortable columns (arrow indicators)
- Alternating row colors
- Hover state on rows
- Responsive (scroll on mobile)
- Optional search bar
```

### 4. Player Card Component

```tsx
<PlayerCard
  name="Hikaru Nakamura"
  title="GM"
  country="US"
  ratings={{ fide: 2802, chesscom: 3265, lichess: 2967 }}
  avatar="/avatars/hikaru.jpg"
/>

// Visual:
- Compact card
- Avatar on left
- Name + title + flag
- Ratings displayed clearly
- Hover effect
```

### 5. Tab Navigation Component

```tsx
<Tabs defaultTab="standings">
  <Tab id="overview" label="Overview" />
  <Tab id="standings" label="Standings" />
  <Tab id="rounds" label="Rounds" />
  <Tab id="stats" label="Stats" />
</Tabs>

// Styles:
- Underline active tab
- Smooth transition
- Responsive (scroll on mobile)
```

---

## Responsive Design

### Breakpoints

```
Mobile: < 640px
Tablet: 640px - 1024px
Desktop: > 1024px
```

### Mobile Adaptations

1. **Header**: Hamburger menu, hide text labels
2. **Tables**: Horizontal scroll or card view
3. **Filters**: Collapse into single "Filters" button
4. **Spacing**: Reduce padding/margins
5. **Typography**: Slightly smaller font sizes
6. **Tournament cards**: Stack vertically
7. **Brackets**: Allow horizontal scroll with touch

---

## Interactions & Animations

### Hover Effects
- Cards: Slight scale (1.02) + shadow increase
- Buttons: Background color change
- Links: Underline animation
- Table rows: Background color change

### Loading States
- Skeleton screens for tables and cards
- Spinner for page loads
- Shimmer effect on placeholder content

### Transitions
- Duration: 150-200ms
- Easing: ease-in-out
- Properties: transform, background-color, opacity

---

## Data Display Patterns

### Tournament Status
- **Live**: Red dot + "Live" text
- **Upcoming**: Blue calendar icon + date
- **Completed**: Gray checkmark + "Completed"

### Player Ratings
- Platform icon + rating number
- Color coded by platform
- Tooltip with last updated date

### Win-Draw-Loss Records
- Format: "W-D-L: 10-3-2"
- Green for wins, gray for draws, red for losses
- Win percentage in parentheses

### Timestamps
- Relative: "2h ago", "3d ago", "1w ago"
- Absolute on hover: "Oct 29, 2024 3:45 PM"

### Rankings
- Top 3 highlighted with gold/silver/bronze
- Number signs for others
- Prize money for prize-winning positions

---

## Accessibility

- Semantic HTML (header, nav, main, footer)
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus visible indicators
- Alt text for images/icons
- Color contrast ratio > 4.5:1
- Screen reader friendly tables

---

## Performance Optimizations

- Lazy load images
- Virtual scrolling for large tables
- Code splitting by route
- Optimize bundle size with tree shaking
- Cache API responses
- Use Next.js Image component
- Minimize JavaScript bundle
- Server-side rendering for SEO

---

## Next Steps for Implementation

### Phase 1: Core Components (Start here)
1. Set up Next.js with TypeScript and Tailwind
2. Create color/typography design tokens
3. Build reusable components:
   - Badge
   - Button
   - Card
   - DataTable
4. Implement global header/layout
5. Create homepage with mock data
6. Build tournament list page
7. Create basic tournament detail page (Swiss)
8. Build player profile page

### Phase 2: Advanced Features
9. Add search functionality
10. Implement filters
11. Create bracket visualization for knockout tournaments
12. Add loading states and error handling
13. Make everything responsive
14. Polish animations and interactions

### Phase 3: Integration
15. Connect to backend API
16. Implement real data fetching
17. Add caching with TanStack Query
18. SEO optimization
19. Performance testing and optimization

---

**Design Reference**: VLR.gg (https://www.vlr.gg/)
**Framework**: Next.js 14+ with App Router
**Styling**: Tailwind CSS with custom design tokens
**State**: Zustand (global) + TanStack Query (server state)
