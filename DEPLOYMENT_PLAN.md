# Deployment Plan - Vercel + Prisma Postgres

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL (Frontend + Backend)                   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Frontend (Next.js)                                     │    │
│  │  - Deployed as Vercel Project                           │    │
│  │  - Edge Functions                                       │    │
│  │  - Automatic HTTPS                                      │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Backend (Express → Vercel Serverless Functions)        │    │
│  │  - Convert to Vercel Serverless                         │    │
│  │  - API routes at /api/*                                 │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                ┌────────────┴─────────────┐
                │                          │
                ▼                          ▼
    ┌──────────────────────┐   ┌──────────────────────┐
    │  Vercel KV (Redis)   │   │  Prisma Postgres     │
    │  - Cache layer        │   │  - Primary database  │
    │  - Session storage    │   │  - Vercel-hosted     │
    │  - Rate limiting      │   │  - Automatic backups │
    └──────────────────────┘   └──────────────────────┘
                             │
                             ▼
                ┌──────────────────────┐
                │  External APIs       │
                │  - Lichess           │
                │  - FIDE              │
                │  - Chess.com         │
                └──────────────────────┘
```

## Deployment Strategy

### Phase 1: Current (Development)
- Frontend: Local development server
- Backend: Local Express server
- Cache: In-memory
- Database: None (direct API passthrough)

### Phase 2: Vercel Deployment
- Frontend: Vercel (automatic from Git push)
- Backend: Vercel Serverless Functions
- Cache: Vercel KV (Redis)
- Database: Prisma Postgres (Vercel)

### Phase 3: Production Optimization
- Background jobs: Vercel Cron Jobs
- Database: Prisma Postgres with connection pooling
- Cache: Vercel KV with strategic TTLs
- Monitoring: Vercel Analytics

## Prisma Postgres Benefits

### Why Prisma Postgres on Vercel?

1. **Seamless Integration**
   - Native Vercel integration
   - Automatic connection pooling
   - Built-in query acceleration
   - No cold starts

2. **Developer Experience**
   - Prisma Client for type-safe queries
   - Automatic migrations
   - Database branching for preview deployments
   - Prisma Studio for data management

3. **Performance**
   - Connection pooling out of the box
   - Edge caching via Prisma Accelerate
   - Optimized for serverless
   - Global distribution

4. **Cost Effective**
   - Pay-as-you-go pricing
   - No idle charges
   - Included in Vercel Pro plan
   - Automatic scaling

## Implementation Steps

### Step 1: Set Up Prisma Postgres

```bash
# In backend directory
cd backend

# Install Prisma
npm install prisma @prisma/client @prisma/adapter-pg
npm install -D prisma

# Initialize Prisma
npx prisma init

# This creates:
# - prisma/schema.prisma
# - .env with DATABASE_URL
```

### Step 2: Define Database Schema

Update `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL") // For migrations
}

// Tournament model
model Tournament {
  id               String   @id @default(cuid())
  externalId       String   @unique
  platform         String   // lichess, chess-com, fide
  name             String
  fullName         String
  format           String   // arena, swiss, knockout
  status           String   // upcoming, ongoing, completed
  timeControl      String   // bullet, blitz, rapid, classical

  startDate        DateTime
  endDate          DateTime?

  nbPlayers        Int?
  rounds           Int?

  isFinished       Boolean  @default(false)

  // Rich tournament data
  perf             Json?
  clock            Json?
  schedule         Json?
  stats            Json?
  winner           Json?
  podium           Json?

  // Metadata
  metadata         Json?

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // Relations
  standings        Standing[]
  games            Game[]

  @@index([platform])
  @@index([status])
  @@index([startDate])
  @@index([externalId])
}

// Tournament standings
model Standing {
  id             String     @id @default(cuid())
  tournamentId   String
  tournament     Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)

  playerName     String
  playerTitle    String?
  rank           Int
  score          Float
  rating         Int?
  performance    Int?

  // Stats
  sheet          Json?

  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  @@index([tournamentId])
  @@index([rank])
}

// Games
model Game {
  id             String     @id @default(cuid())
  externalId     String?
  tournamentId   String
  tournament     Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)

  // Players
  whitePlayer    String
  blackPlayer    String

  // Result
  result         String?    // 1-0, 0-1, 1/2-1/2
  winner         String?    // white, black

  // Game details
  opening        Json?
  moves          String?
  clock          Json?

  // Metadata
  metadata       Json?

  createdAt      DateTime   @default(now())

  @@index([tournamentId])
  @@index([externalId])
}

// Player model
model Player {
  id                String   @id @default(cuid())
  username          String   @unique

  // External IDs
  lichessId         String?
  fideId            String?
  chessComId        String?

  // Profile
  title             String?
  fullName          String?
  country           String?

  // Ratings
  lichessPerfs      Json?
  fideRatings       Json?
  chessComRatings   Json?

  // Metadata
  profile           Json?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([lichessId])
  @@index([fideId])
  @@index([username])
}

// Cache metadata (for tracking what's cached)
model CacheMeta {
  id          String   @id @default(cuid())
  key         String   @unique
  type        String   // tournament, player, rankings
  ttl         Int      // milliseconds
  expiresAt   DateTime

  createdAt   DateTime @default(now())

  @@index([key])
  @@index([expiresAt])
}
```

### Step 3: Update Cache Service for Vercel KV

Create `backend/src/services/redis.service.ts`:

```typescript
import { kv } from '@vercel/kv';

export class RedisCacheService {
  /**
   * Get from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await kv.get<T>(key);
      return data;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  /**
   * Set in cache with TTL
   */
  async set<T>(
    key: string,
    value: T,
    ttl: number | null = 300
  ): Promise<void> {
    try {
      if (ttl === null) {
        // Permanent cache
        await kv.set(key, value);
      } else {
        // Cache with expiry (ttl in milliseconds, convert to seconds)
        await kv.setex(key, Math.floor(ttl / 1000), value);
      }
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  /**
   * Delete key
   */
  async delete(key: string): Promise<void> {
    try {
      await kv.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  /**
   * Delete by pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await kv.keys(pattern);
      if (keys.length > 0) {
        await kv.del(...keys);
      }
      return keys.length;
    } catch (error) {
      console.error('Redis delete pattern error:', error);
      return 0;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      await kv.flushdb();
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }
}

// Singleton instance
export const redisCache = new RedisCacheService();
```

### Step 4: Convert Backend to Vercel Serverless

Create `backend/api/index.ts`:

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/index';

// Export the Express app as a Vercel serverless function
export default (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};
```

Create `backend/vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Step 5: Monorepo Setup for Vercel

Update root `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "backend/api/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/backend/api/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ]
}
```

### Step 6: Environment Variables on Vercel

Set these in Vercel Dashboard:

**Frontend:**
```env
NEXT_PUBLIC_API_URL=https://your-app.vercel.app/api
```

**Backend:**
```env
# Prisma Postgres (auto-populated by Vercel)
DATABASE_URL=
DIRECT_DATABASE_URL=

# Vercel KV (auto-populated by Vercel)
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=

# External APIs
FIDE_API_URL=https://fide-api.vercel.app
LICHESS_API_URL=https://lichess.org/api
CHESS_COM_API_URL=https://api.chess.com/pub

# Caching
CACHE_ENABLED=true
NODE_ENV=production
```

### Step 7: Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project (in root directory)
vercel link

# Add Prisma Postgres
vercel integration add prisma-postgres

# Add Vercel KV
vercel integration add kv

# Deploy
vercel --prod
```

## Prisma Migrations

### Development
```bash
# Create migration
npx prisma migrate dev --name init

# Apply migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### Production (Vercel)
```bash
# Add to package.json build script
"build": "prisma generate && prisma migrate deploy && tsc"

# Vercel will run this automatically
```

## Database Seeding

Create `backend/prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed initial data if needed
  console.log('Seeding database...');

  // Example: Create some test tournaments
  await prisma.tournament.createMany({
    data: [
      // Your seed data here
    ],
    skipDuplicates: true,
  });

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

## Vercel Cron Jobs for Background Updates

Create `vercel.json` cron configuration:

```json
{
  "crons": [
    {
      "path": "/api/cron/update-tournaments",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/update-rankings",
      "schedule": "0 * * * *"
    }
  ]
}
```

Create cron endpoints:

```typescript
// backend/api/cron/update-tournaments.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { LichessService } from '../../src/services/lichess.service';

const prisma = new PrismaClient();
const lichess = new LichessService();

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Verify cron secret for security
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Fetch current tournaments
    const tournaments = await lichess.getCurrentTournaments();

    // Update database
    for (const t of tournaments.started) {
      await prisma.tournament.upsert({
        where: { externalId: t.id },
        create: {
          externalId: t.id,
          platform: 'lichess',
          name: t.fullName,
          fullName: t.fullName,
          format: t.system,
          status: 'ongoing',
          timeControl: t.perf.key,
          startDate: new Date(t.startsAt as number),
          nbPlayers: t.nbPlayers,
          isFinished: false,
          metadata: t,
        },
        update: {
          status: 'ongoing',
          nbPlayers: t.nbPlayers,
          metadata: t,
        },
      });
    }

    res.json({ success: true, updated: tournaments.started.length });
  } catch (error) {
    console.error('Cron error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

## Performance Optimization

### 1. Prisma Connection Pooling

```typescript
// backend/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### 2. Edge Caching with Vercel KV

```typescript
// Use Vercel KV for hot data
// Use Prisma Postgres for cold data
// Cache strategy:
// 1. Check Vercel KV
// 2. If miss, check Prisma Postgres
// 3. If miss, fetch from external API
// 4. Store in both KV and Postgres
```

## Cost Estimates

### Vercel Pro Plan ($20/month)
- Unlimited sites
- 100GB bandwidth
- Prisma Postgres included (10GB storage, 10GB transfer)
- Vercel KV included (256MB storage, 3M commands)
- Advanced analytics
- Custom domains

### Additional Costs
- Extra database storage: $0.25/GB/month
- Extra KV storage: $0.30/GB/month
- Extra bandwidth: $0.15/GB

### Expected Monthly Cost
- Small app: $20 (Vercel Pro only)
- Medium app: $25-35 (with some overages)
- Large app: $50-100 (scaling up)

## Monitoring

### Vercel Analytics
- Page views
- Web vitals
- Error tracking
- Function logs

### Prisma Pulse (Optional)
- Real-time database change streams
- $30/month for 10M events

## Summary

Using Vercel + Prisma Postgres gives you:

✅ **Seamless deployment** - Git push to deploy
✅ **Type-safe database** - Prisma Client
✅ **Automatic scaling** - Serverless functions
✅ **Edge caching** - Vercel KV (Redis)
✅ **Background jobs** - Vercel Cron
✅ **Database branching** - Preview deployments
✅ **Cost effective** - Pay as you grow
✅ **Great DX** - Vercel + Prisma together

The architecture I built is already compatible - just need to swap the cache implementation and add Prisma!
