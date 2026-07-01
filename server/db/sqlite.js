import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { config } from "../config.js";

let db;

export function getSqliteDb() {
  if (!config.sqliteDatabasePath) return null;
  if (db) return db;

  const absolutePath = path.resolve(process.cwd(), config.sqliteDatabasePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });

  db = new DatabaseSync(absolutePath);
  db.exec("PRAGMA foreign_keys = ON");
  migrateSqlite(db);
  return db;
}

export function closeSqliteDb() {
  if (!db) return;
  db.close();
  db = undefined;
}

function migrateSqlite(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS oauth_accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      provider_account_id TEXT NOT NULL,
      access_token_ciphertext TEXT,
      refresh_token_ciphertext TEXT,
      scope TEXT,
      expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(provider, provider_account_id)
    );

    CREATE TABLE IF NOT EXISTS mail_accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      address TEXT NOT NULL,
      display_name TEXT NOT NULL,
      imap_host TEXT,
      imap_port INTEGER,
      imap_username TEXT,
      encrypted_secret TEXT,
      last_synced_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, provider, address)
    );

    CREATE TABLE IF NOT EXISTS mail_messages (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES mail_accounts(id) ON DELETE CASCADE,
      provider_message_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      subject TEXT NOT NULL,
      snippet TEXT,
      action TEXT NOT NULL DEFAULT 'Review',
      priority INTEGER NOT NULL DEFAULT 0,
      received_at TEXT,
      raw_metadata TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(account_id, provider_message_id)
    );

    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      board_id TEXT REFERENCES boards(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'To Do',
      priority TEXT NOT NULL DEFAULT 'medium',
      due_at TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subtasks (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mood TEXT NOT NULL,
      focus TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sync_runs (
      id TEXT PRIMARY KEY,
      mail_account_id TEXT NOT NULL REFERENCES mail_accounts(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      message TEXT,
      started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      finished_at TEXT
    );

    CREATE INDEX IF NOT EXISTS mail_messages_account_received_idx
      ON mail_messages(account_id, received_at DESC);
    CREATE INDEX IF NOT EXISTS tasks_user_status_idx ON tasks(user_id, status);
    CREATE INDEX IF NOT EXISTS journal_entries_user_created_idx
      ON journal_entries(user_id, created_at DESC);
  `);

  ensureColumn(database, "tasks", "board_id", "TEXT REFERENCES boards(id) ON DELETE CASCADE");
  ensureColumn(database, "tasks", "description", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(database, "tasks", "priority", "TEXT NOT NULL DEFAULT 'medium'");
  ensureColumn(database, "tasks", "due_at", "TEXT");
  ensureColumn(database, "tasks", "position", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(database, "mail_accounts", "imap_port", "INTEGER");

  database.exec(`
    CREATE INDEX IF NOT EXISTS tasks_board_status_position_idx
      ON tasks(board_id, status, position);
    CREATE INDEX IF NOT EXISTS subtasks_task_position_idx
      ON subtasks(task_id, position);
  `);
}

function ensureColumn(database, table, column, definition) {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all();
  if (columns.some((existingColumn) => existingColumn.name === column)) return;
  database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}
