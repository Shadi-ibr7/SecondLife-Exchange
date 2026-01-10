# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SecondLife Exchange is a French marketplace platform for exchanging second-hand items, with AI-powered suggestions via Google Gemini 1.5 Pro and weekly themed exchange prompts. It's a monorepo with pnpm workspaces containing a NestJS backend and Next.js 15 frontend PWA.

## Common Commands

### Development
```bash
# Start database services (PostgreSQL + Redis)
docker compose up -d

# Install dependencies
pnpm install

# Start backend (port 4000)
pnpm -C apps/backend start:dev

# Start frontend (port 3000)
pnpm -C apps/frontend dev
```

### Database (Prisma)
```bash
pnpm -C apps/backend prisma:generate   # Generate Prisma client
pnpm -C apps/backend prisma:migrate dev  # Run migrations
pnpm -C apps/backend prisma:studio     # Visual database browser
pnpm -C apps/backend prisma:seed       # Seed database
pnpm -C apps/backend prisma:reset      # Reset database
```

### Testing
```bash
# Backend tests
pnpm -C apps/backend test              # Unit tests
pnpm -C apps/backend test:e2e          # E2E tests
pnpm -C apps/backend test:cov          # Coverage
pnpm -C apps/backend test:integration  # Integration tests

# Frontend tests
pnpm -C apps/frontend test
```

### Linting & Formatting
```bash
pnpm lint                # Lint all
pnpm format              # Format all with Prettier
pnpm format:check        # Check formatting
pnpm -C apps/frontend typecheck  # TypeScript check frontend
```

### Admin Scripts
```bash
pnpm -C apps/backend admin:create      # Create admin user
pnpm -C apps/backend admin:test        # Test admin login
```

## Architecture

### Monorepo Structure
- `apps/backend/` - NestJS API with Prisma ORM
- `apps/frontend/` - Next.js 15 App Router PWA

### Backend Modules (`apps/backend/src/modules/`)
- `auth/` - JWT authentication with access/refresh tokens
- `users/` - User management
- `items/` - Item CRUD with photos
- `exchanges/` - Exchange workflow (PENDING → ACCEPTED → COMPLETED)
- `chat/` - Real-time WebSocket messaging per exchange
- `ai/` - Gemini 1.5 Pro integration for suggestions
- `suggestions/` - AI-generated weekly item suggestions
- `themes/` - Weekly themed exchange topics
- `matching/` - Item matching logic
- `community/` - Threads and posts
- `notifications/` - Push notification tokens
- `eco/` - Ecological content management
- `admin/` - Admin dashboard operations
- `scheduler/` - Cron jobs for AI suggestions

### Frontend Structure (`apps/frontend/src/`)
- `app/` - Next.js App Router pages
- `app/(admin)/[adminSlug]/` - Admin dashboard routes
- `components/` - React components with shadcn/ui
- `lib/api.ts` - Axios-based API client
- `store/` - Zustand stores (`auth.ts`, `theme.ts`, `notifications.ts`)

### Key Data Models (Prisma)
- **User** - With roles (USER/ADMIN), profile, preferences
- **Item** - Category, condition, status, AI summary/repair tips
- **Exchange** - Status workflow, links requester/responder
- **ChatMessage** - Per-exchange messaging with images
- **WeeklyTheme** - Themed weeks with Unsplash photos
- **SuggestedItem** - AI-generated items per theme

### Tech Stack
- **Frontend**: Next.js 15, Tailwind CSS, shadcn/ui, Framer Motion, Zustand, React Query, Socket.io-client, next-pwa
- **Backend**: NestJS, Prisma, PostgreSQL, JWT/Passport, Socket.io, Helmet, Throttler
- **Services**: Docker Compose (PostgreSQL 14, Redis 7), Google Gemini AI, Cloudinary (images)

## API Endpoints
- Base URL: `http://localhost:4000/api/v1`
- Swagger docs: `http://localhost:4000/api/v1/docs`

## Environment Variables
Required in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` - Auth secrets
- `GEMINI_API_KEY` - Google AI API key
- `CLOUDINARY_*` - Image upload (optional)
- `REDIS_URL` - Redis connection (optional)
