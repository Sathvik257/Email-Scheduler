# ReachInbox Assignment Requirement Status

Legend:
- [x] Done in code and build-checked
- [~] Implemented, but still needs live demo verification with local services
- [ ] Still to do before final submission

## Backend Requirements

- [x] TypeScript backend
- [x] Express.js API
- [x] PostgreSQL relational database through Prisma
- [x] BullMQ queue backed by Redis
- [x] BullMQ delayed jobs are used for scheduling
- [x] No cron job or node-cron/agenda scheduler is used
- [x] API accepts email scheduling requests
- [x] Scheduled emails are stored in the database
- [x] Multiple Ethereal SMTP senders are supported from env config
- [x] Worker concurrency is configurable through `WORKER_CONCURRENCY`
- [x] Minimum delay between sends is configurable through `MIN_EMAIL_DELAY_MS`
- [x] Hourly send limit is configurable through `MAX_EMAILS_PER_HOUR`
- [x] Hourly rate limiting uses Redis-backed atomic counters
- [x] Jobs are delayed/retried instead of dropped when the hourly limit is reached
- [x] Database status lifecycle exists: scheduled, processing, sent, failed
- [x] Idempotency key prevents duplicate batches for the same user
- [x] BullMQ job IDs are tied to database rows to avoid duplicate queue jobs
- [x] Worker claims rows atomically before SMTP send
- [x] Sent rows are skipped if a duplicate job runs
- [x] Future scheduled jobs are reconciled into BullMQ when the worker starts
- [x] README documents architecture, restart persistence, rate limiting, concurrency, and trade-offs
- [~] Full restart demo still needs to be shown with Postgres/Redis running
- [~] 1000+ load behavior is implemented by design and documented; demo can use a small sample

## Frontend Requirements

- [x] React frontend
- [x] TypeScript frontend
- [x] Tailwind CSS styling
- [x] Real Google OAuth login via `@react-oauth/google`
- [x] Backend verifies Google ID token
- [x] Redirects to dashboard after login
- [x] Header shows user name, email, avatar or initials fallback
- [x] Logout option exists
- [x] Dashboard has Scheduled Emails and Sent Emails tabs
- [x] Primary Compose Email button exists
- [x] Compose flow accepts subject and body
- [x] Compose flow uploads CSV/TXT lead files
- [x] Lead parser deduplicates and counts email addresses
- [x] Compose flow accepts start time
- [x] Compose flow accepts delay between emails
- [x] Compose flow accepts hourly limit
- [x] Compose flow sends data to backend schedule API
- [x] Scheduled email table shows email, subject, scheduled time, and status
- [x] Sent email table shows email, subject, sent/failed time, and status
- [x] Loading states exist
- [x] Empty states exist
- [x] Basic error/notice messages exist
- [x] Reusable UI components exist: button, header, status badge, table, modal
- [x] Frontend has been visually redesigned into a polished website/dashboard
- [~] Figma matching cannot be fully verified because the assignment text does not include an actual Figma URL

## Infra And Setup

- [x] Docker Compose file exists for PostgreSQL and Redis
- [x] Backend `.env.example` includes DB, Redis, Google, JWT, worker, rate limit, and Ethereal settings
- [x] Frontend `.env.example` includes API URL and Google client ID
- [x] Scripts exist for Ethereal sender setup and sender sync
- [~] Docker was not available in this terminal path during this audit, so DB/Redis integration was not rerun here
- [~] Google OAuth credentials must be valid in local `.env` files for real login
- [~] Ethereal accounts must be generated and synced before live sending

## Build Verification

- [x] Backend build passes: `npm run build --workspace backend`
- [x] Frontend build passes: `npm run build --workspace frontend`
- [x] No direct cron scheduler package is installed: `npm ls node-cron agenda cron`
- [x] No cron scheduler call found in backend/frontend source

## Submission Tasks Still To Do

- [ ] Create or confirm the private GitHub repository
- [ ] Push the final code
- [ ] Invite `Mitrajit`
- [ ] Invite `sarvagya-chaudhary`
- [ ] Record a demo video under 5 minutes
- [ ] In the demo, show scheduling emails
- [ ] In the demo, show Scheduled and Sent dashboard views
- [ ] In the demo, show restart recovery
- [ ] In the demo, briefly show delay/rate-limit behavior
- [ ] Fill the assignment submission form with links and details
- [ ] Confirm no real secrets are visible in the repository or demo video
