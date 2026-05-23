# ResidentIQ - Smart Hostel Seat Allocation

Production-grade hostel allocation platform for institutions, built with a modern full-stack architecture.

ResidentIQ provides transparent, role-based room allocation with real-time updates, admin controls, auditability, and reliable operational tooling.

## Highlights

- Fair and transparent room allocation workflows
- Role-based access for students, wardens, superadmins, and teachers
- Allocation windows with activation/locking controls
- Near real-time availability and booking updates (polling)
- Roommate invite and preference flows
- Manual override support for administrative exceptions
- Occupancy reports and export-ready data
- Audit logging for critical actions
- Containerized local environment

## System Overview

### Frontend
- Next.js (App Router) + React + TypeScript
- Tailwind CSS for UI styling
- Zustand for client-side auth state
- Axios for API calls
- REST API polling for live updates

### Backend
- Express + TypeScript
- Prisma ORM with PostgreSQL
- Redis for caching/coordination primitives
- BullMQ worker support for background email tasks
- JWT-based authentication (access + refresh flow)
- Middleware for authz/authn, rate limiting, error handling, and audit logs

### Infrastructure
- Docker Compose for API + PostgreSQL + Redis + Nginx
- Nginx reverse proxy config included
- Docker Compose for local environment

## Repository Structure

```text
HostelSeatAllocation/
  client/                  # Next.js frontend
  server/                  # Express + Prisma backend
    prisma/                # Data schema
    src/modules/           # Feature modules (auth, admin, student, allocation, etc.)
    src/middleware/        # Security, rate limit, audit, error handling
    src/lib/               # Prisma, Redis, logger, queues
  # .github/workflows/       # CI pipeline (add if needed)
  docker-compose.yml       # Local multi-service stack
  nginx.conf               # Reverse proxy
  start.sh                 # One-command local startup
  stop.sh                  # Graceful shutdown
```

## Core Features

### Student
- Login and onboarding flow
- View eligible hostels and room availability
- Book and cancel room allocation
- Set room preferences
- Send/respond to roommate invites
- View notices and notifications

### Admin and Warden
- Setup admin/warden accounts
- Manage hostels, rooms, and restrictions
- Create and control allocation windows
- Manage students and teachers (including bulk import)
- Manual room allocation override and unallocation
- Dashboard stats, occupancy reports, and export
- Notice board and audit log access

### Operational and Reliability
- Health endpoint for readiness checks
- Cron-based allocation window state synchronization
- Graceful shutdown for API + Redis + DB connections
- Rate limiting on auth and booking-sensitive routes

## API Surface (High-Level)

Base path: `/api/v1`

- Auth routes: `/auth`
  - student/admin/teacher login, refresh, logout, onboarding, password changes
- Student routes: `/student`
  - profile, hostels, rooms, active window, notices, preferences, invites, notifications
- Admin routes: `/admin`
  - wardens, hostels, rooms, restrictions, windows, students, teachers, reports, audit logs
- Allocation routes: `/allocations`
  - booking and cancellation flows

Health check:
- `GET /health`

## Getting Started

### Prerequisites
- Node.js 20+
- npm
- Docker + Docker Compose

### 1) Install dependencies

From project root:

```bash
npm install
cd server && npm install
cd ../client && npm install
```

### 2) Configure environment

In server folder:

```bash
cp .env.example .env
cp .env.example .env.local
```

Update secrets and service URLs in `.env` and `.env.local` as needed.

### 3) Start the full stack

From project root:

```bash
./start.sh
```

This script:
- starts PostgreSQL, Redis, and Nginx
- syncs Prisma schema
- regenerates Prisma client
- starts/rebuilds API container
- starts frontend dev server

### 4) Stop services

```bash
./stop.sh
```

## Manual Development Workflow

If you want to run services manually:

### Backend

```bash
cd server
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### Frontend

```bash
cd client
npm run dev
```

### Tests and Build

```bash
cd server
npm run test
npm run build

cd ../client
npm run lint
npm run build
```

## CI

There is no checked-in CI workflow yet. If you add `.github/workflows/ci.yml`, a good baseline would validate:
- backend dependency install
- Prisma generation and schema push
- TypeScript build
- test execution

