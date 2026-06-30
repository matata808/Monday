# Monday Project Context

Last updated: 2026-06-30

## User Goal

The user wants Monday: a personal dashboard that opens quickly and summarizes the useful parts of their day:

- Gmail and ZFN webmail summaries.
- A professional kanban board with multiple boards, task metadata, drag/drop status changes, and subtasks.
- Journaling functions for mood, focus, and notes.
- Fast links/actions for email, tasks, and daily planning.
- A cleaner visual direction based on a dark charcoal and amber dashboard mockup supplied by the user.

The user explicitly asked for open-source tooling, a real DBMS-style persistence layer, and an OAuth client. They did not want mail data hardcoded into the UI.

## Current Stack

- Frontend: React, Vite, Tailwind CSS v4 styles, lucide-react icons.
- API: Fastify.
- Validation: Zod.
- Local persistence: SQLite through Node's `node:sqlite` `DatabaseSync`.
- Optional future persistence: PostgreSQL via Drizzle ORM is scaffolded, but many new kanban mutations currently return `501` in Postgres mode.
- Gmail: Google OAuth 2.0 plus Gmail readonly sync.
- ZFN webmail: IMAP verification route exists; full encrypted credential storage and scheduled sync are still follow-up work.

## Main Files

- `src/App.jsx`: Main dashboard UI and interaction state.
- `src/index.css`: Theme tokens, fonts, Tailwind import, and utility classes.
- `src/services/dashboardApi.js`: Frontend API client.
- `src/App.test.jsx`: Integration-style UI tests for dashboard, kanban, journal, subtasks, and Gmail sync.
- `server/index.js`: Fastify server entrypoint.
- `server/config.js`: Environment config and runtime capability detection.
- `server/db/sqlite.js`: SQLite connection and migration logic.
- `server/repositories/sqliteDashboard.js`: SQLite read/write operations for dashboard data.
- `server/routes/auth.js`: OAuth provider info, Google OAuth, Gmail sync, and ZFN IMAP verification route.
- `server/routes/dashboard.js`: Dashboard, task, board, subtask, and journal API routes.
- `.env.example`: Required local environment variables.

## Feature State

Implemented:

- Dashboard UI with morning overview, inbox panel, kanban panel, journal panel, and system/status panel.
- Gmail OAuth start/callback routes.
- Gmail sync route that reads the latest connected OAuth account and stores recent Gmail messages.
- SQLite-backed mail accounts, messages, tasks, boards, subtasks, and journal entries.
- Multiple kanban boards.
- Task create, update, delete.
- Drag/drop task status changes.
- Task priority, due date, description, and ordering fields.
- Subtask create, toggle/update, and delete.
- Journal entry creation.
- Provider capability checks so the UI can tell whether Gmail/ZFN are configured.

Partially implemented:

- ZFN webmail. The API can verify an IMAP connection, but it does not yet store encrypted IMAP credentials or sync mailbox messages into `mail_messages`.
- PostgreSQL mode. Older dashboard reads exist, but the newer board/task/subtask mutation routes are only implemented for SQLite.
- Token security. OAuth tokens are stored through repository helpers, but the earlier user-facing callback text mentioned encryption as a next step. Review `server/security/secrets.js` and repository storage before treating this as production-safe.

Not implemented:

- Background/scheduled sync.
- Multi-user auth/session isolation.
- Production deployment hardening.
- Full Gmail message threading, labels, or reply actions.
- ZFN mailbox sync.

## OAuth Context

The user created a Google OAuth client and configured test-user access after seeing several Google OAuth errors:

- Missing redirect URI registration.
- App limited to organization.
- App not verified.

The redirect URI used by the app is:

```text
http://127.0.0.1:8787/api/auth/google/callback
```

For local development, `.env` should contain:

```text
APP_URL=http://127.0.0.1:5173
API_HOST=127.0.0.1
API_PORT=8787
SQLITE_DATABASE_PATH=./data/dashboard.sqlite
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://127.0.0.1:8787/api/auth/google/callback
```

The Gmail scope is readonly. The app does not need bank credentials and should never ask for them.

## Design Direction

The latest accepted direction is a professional morning dashboard, not a toy kanban page:

- Dark charcoal base with amber primary accents.
- Dense but readable operational layout.
- Small-radius cards and restrained visual styling.
- Real dashboard widgets instead of a marketing landing page.
- Icon buttons should have accessible labels.
- Avoid decorative gradient/orb-heavy styling.

The user pasted a Figma-generated React mockup using Playfair Display, Plus Jakarta Sans, JetBrains Mono, lucide icons, charcoal tokens, and amber accents. The implemented UI should follow that direction while staying connected to API data.

## Commands

Common local commands:

```bash
npm run dev
npm run dev:api
npm run lint
npm run test:run
npm run build
```

Expected local ports:

- Frontend: `http://127.0.0.1:5173` unless occupied, then Vite may choose another port.
- API: `http://127.0.0.1:8787`.
