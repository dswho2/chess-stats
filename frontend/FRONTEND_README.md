# Frontend - Chess Stats Platform

Modern Next.js frontend with VLR.gg-inspired dark theme design.

## Tech Stack

- **Framework**: Next.js 16.0.1 (App Router)
- **React**: 19.2.0
- **TypeScript**: 5.x
- **Styling**: Tailwind CSS 4.x
- **Fonts**: Inter (body), JetBrains Mono (stats)
- **Dev Tool**: Turbopack (fast refresh)

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with Header
│   ├── page.tsx           # Homepage
│   └── globals.css        # Global styles + design tokens
├── components/
│   ├── ui/                # Reusable UI components
│   │   ├── Badge.tsx      # Platform/status/format badges
│   │   ├── Button.tsx     # Action buttons
│   │   ├── Card.tsx       # Container cards
│   │   └── index.ts       # Exports
│   └── layout/
│       └── Header.tsx     # Global navigation header
├── lib/
│   └── utils.ts           # Utility functions (cn, formatDate, etc)
├── types/
│   └── index.ts           # TypeScript types/interfaces
└── public/                # Static assets
```

## Design System

### Color Palette (Dark Theme)
- **Backgrounds**: `#0f1419` (primary), `#1a1f24` (secondary), `#252a2f` (tertiary)
- **Text**: `#e8e8e8` (primary), `#9ca3af` (secondary), `#6b7280` (muted)
- **Accents**:
  - Green `#10b981` (primary/wins)
  - Blue `#3b82f6` (secondary/links)
  - Amber `#f59e0b` (warnings/draws)
  - Red `#ef4444` (errors/losses)
- **Platforms**:
  - Chess.com: `#7fa650`
  - Lichess: `#f59e0b`
  - FIDE: `#3b82f6`

### Typography
- **Body**: Inter (system fallback)
- **Monospace**: JetBrains Mono (for stats)
- **Sizes**: 12px to 36px scale

### Spacing
- Base unit: 4px
- Scale: xs (4px), sm (8px), md (16px), lg (24px), xl (32px), 2xl (48px), 3xl (64px)

## Components Built

### UI Components

1. **Badge** ([components/ui/Badge.tsx](components/ui/Badge.tsx))
   - Variants: Platform badges, status badges, format badges
   - Sizes: sm, md, lg
   - Usage: `<Badge variant="chess-com">Chess.com</Badge>`

2. **Button** ([components/ui/Button.tsx](components/ui/Button.tsx))
   - Variants: primary, secondary, outline, ghost
   - Sizes: sm, md, lg
   - Loading state support
   - Usage: `<Button variant="primary" loading>Submit</Button>`

3. **Card** ([components/ui/Card.tsx](components/ui/Card.tsx))
   - Base Card with hover effects
   - CardHeader, CardBody, CardFooter sub-components
   - Usage: `<Card hover><CardBody>Content</CardBody></Card>`

### Layout Components

4. **Header** ([components/layout/Header.tsx](components/layout/Header.tsx))
   - Sticky navigation bar
   - Desktop navigation: Tournaments, Players, Calendar, Stats
   - Mobile hamburger menu
   - Search icon (placeholder)
   - Logo with gradient chess piece

## Utility Functions

Located in [lib/utils.ts](lib/utils.ts):

- `cn()` - Class name merging
- `formatDate()` - Date formatting (short, long, relative)
- `formatDateRange()` - Date range formatting
- `formatCurrency()` - Currency formatting
- `formatNumber()` - Number with commas
- `calculateWinRate()` - Win percentage
- `formatGameRecord()` - W-D-L format
- Platform/format/time control name getters
- `debounce()` - Debounce for search

## TypeScript Types

Located in [types/index.ts](types/index.ts):

- `Tournament`, `TournamentStanding`, `TournamentRound`, `Pairing`
- `Player`, `PlayerStats`, `PlayerTournamentResult`
- `Game`
- UI component prop types
- API response types
- Filter types

All with complete enums for:
- Platform (chess-com, lichess, fide)
- TournamentFormat (swiss, knockout, round-robin, arena)
- TournamentStatus (upcoming, live, completed)
- TimeControl (bullet, blitz, rapid, classical)
- PlayerTitle (GM, IM, FM, etc.)

## Development

### Run Dev Server
```bash
npm run dev
```
Opens at http://localhost:3000 with Turbopack fast refresh

### Build for Production
```bash
npm run build
npm start
```

### Lint
```bash
npm run lint
```

## Best Practices Implemented

✅ **Performance**:
- Next.js App Router for optimal server-side rendering
- Turbopack for fast development
- Font optimization with `display: swap`
- Modular components for code splitting

✅ **Accessibility**:
- Semantic HTML
- ARIA labels
- Keyboard navigation support
- Focus indicators
- Screen reader friendly

✅ **Code Quality**:
- TypeScript strict mode
- Modular component structure
- Reusable utilities
- Clear naming conventions
- Comprehensive comments

✅ **Responsive Design**:
- Mobile-first approach
- Breakpoints: mobile (<640px), tablet (640-1024px), desktop (>1024px)
- Responsive header with hamburger menu

✅ **Maintainability**:
- Centralized design tokens
- Utility-first with Tailwind
- Type-safe with TypeScript
- Clean folder structure

## Next Steps

See [claude.md](claude.md) for complete implementation roadmap including:
- Tournament browser page
- Tournament detail pages (Swiss & Knockout)
- Player profile pages
- Advanced features (search, filters, data tables)
- Backend integration

## Design Reference

Based on [VLR.gg](https://www.vlr.gg/) - dark theme, clean data presentation, esports aesthetic
