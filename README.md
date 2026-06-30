# Monday

Monday is a React + Fastify personal dashboard for mail, tasks, journaling, and daily planning.

The app provides:

- A professional task workspace with kanban boards, task metadata, drag/drop status changes, ordering, and subtasks.
- Gmail OAuth setup and readonly Gmail sync.
- ZFN webmail setup hooks through IMAP verification.
- Journal entries for mood, focus, and notes.
- A dashboard briefing that summarizes inbox, tasks, journal, and system status.
- SQLite for zero-setup local development and PostgreSQL for containerized/database-backed runs.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Vitest, React Testing Library.
- Backend: Fastify, Zod, Google OAuth, ImapFlow.
- Databases: SQLite locally by default, PostgreSQL through Docker Compose.

## Install

```bash
npm install
```

## Environment

Copy the example file and fill only the values you need:

```bash
cp .env.example .env
```

Required for local app startup:

```text
APP_URL=http://127.0.0.1:5173
API_HOST=127.0.0.1
API_PORT=8787
APP_SECRET=replace-with-a-long-random-local-secret
SQLITE_DATABASE_PATH=./data/dashboard.sqlite
```

Required for Gmail OAuth:

```text
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://127.0.0.1:8787/api/auth/google/callback
```

Optional PostgreSQL:

```text
POSTGRES_DB=dashboard
POSTGRES_USER=dashboard
POSTGRES_PASSWORD=replace-with-a-local-dev-password
DATABASE_URL=postgres://dashboard:replace-with-a-local-dev-password@127.0.0.1:5432/dashboard
```

Leave `DATABASE_URL` empty to use SQLite.

Optional ZFN IMAP:

```text
ZFN_IMAP_HOST=
ZFN_IMAP_PORT=993
```

## Weather API

Weather configuration is reserved in env so it can be wired without committing keys.

Open-Meteo does not require an API key:

```text
WEATHER_API_PROVIDER=open-meteo
WEATHER_API_KEY=
WEATHER_LOCATION=Berlin,DE
```

For OpenWeather or another keyed provider, set:

```text
WEATHER_API_PROVIDER=openweather
WEATHER_API_KEY=your-local-key
WEATHER_LOCATION=Berlin,DE
```

Do not commit real weather API keys.

## Run Locally

Start the API:

```bash
npm run dev:api
```

Start the frontend in another terminal:

```bash
npm run dev
```

Default URLs:

- Frontend: `http://127.0.0.1:5173`
- API: `http://127.0.0.1:8787`
- Health check: `http://127.0.0.1:8787/api/health`

## Mail Setup

### Gmail

1. Create a Google OAuth client in Google Cloud Console.
2. Enable the Gmail API.
3. Add this redirect URI:

```text
http://127.0.0.1:8787/api/auth/google/callback
```

4. Add your Google account as a test user while the OAuth app is in testing mode.
5. Fill `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` in `.env`.
6. Start the API and visit:

```text
http://127.0.0.1:8787/api/auth/google/start
```

The Gmail integration uses readonly scope.

### ZFN Webmail

ZFN support currently verifies IMAP connection settings through the API. Full encrypted credential storage and scheduled mailbox sync are follow-up work.

Set:

```text
ZFN_IMAP_HOST=
ZFN_IMAP_PORT=993
```

Never commit mailbox passwords or private IMAP credentials.

## Docker

The app can run as three containers:

- `frontend`: nginx serving the built React app on `http://127.0.0.1:5173`.
- `backend`: Fastify API on `http://127.0.0.1:8787`.
- `db`: PostgreSQL on `127.0.0.1:5432`.

Use your existing `.env`, or create one from `.env.docker.example`, then run:

```bash
docker compose up --build
```

If your system only has legacy Compose:

```bash
docker-compose up --build
```

The frontend proxies `/api/*` to the backend container. The database is initialized from `server/db/migrations/001_initial.sql` when the Docker volume is first created.

To intentionally reset the container database:

```bash
docker compose down -v
```

## Scripts

- `npm run dev`: start the Vite frontend.
- `npm run dev:api`: start the Fastify API.
- `npm run build`: build the frontend.
- `npm run lint`: run ESLint.
- `npm run test:run`: run tests once.
- `npm run test:coverage`: run tests with coverage.

## Public Repo Safety

Do not commit:

- `.env` or `.env.*` files, except `.env.example` and `.env.docker.example`.
- SQLite databases or local `data/` files.
- OAuth tokens, refresh tokens, API keys, mailbox passwords, or generated logs.

Local secrets should live in `.env`.

## Repository Workflow

This repo uses `dev` as the staging branch and `main` as the protected release branch.

- Read `docs/CONTRIBUTING.md` before opening a pull request.
- Use `.github/pull_request_template.md` when opening a PR.
- Merge feature branches into `dev` through pull requests.
- Merge `dev` into `main` only when preparing a release.

Long-lived feature branches are reserved for the major product areas:

- `feature/dashboard-shell`
- `feature/kanban-workspace`
- `feature/mail-integrations`
- `feature/journal`
- `feature/briefing-weather`
- `feature/backend-api`
- `feature/database-persistence`
- `feature/docker-deployment`
- `feature/security-ci`
