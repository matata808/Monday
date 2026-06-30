# Monday Agent Handoff

Last updated: 2026-06-30

## Current Situation

The dashboard and professional kanban feature work was implemented and passed static/test/build checks before this handoff. The remaining item from the paused work is runtime verification of the SQLite migration against the existing local database file.

The observed live API failure was:

```text
GET /api/dashboard -> 500
ERR_SQLITE_ERROR no such column: board_id
```

Cause:

- The local SQLite database existed before the new kanban schema.
- `tasks.board_id` was added later.
- Index creation originally referenced `board_id` before the column was guaranteed to exist.

Current code state:

- `server/db/sqlite.js` now calls `ensureColumn(...)` for `tasks.board_id`, `description`, `priority`, `due_at`, and `position`.
- The `tasks_board_status_position_idx` index is created after those `ensureColumn(...)` calls.
- This code was syntax-checked, but the API process still needed a clean restart and `/api/dashboard` recheck when work paused.

## Recommended Next Steps

1. Check whether an old API server is still bound to port `8787`.
2. Stop any stale API process if needed.
3. Start a fresh API server with `npm run dev:api`.
4. Hit `http://127.0.0.1:8787/api/dashboard`.
5. If the same SQLite column error appears, inspect the actual DB with SQLite table info for `tasks`.
6. Run `npm run lint`, `npm run test:run`, and `npm run build` after any fix.

Do not delete the user's SQLite database unless they explicitly ask for a reset. It may contain their Gmail OAuth/mail data.

## Verification Already Completed

These passed before the runtime server recheck was interrupted:

```bash
npm run lint
npm run test:run
npm run build
node --check server/db/sqlite.js
node --check server/repositories/sqliteDashboard.js
node --check server/routes/dashboard.js
```

The test suite had 12 passing tests at that point.

## Local Server Notes

Known prior server state:

- Vite had been started on `http://127.0.0.1:5174/` because `5173` was already occupied.
- The API had been restarted on `127.0.0.1:8787`, but the health check still hit the migration issue before a clean post-fix restart could be confirmed.

Treat these as stale process notes. Re-check the current process table before acting.

## Important Implementation Notes

- `src/App.jsx` is the main integrated dashboard. It now owns most UI behavior and calls `src/services/dashboardApi.js`.
- `src/components/Column.jsx` may still exist from the older learning-kanban app and may not represent the current dashboard's main board.
- `README.md` describes Monday, the current dashboard app.
- `.env` may contain real Google OAuth credentials. Do not print it, commit it, or copy secrets into docs.
- `.env.example` is safe to reference.

## API Surface

Dashboard:

- `GET /api/dashboard`

Kanban:

- `POST /api/boards`
- `DELETE /api/boards/:boardId`
- `POST /api/tasks`
- `PATCH /api/tasks/:taskId`
- `DELETE /api/tasks/:taskId`
- `POST /api/tasks/:taskId/subtasks`
- `PATCH /api/subtasks/:subtaskId`
- `DELETE /api/subtasks/:subtaskId`

Journal:

- `POST /api/journal`

Mail/OAuth:

- `GET /api/auth/providers`
- `GET /api/auth/google/start`
- `GET /api/auth/google/callback`
- `POST /api/sync/gmail`
- `POST /api/mail-accounts/zfn`

## Known Follow-Up Work

- Confirm SQLite migration on the user's existing `data/dashboard.sqlite`.
- Update `README.md` to describe the current dashboard instead of the original tutorial kanban app.
- Implement encrypted ZFN IMAP credential storage and real mailbox sync.
- Decide whether PostgreSQL is required now or whether SQLite is enough for local personal use.
- Review OAuth token encryption before production use.
- Add a small migration test or repository test that starts from an old `tasks` table without `board_id`.
