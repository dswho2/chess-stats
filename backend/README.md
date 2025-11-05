# Chess Stats Backend

Backend API for the Chess Stats Platform - aggregating tournament data from Chess.com, Lichess, and FIDE.

## Quick Start

```bash
# Install dependencies
npm install

# Start PostgreSQL and Redis
docker-compose up -d

# Copy environment variables
cp .env.example .env

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run dev
```

Server will be running at `http://localhost:4000`

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

## Project Structure

See [CLAUDE.md](./CLAUDE.md) for comprehensive documentation.

## API Documentation

Base URL: `http://localhost:4000/api`

### Endpoints

- `GET /api/tournaments` - List tournaments
- `GET /api/tournaments/:id` - Get tournament details
- `GET /api/players` - List players
- `GET /api/players/:id` - Get player profile
- `GET /api/rankings/:type` - Get rankings

See CLAUDE.md for complete API reference.

## Environment Variables

See `.env.example` for all available configuration options.

## License

MIT
