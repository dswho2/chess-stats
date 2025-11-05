# Quick Start Guide - Frontend & Backend Integration

## Prerequisites

- Node.js 20+ installed
- Two terminal windows

## Step 1: Start the Backend

```bash
# Terminal 1
cd backend
npm install  # If not already done
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:4000
Environment: development
```

## Step 2: Start the Frontend

```bash
# Terminal 2
cd frontend
npm install  # If not already done
npm run dev
```

You should see:
```
▲ Next.js 16.0.1
- Local:        http://localhost:3000
```

## Step 3: Test the Integration

Open your browser and visit:

1. **API Integration Demo**: http://localhost:3000/stats
   - Shows real Lichess tournaments and top players
   - Demonstrates loading states and error handling
   - Uses actual data from backend API

2. **Check API is Working**:
   - Open browser DevTools (F12)
   - Go to Network tab
   - Refresh the page
   - Look for requests to `localhost:4000/api/...`
   - Check response headers for `X-Cache: HIT` or `X-Cache: MISS`

3. **Test API Directly**:
   - Visit: http://localhost:4000/api/tournaments
   - You should see JSON data with current Lichess tournaments

   - Visit: http://localhost:4000/api/players/lichess/top/blitz
   - You should see JSON data with top Lichess blitz players

## Common Issues & Solutions

### Backend won't start?
- Check if port 4000 is already in use
- Make sure you're in the `backend` directory
- Run `npm install` first

### Frontend won't start?
- Check if port 3000 is already in use
- Make sure you're in the `frontend` directory
- Run `npm install` first

### API calls failing?
- Make sure backend is running on port 4000
- Check `frontend/.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:4000/api`
- Check browser console for CORS errors

### CORS errors?
- Backend should have CORS enabled by default
- Check `backend/src/index.ts` has `app.use(cors())`

## What You Should See

### On /stats page:

**Current Tournaments Section**:
- Real tournaments from Lichess (ongoing, upcoming, finished)
- Each shows tournament name, format, player count
- "LIVE" badge for ongoing tournaments

**Top Lichess Players Section**:
- Selectable performance type (Bullet, Blitz, Rapid, Classical)
- Table showing rank, player name, rating, progress
- Titled players show GM/IM/etc badges
- Online players show green dot

**About This Page Section**:
- Explanation of the integration
- Information about caching strategy
- Note about future infrastructure

## Cache Behavior

### First Request (Cache Miss)
1. Frontend makes request
2. Backend checks cache → Not found
3. Backend fetches from Lichess API
4. Backend stores in cache
5. Backend returns data (X-Cache: MISS)
6. Frontend displays data

### Subsequent Requests (Cache Hit)
1. Frontend makes request
2. Backend checks cache → Found!
3. Backend returns cached data (X-Cache: HIT)
4. Frontend displays data
5. Much faster! (<10ms vs 500ms+)

### Cache Expiry
- Live tournaments: 5 minutes
- Top players: 30 minutes
- After expiry, data is refreshed automatically on next request

## Next Steps

1. **Explore the Code**:
   - Look at `frontend/lib/hooks/useTournaments.ts` to see how hooks work
   - Look at `backend/src/middleware/cache.ts` to see caching logic
   - Look at `frontend/app/stats/page.tsx` to see usage example

2. **Try Modifying**:
   - Change cache TTL in `backend/src/services/cache.service.ts`
   - Add more fields to the stats page
   - Create your own hook for different data

3. **Read Documentation**:
   - `frontend/lib/api/README.md` - Detailed API integration guide
   - `INTEGRATION_SUMMARY.md` - Complete architecture overview
   - `backend/ARCHITECTURE.md` - Backend architecture details

## Development Workflow

### Making Changes to Backend:
1. Edit files in `backend/src/`
2. Server auto-restarts (nodemon)
3. Refresh browser to see changes

### Making Changes to Frontend:
1. Edit files in `frontend/app/` or `frontend/lib/`
2. Hot reload happens automatically
3. See changes instantly in browser

### Adding New API Endpoints:
1. Add route in `backend/src/routes/`
2. Add cache middleware
3. Add type definition in `frontend/lib/api/types.ts`
4. Add function in `frontend/lib/api/client.ts`
5. Add hook in `frontend/lib/hooks/`
6. Use in your page!

## Troubleshooting

### "Network Error" in frontend?
```bash
# Check backend is running:
curl http://localhost:4000/api/tournaments

# Should return JSON data
```

### TypeScript errors?
```bash
# Rebuild TypeScript:
cd frontend
npm run build

# Or check for errors:
npx tsc --noEmit
```

### Cache not working?
```bash
# Check cache stats (add this endpoint to backend):
curl http://localhost:4000/health
```

## Environment Variables

### Backend (.env)
```env
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=300000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Success! ✅

If you can see real tournament and player data on the `/stats` page, the integration is working correctly!

## Need Help?

1. Check the browser console for errors
2. Check backend logs in terminal
3. Review `INTEGRATION_SUMMARY.md` for architecture details
4. Check `frontend/lib/api/README.md` for API usage examples
