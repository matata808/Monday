CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
    CREATE TYPE task_status AS ENUM ('To Do', 'In Progress', 'Done');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mail_provider') THEN
    CREATE TYPE mail_provider AS ENUM ('google', 'zfn');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS oauth_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider mail_provider NOT NULL,
  provider_account_id text NOT NULL,
  access_token_ciphertext text,
  refresh_token_ciphertext text,
  scope text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mail_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider mail_provider NOT NULL,
  address text NOT NULL,
  display_name text NOT NULL,
  imap_host text,
  imap_username text,
  encrypted_secret text,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mail_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES mail_accounts(id) ON DELETE CASCADE,
  provider_message_id text NOT NULL,
  sender text NOT NULL,
  subject text NOT NULL,
  snippet text,
  action text NOT NULL DEFAULT 'Review',
  priority integer NOT NULL DEFAULT 0,
  received_at timestamptz,
  raw_metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  board_id uuid,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status task_status NOT NULL DEFAULT 'To Do',
  priority text NOT NULL DEFAULT 'medium',
  due_at text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS board_id uuid,
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS due_at text,
  ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tasks_board_id_fkey'
  ) THEN
    ALTER TABLE tasks
      ADD CONSTRAINT tasks_board_id_fkey
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood text NOT NULL,
  focus text NOT NULL,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mail_account_id uuid NOT NULL REFERENCES mail_accounts(id) ON DELETE CASCADE,
  status text NOT NULL,
  message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

CREATE INDEX IF NOT EXISTS mail_messages_account_received_idx
  ON mail_messages(account_id, received_at DESC);

CREATE INDEX IF NOT EXISTS tasks_user_status_idx ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS tasks_board_status_position_idx
  ON tasks(board_id, status, position);
CREATE INDEX IF NOT EXISTS subtasks_task_position_idx
  ON subtasks(task_id, position);
CREATE INDEX IF NOT EXISTS journal_entries_user_created_idx
  ON journal_entries(user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS oauth_accounts_provider_account_idx
  ON oauth_accounts(provider, provider_account_id);
CREATE UNIQUE INDEX IF NOT EXISTS mail_accounts_user_provider_address_idx
  ON mail_accounts(user_id, provider, address);
CREATE UNIQUE INDEX IF NOT EXISTS mail_messages_account_provider_message_idx
  ON mail_messages(account_id, provider_message_id);
