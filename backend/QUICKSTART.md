# Quick Start Guide - Proof of Concept

Get the backend running and test the FIDE API integration in under 5 minutes.

## Prerequisites

- Node.js 20+
- Docker & Docker Compose (for PostgreSQL & Redis)

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

## Step 2: Start Database Services

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify they're running
docker-compose ps
```

## Step 3: Set Up Environment

```bash
# Copy environment variables
cp .env.example .env

# The defaults should work for local development!
```

## Step 4: Start the Server

```bash
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:4000
Environment: development
```

## Step 5: Test the API

Open your browser or use curl:

```bash
# Health check
curl http://localhost:4000/health

# Get top FIDE players
curl http://localhost:4000/api/players/top

# Get Magnus Carlsen's info (FIDE ID: 1503014)
curl http://localhost:4000/api/players/fide/1503014

# Get Magnus's rating history
curl http://localhost:4000/api/players/fide/1503014/history
```

## Step 6: Connect Frontend

In your frontend `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

Then update a frontend component to call the backend:

```typescript
// Example: Test in any React component
const testBackend = async () => {
  const response = await fetch('http://localhost:4000/api/players/top');
  const data = await response.json();
  console.log('Top FIDE players:', data);
};
```

## 🎉 Success!

If you can see the top FIDE players, you have:
- ✅ Backend server running
- ✅ FIDE API integration working
- ✅ Frontend → Backend communication working
- ✅ End-to-end data flow verified

## Next Steps

See [DATA_REQUIREMENTS.md](./DATA_REQUIREMENTS.md) for the full roadmap.

**Immediate next tasks:**
1. Add Prisma and create database schema
2. Build Lichess service
3. Build Chess.com service
4. Import Titled Tuesday historical data

## Troubleshooting

**Port already in use:**
```bash
# Change PORT in .env
PORT=4001
```

**Docker containers not starting:**
```bash
# Check what's using the ports
lsof -i :5432
lsof -i :6379

# Force recreate containers
docker-compose down
docker-compose up -d --force-recreate
```

**FIDE API not responding:**
- The community-built FIDE API at `fide-api.vercel.app` should be working
- If it's down, we'll need to self-host (Docker image available)
- Check status: `curl https://fide-api.vercel.app/top`

## Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/players/top` | Top FIDE players |
| GET | `/api/players/fide/:id` | Player info by FIDE ID |
| GET | `/api/players/fide/:id/history` | Player rating history |

More endpoints coming soon as we build out the other services!
