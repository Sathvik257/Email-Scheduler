# ReachInbox Full-Stack Email Job Scheduler

A production-oriented email scheduling service and dashboard built for the ReachInbox Software Development Intern assignment.

The application accepts email scheduling requests, stores them in PostgreSQL, schedules persistent delayed jobs with BullMQ and Redis, sends test emails through Ethereal SMTP, and provides a React dashboard for Google login, composing campaigns, and viewing scheduled or completed emails.

> **No cron jobs are used.** Scheduling is handled entirely through BullMQ delayed jobs backed by Redis.

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [How Scheduling Works](#how-scheduling-works)
- [Persistence and Restart Recovery](#persistence-and-restart-recovery)
- [Concurrency and Rate Limiting](#concurrency-and-rate-limiting)
- [Idempotency and Duplicate Prevention](#idempotency-and-duplicate-prevention)
- [Behavior Under Load](#behavior-under-load)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Local Setup](#local-setup)
- [Google OAuth Setup](#google-oauth-setup)
- [Ethereal SMTP Setup](#ethereal-smtp-setup)
- [Running the Application](#running-the-application)
- [Production Build](#production-build)
- [API Endpoints](#api-endpoints)
- [Verified Test Scenarios](#verified-test-scenarios)
- [Demo Video Checklist](#demo-video-checklist)
- [Security Notes](#security-notes)
- [Trade-offs and Assumptions](#trade-offs-and-assumptions)

---

## Features

### Backend

- Express.js API written in TypeScript
- PostgreSQL persistence through Prisma ORM
- BullMQ delayed jobs backed by Redis
- Ethereal Email SMTP integration
- Multiple SMTP senders
- Configurable worker concurrency
- Configurable minimum delay between email sends
- Configurable hourly email limit
- Redis-backed global hourly send protection
- Per-batch scheduling that moves excess recipients to the next hour window
- Persistent jobs that survive API and worker restarts
- Database-backed email lifecycle:
  - `SCHEDULED`
  - `PROCESSING`
  - `SENT`
  - `FAILED`
- Idempotency-key support to prevent duplicate batches
- BullMQ job IDs mapped to database rows to prevent duplicate jobs
- Retry and exponential backoff for recoverable worker failures
- Pagination for scheduled and sent email APIs
- Graceful shutdown for PostgreSQL and Redis connections

### Frontend

- React + TypeScript dashboard
- Real Google OAuth login
- User name, email, avatar, and logout
- Compose-email modal
- CSV or text-file lead upload
- Email address parsing and recipient count
- Sender selection
- Configurable start time
- Configurable delay between emails
- Configurable hourly limit
- Scheduled Emails table
- Sent / Failed Emails table
- Ethereal preview links
- Loading, error, and empty states
- Responsive UI styled with Tailwind CSS

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Authentication | Google Identity Services |
| Backend | Node.js, Express.js, TypeScript |
| Validation | Zod |
| Database | PostgreSQL |
| ORM | Prisma |
| Queue | BullMQ |
| Queue Storage | Redis |
| SMTP | Nodemailer + Ethereal Email |
| Authentication Token | JWT |
| Local Infrastructure | Docker Compose |

---

## Architecture

```mermaid
flowchart LR
    U[User] --> F[React Dashboard]
    F -->|Google credential| A[Express API]
    A -->|Verify token| G[Google Identity Services]
    A -->|Store users, batches and emails| P[(PostgreSQL)]
    A -->|Create delayed jobs| Q[BullMQ Queue]
    Q --> R[(Redis)]
    W[BullMQ Worker] --> Q
    W -->|Read and update email state| P
    W -->|Check hourly send slot| R
    W -->|Send email| E[Ethereal SMTP]
    E -->|Preview URL| W
    W -->|Store sent status and preview URL| P
    F -->|Fetch scheduled and sent emails| A
```

### Main Components

1. **React Dashboard**
   - Handles Google login.
   - Parses uploaded lead files.
   - Sends scheduling requests.
   - Displays scheduled, sent, and failed emails.

2. **Express API**
   - Verifies Google ID tokens.
   - Issues application JWTs.
   - Validates scheduling payloads.
   - Stores batches and email rows.
   - Creates BullMQ delayed jobs.

3. **PostgreSQL**
   - Stores users, senders, batches, recipients, scheduling times, status, attempts, errors, message IDs, and preview URLs.

4. **Redis + BullMQ**
   - Persists delayed jobs.
   - Coordinates workers.
   - Enforces distributed rate-limiting state.

5. **Worker**
   - Claims database rows safely.
   - Applies hourly and minimum-delay controls.
   - Sends through the selected Ethereal account.
   - Updates the final database status.

---

## Project Structure

```text
reachinbox-email-scheduler/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── scripts/
│   │   ├── add-second-sender.ts
│   │   ├── create-ethereal-account.ts
│   │   ├── inspect-latest-batch.ts
│   │   ├── setup-ethereal-env.ts
│   │   ├── sync-senders.ts
│   │   └── test-idempotency.ts
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── db/
│       ├── middleware/
│       ├── queue/
│       ├── redis/
│       ├── routes/
│       ├── services/
│       ├── types/
│       ├── utils/
│       ├── app.ts
│       ├── server.ts
│       └── worker.ts
├── frontend/
│   └── src/
│       ├── components/
│       ├── lib/
│       ├── pages/
│       ├── App.tsx
│       ├── index.css
│       ├── main.tsx
│       └── types.ts
├── compose.yaml
├── sample-leads.csv
└── README.md
```

---

## How Scheduling Works

1. The authenticated user submits:
   - Sender
   - Subject
   - Body
   - Recipient list
   - Start time
   - Delay between emails
   - Hourly limit
   - Idempotency key

2. The backend validates the payload with Zod.

3. The backend calculates an effective delay and hourly limit using both:
   - User-requested values
   - Server-configured maximums and minimums

4. A database transaction creates:
   - One `EmailBatch`
   - One `ScheduledEmail` row per recipient

5. Each email receives:
   - A UUID database ID
   - A unique BullMQ job ID
   - A calculated `scheduledAt` value

6. BullMQ receives delayed jobs through `addBulk`.

7. At execution time, the worker:
   - Loads the database row
   - Skips already-sent rows
   - Applies the Redis-backed hourly gate
   - Atomically claims the row as `PROCESSING`
   - Sends through Ethereal SMTP
   - Stores `SENT` or `FAILED`
   - Saves provider message ID and Ethereal preview URL

---

## Persistence and Restart Recovery

Persistence is provided at two levels:

### PostgreSQL

The database is the source of truth for every email and batch. Email state is never stored only in memory.

### Redis / BullMQ

Delayed BullMQ jobs remain in Redis when the Express server or worker is stopped.

When the worker starts, the application reconciles database rows that are still `SCHEDULED`. If a database row exists but its BullMQ job is missing, the job is recreated using the original database ID, BullMQ job ID, and scheduled time.

This means:

- Future jobs survive backend restarts.
- Future jobs survive worker restarts.
- Jobs are not restarted from the beginning.
- Completed emails are not automatically sent again.
- Missing queue jobs can be restored from PostgreSQL.

---

## Concurrency and Rate Limiting

All values are configurable through environment variables.

### Worker Concurrency

```env
WORKER_CONCURRENCY=5
```

BullMQ processes up to the configured number of jobs concurrently.

### Minimum Delay Between Sends

```env
MIN_EMAIL_DELAY_MS=2000
```

The worker uses a BullMQ limiter to allow one send per configured duration. With the default value, there is a minimum delay of approximately two seconds between sends.

### Hourly Limit

```env
MAX_EMAILS_PER_HOUR=200
```

The submitted batch limit is capped by the server configuration.

Two controls are applied:

1. **Pre-scheduling control**
   - While calculating recipient times, emails beyond the batch hourly limit are moved to the next hour window.

2. **Worker-time global control**
   - Before SMTP delivery, the worker consumes a Redis-backed hourly slot.
   - The counter is shared across workers and instances.
   - When no slot is available, the job is rate-limited and retried later instead of being dropped.

### Example

For three recipients, a two-second delay, and an hourly limit of two:

```text
Recipient 1 → start time
Recipient 2 → start time + 2 seconds
Recipient 3 → next hour window
```

Verified output showed the third recipient moved approximately `3598` seconds after the second recipient.

---

## Idempotency and Duplicate Prevention

The scheduling request includes an `idempotencyKey`.

PostgreSQL enforces:

```text
unique(userId, idempotencyKey)
```

When the same user submits the same key again:

- The existing batch is returned.
- No second batch is created.
- No duplicate recipient rows are created.
- No duplicate BullMQ jobs are created.

Each email also stores a unique `bullJobId`, and the BullMQ job uses that same ID.

The worker additionally checks the database state before sending:

- `SENT` rows are skipped.
- A job must atomically claim an eligible row before delivery.
- An uncertain interrupted `PROCESSING` state is not blindly resent because SMTP does not provide atomic idempotency.

Verified idempotency test:

```text
First request replayed:  false
Second request replayed: true
Same batch ID:           true
Database batch count:    1
Database email count:    1
```

---

## Behavior Under Load

When 1000+ emails are scheduled around the same time:

1. PostgreSQL stores every recipient as an independent row.
2. BullMQ stores persistent delayed jobs in Redis.
3. `addBulk` reduces queue insertion overhead.
4. Worker concurrency controls parallel processing.
5. The minimum-delay limiter throttles SMTP delivery.
6. The Redis-backed hourly counter protects the global hourly limit.
7. Per-batch scheduling moves excess recipients into later hour windows.
8. Jobs are delayed or retried; they are not silently dropped.
9. Email status remains visible in PostgreSQL throughout processing.

The design favors reliability and observability over maximum raw throughput.

---

## Prerequisites

Install:

- Node.js 22 or later
- npm
- Docker Desktop
- Git
- A Google Cloud account

Verify:

```powershell
node --version
npm --version
docker --version
docker compose version
git --version
```

---

## Environment Variables

### Backend

Create `backend/.env` from `backend/.env.example`.

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

DATABASE_URL=postgresql://reachinbox:reachinbox_password@localhost:5432/reachinbox?schema=public
REDIS_URL=redis://localhost:6379

JWT_SECRET=replace-with-at-least-32-random-characters
GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com

WORKER_CONCURRENCY=5
MIN_EMAIL_DELAY_MS=2000
MAX_EMAILS_PER_HOUR=200

ETHEREAL_ACCOUNTS_JSON=[{"key":"sender-a","name":"ReachInbox Sender A","email":"sender-a@ethereal.email","user":"replace","pass":"replace","host":"smtp.ethereal.email","port":587,"secure":false}]
```

Generate a secure JWT secret:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Frontend

Create `frontend/.env` from `frontend/.env.example`.

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
```

> Never commit real `.env` files. They are excluded through `.gitignore`.

---

## Local Setup

### 1. Clone and enter the repository

```powershell
git clone <your-private-repository-url>
cd reachinbox-email-scheduler
```

### 2. Start PostgreSQL and Redis

```powershell
docker compose up -d
docker compose ps
```

Expected services:

```text
reachinbox-postgres   healthy
reachinbox-redis      healthy
```

Verify manually:

```powershell
docker exec reachinbox-postgres pg_isready -U reachinbox -d reachinbox
docker exec reachinbox-redis redis-cli ping
```

### 3. Install backend dependencies

```powershell
cd backend
npm install
```

### 4. Configure backend environment

```powershell
Copy-Item .env.example .env
```

Update the Google Client ID and JWT secret.

### 5. Generate Prisma Client and apply migrations

```powershell
npm run db:generate
npm run db:deploy
```

For schema development:

```powershell
npx prisma migrate dev
```

### 6. Configure Ethereal senders

Create the first account and save it to `backend/.env`:

```powershell
npx tsx scripts/setup-ethereal-env.ts
```

Add a second sender:

```powershell
npx tsx scripts/add-second-sender.ts
```

Synchronize configured senders into PostgreSQL:

```powershell
npx tsx scripts/sync-senders.ts
```

### 7. Install frontend dependencies

```powershell
cd ..\frontend
npm install
Copy-Item .env.example .env
```

Update `VITE_GOOGLE_CLIENT_ID`.

---

## Google OAuth Setup

1. Open Google Cloud Console.
2. Create or select a project.
3. Configure **Google Auth Platform**.
4. Set the audience to **External**.
5. Add your Google account as a test user while the app is in testing.
6. Create an OAuth Client:
   - Application type: **Web application**
   - Authorized JavaScript origins:

```text
http://localhost:5173
http://127.0.0.1:5173
```

Use `http://localhost:5173` when opening the local frontend. Google treats
`localhost` and `127.0.0.1` as different origins, so both are listed here to
avoid `Error 400: origin_mismatch` during local testing.

7. Copy the Client ID into:

```text
backend/.env
frontend/.env
```

Both files must use the same Google Client ID.

The frontend receives a Google ID credential. The backend verifies it with Google, creates or updates the user, and returns an application JWT.

---

## Ethereal SMTP Setup

Ethereal Email is a fake SMTP service for development and testing. Emails are not delivered to real inboxes.

The project provides helper scripts:

```powershell
cd backend
npx tsx scripts/setup-ethereal-env.ts
npx tsx scripts/add-second-sender.ts
npx tsx scripts/sync-senders.ts
```

After an email is sent, the dashboard displays an Ethereal preview URL.

---

## Running the Application

Run three terminals.

### Terminal 1 — Backend API

```powershell
cd backend
npm run dev
```

Expected:

```text
Backend running at http://localhost:5000
PostgreSQL connected
Redis connected
```

### Terminal 2 — BullMQ Worker

```powershell
cd backend
npm run worker:dev
```

Expected:

```text
[worker] started
```

### Terminal 3 — React Frontend

```powershell
cd frontend
npm run dev
```

Open:

```text
http://localhost:5173
```

---

## Production Build

### Backend

```powershell
cd backend
npm run check
npm run build
npm start
```

### Worker

```powershell
cd backend
npm run worker:start
```

### Frontend

```powershell
cd frontend
npm run check
npm run build
npm run preview -- --host localhost --port 5173
```

---

## API Endpoints

Base URL:

```text
http://localhost:5000/api
```

| Method | Endpoint | Authentication | Description |
|---|---|---:|---|
| GET | `/health` | No | API health check |
| POST | `/auth/google` | No | Verify Google credential and issue JWT |
| GET | `/auth/me` | Yes | Return current user |
| GET | `/senders` | Yes | List active SMTP senders |
| POST | `/emails/schedule` | Yes | Create a scheduled email batch |
| GET | `/emails/scheduled` | Yes | List scheduled and processing emails |
| GET | `/emails/sent` | Yes | List sent and failed emails |

### Schedule Request Example

```json
{
  "senderId": "sender-uuid",
  "subject": "Product Demo Campaign",
  "body": "Hello from ReachInbox Scheduler.",
  "recipients": [
    "alice@example.com",
    "bob@example.org"
  ],
  "startTime": "2026-07-27T18:00:00.000Z",
  "delayBetweenEmailsMs": 2000,
  "hourlyLimit": 200,
  "idempotencyKey": "campaign-unique-key-001"
}
```

The frontend automatically sends the application JWT in the `Authorization` header.

---

## Verified Test Scenarios

The following scenarios were tested successfully:

- API health check
- PostgreSQL connection
- Redis connection
- Prisma migration
- Google OAuth login
- JWT-protected dashboard APIs
- CSV lead parsing
- Three-recipient scheduling
- Ethereal SMTP delivery
- Ethereal preview links
- Multiple SMTP senders
- Two-second delay between scheduled recipients
- Hourly limit of two:
  - First two emails sent
  - Third email moved to the next hour window
- Backend and worker restart:
  - Future jobs remained persisted
  - Jobs sent after restart
  - No duplicates were created
- Idempotency:
  - Repeated request returned the same batch
  - One database batch
  - One database email row
- Backend TypeScript build
- Frontend TypeScript and Vite production build

Useful verification scripts:

```powershell
cd backend
npx tsx scripts/inspect-latest-batch.ts
npx tsx scripts/test-idempotency.ts
```

---

## Demo Video Checklist

Keep the demo under five minutes.

1. Show Google login.
2. Show user name, email, avatar, and logout.
3. Open Compose New Email.
4. Upload `sample-leads.csv`.
5. Show detected recipient count.
6. Select a sender.
7. Configure start time, delay, and hourly limit.
8. Schedule the emails.
9. Show Scheduled Emails.
10. Show worker logs.
11. Show Sent Emails and Ethereal preview.
12. Demonstrate persistence:
    - Schedule a future batch.
    - Stop API and worker.
    - Restart both.
    - Show that the jobs still exist and are sent.
13. Briefly demonstrate rate limiting:
    - Three recipients
    - Hourly limit of two
    - Show the third recipient scheduled in the next hour.

---

## Security Notes

- `.env` files are ignored by Git.
- SMTP passwords are never stored in the frontend.
- Google credentials are verified by the backend.
- Application APIs use signed JWT authentication.
- The server disables the `X-Powered-By` header.
- Helmet adds standard HTTP security headers.
- CORS is restricted to the configured frontend origin.
- Request bodies are size-limited.
- Inputs are validated with Zod.
- Database operations use Prisma parameterization.
- The application does not expose real SMTP passwords through API responses.

Before pushing:

```powershell
git ls-files backend/.env frontend/.env
```

The command must return no output.

---

## Trade-offs and Assumptions

- Ethereal is used only for development and demonstration.
- SMTP delivery cannot participate in the same atomic transaction as PostgreSQL.
- If a worker interruption makes a `PROCESSING` delivery uncertain, automatic resend is suppressed to reduce duplicate-delivery risk.
- The global Redis rate limit is configured globally rather than per tenant.
- Scheduling 1000+ emails is supported by the design, but the demo uses a small recipient list to avoid unnecessary Ethereal traffic.
- The frontend parses uploaded lead files in the browser and submits the normalized email list to the backend.
- Production deployment would normally add:
  - Managed PostgreSQL
  - Managed Redis
  - HTTPS
  - Secret management
  - Centralized logs and metrics
  - Queue dashboards and alerting
  - Per-tenant or per-sender quotas
  - Dead-letter and manual retry workflows

---

## Assignment Requirement Mapping

| Requirement | Implementation |
|---|---|
| Schedule emails through API | `POST /api/emails/schedule` |
| Relational database | PostgreSQL + Prisma |
| Persistent queue | BullMQ + Redis |
| No cron | BullMQ delayed jobs only |
| Ethereal SMTP | Nodemailer transport per sender |
| Restart persistence | Redis jobs + PostgreSQL reconciliation |
| Worker concurrency | `WORKER_CONCURRENCY` |
| Minimum send delay | BullMQ worker limiter |
| Hourly rate limit | Batch schedule calculation + Redis worker guard |
| Multiple senders | Multiple Ethereal accounts + Sender table |
| No duplicate sends | Idempotency key, unique job IDs, atomic DB claim |
| Google login | Google Identity Services |
| Scheduled table | React dashboard |
| Sent / failed table | React dashboard |
| CSV / text upload | Browser lead parser |
| Loading and empty states | Reusable frontend components |
| Production build | TypeScript + Vite build verified |

---

## License

This repository was created for the ReachInbox Software Development Intern assignment.
