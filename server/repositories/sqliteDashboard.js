import crypto from "node:crypto";
import { decryptSecret, encryptSecret } from "../security/secrets.js";

function id() {
  return crypto.randomUUID();
}

export function upsertGoogleAccount(database, { profile, tokens }) {
  const userId = id();
  const accountId = id();
  const mailAccountId = id();
  const email = profile.email;
  const displayName = profile.name || email;
  const expiresAt = tokens.expiry_date
    ? new Date(tokens.expiry_date).toISOString()
    : null;

  const existingUser = database
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email);
  const resolvedUserId = existingUser?.id ?? userId;

  if (!existingUser) {
    database
      .prepare(
        "INSERT INTO users (id, email, display_name) VALUES (?, ?, ?)",
      )
      .run(resolvedUserId, email, displayName);
  } else {
    database
      .prepare("UPDATE users SET display_name = ? WHERE id = ?")
      .run(displayName, resolvedUserId);
  }

  database
    .prepare(
      `
      INSERT INTO oauth_accounts (
        id,
        user_id,
        provider,
        provider_account_id,
        access_token_ciphertext,
        refresh_token_ciphertext,
        scope,
        expires_at
      )
      VALUES (?, ?, 'google', ?, ?, ?, ?, ?)
      ON CONFLICT(provider, provider_account_id)
      DO UPDATE SET
        access_token_ciphertext = excluded.access_token_ciphertext,
        refresh_token_ciphertext = COALESCE(
          excluded.refresh_token_ciphertext,
          oauth_accounts.refresh_token_ciphertext
        ),
        scope = excluded.scope,
        expires_at = excluded.expires_at
    `,
    )
    .run(
      accountId,
      resolvedUserId,
      profile.sub,
      encryptSecret(tokens.access_token),
      encryptSecret(tokens.refresh_token),
      tokens.scope ?? "",
      expiresAt,
    );

  database
    .prepare(
      `
      INSERT INTO mail_accounts (id, user_id, provider, address, display_name)
      VALUES (?, ?, 'google', ?, 'Gmail')
      ON CONFLICT(user_id, provider, address)
      DO UPDATE SET display_name = excluded.display_name
    `,
    )
    .run(mailAccountId, resolvedUserId, email);

  return {
    userId: resolvedUserId,
    email,
    displayName,
    expiresAt,
  };
}

export function getOrCreateLocalUser(database) {
  const email = "local.dashboard@example.test";
  const existing = database
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email);
  if (existing) return existing;

  const user = {
    id: id(),
    email,
    display_name: "Local Dashboard",
  };
  database
    .prepare("INSERT INTO users (id, email, display_name) VALUES (?, ?, ?)")
    .run(user.id, user.email, user.display_name);
  return user;
}

export function getOrCreateDefaultBoard(database, userId) {
  const existing = database
    .prepare("SELECT * FROM boards WHERE user_id = ? ORDER BY position ASC LIMIT 1")
    .get(userId);
  if (existing) return existing;

  const board = {
    id: id(),
    userId,
    name: "Monday board",
    description: "Inbox-driven personal work queue",
  };
  database
    .prepare(
      "INSERT INTO boards (id, user_id, name, description, position) VALUES (?, ?, ?, ?, 0)",
    )
    .run(board.id, board.userId, board.name, board.description);
  return {
    id: board.id,
    user_id: board.userId,
    name: board.name,
    description: board.description,
    position: 0,
  };
}

function normalizeTask(task, subtasks = []) {
  return {
    id: task.id,
    boardId: task.board_id,
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    priority: task.priority ?? "medium",
    due: task.due_at ?? "",
    position: task.position ?? 0,
    subtasks: subtasks.map((subtask) => ({
      id: subtask.id,
      taskId: subtask.task_id,
      title: subtask.title,
      completed: Boolean(subtask.completed),
      position: subtask.position ?? 0,
    })),
  };
}

function backfillTaskBoards(database, userId, boardId) {
  database
    .prepare("UPDATE tasks SET board_id = ? WHERE user_id = ? AND board_id IS NULL")
    .run(boardId, userId);
}

export function readSqliteDashboard(database) {
  const user = getOrCreateLocalUser(database);
  const defaultBoard = getOrCreateDefaultBoard(database, user.id);
  backfillTaskBoards(database, user.id, defaultBoard.id);

  const boardRows = database
    .prepare("SELECT * FROM boards WHERE user_id = ? ORDER BY position ASC, created_at ASC")
    .all(user.id);
  const taskRows = database
    .prepare(
      "SELECT * FROM tasks WHERE user_id = ? ORDER BY board_id ASC, status ASC, position ASC, created_at DESC",
    )
    .all(user.id);
  const subtaskRows = database
    .prepare(
      `
      SELECT subtasks.*
      FROM subtasks
      JOIN tasks ON tasks.id = subtasks.task_id
      WHERE tasks.user_id = ?
      ORDER BY subtasks.task_id ASC, subtasks.position ASC, subtasks.created_at ASC
    `,
    )
    .all(user.id);
  const subtasksByTaskId = subtaskRows.reduce((grouped, subtask) => {
    grouped.set(subtask.task_id, [
      ...(grouped.get(subtask.task_id) ?? []),
      subtask,
    ]);
    return grouped;
  }, new Map());
  const journalRows = database
    .prepare(
      "SELECT * FROM journal_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
    )
    .all(user.id);
  const accountRows = database
    .prepare("SELECT * FROM mail_accounts ORDER BY created_at DESC")
    .all();

  return {
    boards: boardRows.map((board) => ({
      id: board.id,
      name: board.name,
      description: board.description,
      position: board.position,
      taskCount: taskRows.filter((task) => task.board_id === board.id).length,
    })),
    activeBoardId: defaultBoard.id,
    tasks: taskRows.map((task) =>
      normalizeTask(task, subtasksByTaskId.get(task.id) ?? []),
    ),
    mailAccounts: accountRows.map((account) => {
      const messages = database
        .prepare(
          "SELECT * FROM mail_messages WHERE account_id = ? ORDER BY received_at DESC LIMIT 5",
        )
        .all(account.id);
      const messageStats = database
        .prepare(
          "SELECT count(*) AS total, sum(CASE WHEN priority > 0 THEN 1 ELSE 0 END) AS priority_total FROM mail_messages WHERE account_id = ?",
        )
        .get(account.id);

      return {
        id: account.id,
        name: account.display_name,
        address: account.address,
        inboxUrl:
          account.provider === "google"
            ? "https://mail.google.com/"
            : "https://webmail.zfn.uni-bremen.de/",
        unread: messageStats.total,
        priority: messageStats.priority_total ?? 0,
        lastChecked: account.last_synced_at ?? "Not synced",
        nextAction: messages[0]?.action ?? `Sync ${account.display_name}.`,
        threads: messages.map((message) => ({
          id: message.id,
          from: message.sender,
          subject: message.subject,
          action: message.action,
        })),
      };
    }),
    journalEntries: journalRows.map((entry) => ({
      id: entry.id,
      date: new Date(entry.created_at).toLocaleDateString("en", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
      mood: entry.mood,
      focus: entry.focus,
      note: entry.note,
    })),
  };
}

export function createSqliteTask(
  database,
  {
    boardId,
    title,
    description = "",
    status = "To Do",
    priority = "medium",
    due = "",
  },
) {
  const user = getOrCreateLocalUser(database);
  const board = boardId
    ? database
        .prepare("SELECT * FROM boards WHERE id = ? AND user_id = ?")
        .get(boardId, user.id)
    : getOrCreateDefaultBoard(database, user.id);
  if (!board) throw new Error("Board not found");
  const maxPosition = database
    .prepare(
      "SELECT COALESCE(MAX(position), -1) AS max_position FROM tasks WHERE board_id = ? AND status = ?",
    )
    .get(board.id, status);
  const task = {
    id: id(),
    userId: user.id,
    boardId: board.id,
    title,
    description,
    status,
    priority,
    due,
    position: Number(maxPosition.max_position) + 1,
  };

  database
    .prepare(
      "INSERT INTO tasks (id, user_id, board_id, title, description, status, priority, due_at, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .run(
      task.id,
      task.userId,
      task.boardId,
      task.title,
      task.description,
      task.status,
      task.priority,
      task.due,
      task.position,
    );

  return {
    id: task.id,
    boardId: task.boardId,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    due: task.due,
    position: task.position,
    subtasks: [],
  };
}

export function createSqliteBoard(database, { name, description = "" }) {
  const user = getOrCreateLocalUser(database);
  const maxPosition = database
    .prepare(
      "SELECT COALESCE(MAX(position), -1) AS max_position FROM boards WHERE user_id = ?",
    )
    .get(user.id);
  const board = {
    id: id(),
    userId: user.id,
    name,
    description,
    position: Number(maxPosition.max_position) + 1,
  };

  database
    .prepare(
      "INSERT INTO boards (id, user_id, name, description, position) VALUES (?, ?, ?, ?, ?)",
    )
    .run(board.id, board.userId, board.name, board.description, board.position);

  return {
    id: board.id,
    name: board.name,
    description: board.description,
    position: board.position,
    taskCount: 0,
  };
}

export function deleteSqliteBoard(database, boardId) {
  const user = getOrCreateLocalUser(database);
  const boardCount = database
    .prepare("SELECT count(*) AS total FROM boards WHERE user_id = ?")
    .get(user.id);
  if (boardCount.total <= 1) {
    return { deleted: false, reason: "Keep at least one board" };
  }

  const result = database
    .prepare("DELETE FROM boards WHERE id = ? AND user_id = ?")
    .run(boardId, user.id);
  return { deleted: result.changes > 0 };
}

export function updateSqliteTask(database, taskId, updates) {
  const allowed = ["title", "description", "status", "priority", "due_at", "position"];
  const entries = Object.entries(updates).filter(
    ([key, value]) => allowed.includes(key) && value !== undefined,
  );
  if (entries.length === 0) return null;

  const assignments = entries.map(([key]) => `${key} = ?`).join(", ");
  const values = entries.map(([, value]) => value);
  database.prepare(`UPDATE tasks SET ${assignments} WHERE id = ?`).run(...values, taskId);

  const task = database.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId);
  if (!task) return null;
  const subtasks = database
    .prepare("SELECT * FROM subtasks WHERE task_id = ? ORDER BY position ASC")
    .all(taskId);
  return normalizeTask(task, subtasks);
}

export function deleteSqliteTask(database, taskId) {
  const result = database.prepare("DELETE FROM tasks WHERE id = ?").run(taskId);
  return { deleted: result.changes > 0 };
}

export function createSqliteSubtask(database, taskId, title) {
  const maxPosition = database
    .prepare(
      "SELECT COALESCE(MAX(position), -1) AS max_position FROM subtasks WHERE task_id = ?",
    )
    .get(taskId);
  const subtask = {
    id: id(),
    taskId,
    title,
    completed: 0,
    position: Number(maxPosition.max_position) + 1,
  };

  database
    .prepare(
      "INSERT INTO subtasks (id, task_id, title, completed, position) VALUES (?, ?, ?, ?, ?)",
    )
    .run(
      subtask.id,
      subtask.taskId,
      subtask.title,
      subtask.completed,
      subtask.position,
    );
  return {
    id: subtask.id,
    taskId: subtask.taskId,
    title: subtask.title,
    completed: false,
    position: subtask.position,
  };
}

export function updateSqliteSubtask(database, subtaskId, updates) {
  const allowed = ["title", "completed", "position"];
  const entries = Object.entries(updates).filter(([key]) => allowed.includes(key));
  if (entries.length === 0) return null;
  const assignments = entries.map(([key]) => `${key} = ?`).join(", ");
  const values = entries.map(([key, value]) =>
    key === "completed" ? Number(Boolean(value)) : value,
  );
  database
    .prepare(`UPDATE subtasks SET ${assignments} WHERE id = ?`)
    .run(...values, subtaskId);

  const subtask = database.prepare("SELECT * FROM subtasks WHERE id = ?").get(subtaskId);
  if (!subtask) return null;
  return {
    id: subtask.id,
    taskId: subtask.task_id,
    title: subtask.title,
    completed: Boolean(subtask.completed),
    position: subtask.position,
  };
}

export function deleteSqliteSubtask(database, subtaskId) {
  const result = database.prepare("DELETE FROM subtasks WHERE id = ?").run(subtaskId);
  return { deleted: result.changes > 0 };
}

export function createSqliteJournalEntry(database, { mood, focus, note }) {
  const user = getOrCreateLocalUser(database);
  const entry = {
    id: id(),
    userId: user.id,
    mood,
    focus,
    note,
    createdAt: new Date().toISOString(),
  };

  database
    .prepare(
      "INSERT INTO journal_entries (id, user_id, mood, focus, note, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(entry.id, entry.userId, entry.mood, entry.focus, entry.note, entry.createdAt);

  return entry;
}

export function getLatestGoogleOAuthAccount(database) {
  const account = database
    .prepare(
      `
      SELECT oauth_accounts.*, users.email
      FROM oauth_accounts
      JOIN users ON users.id = oauth_accounts.user_id
      WHERE oauth_accounts.provider = 'google'
      ORDER BY oauth_accounts.created_at DESC
      LIMIT 1
    `,
    )
    .get();

  if (!account) return null;

  return {
    ...account,
    accessToken: decryptSecret(account.access_token_ciphertext),
    refreshToken: decryptSecret(account.refresh_token_ciphertext),
  };
}

export function upsertMailMessages(database, accountAddress, messages) {
  const account = database
    .prepare(
      "SELECT * FROM mail_accounts WHERE provider = 'google' AND address = ?",
    )
    .get(accountAddress);
  if (!account) return 0;

  const insert = database.prepare(`
    INSERT INTO mail_messages (
      id,
      account_id,
      provider_message_id,
      sender,
      subject,
      snippet,
      action,
      priority,
      received_at,
      raw_metadata
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(account_id, provider_message_id)
    DO UPDATE SET
      sender = excluded.sender,
      subject = excluded.subject,
      snippet = excluded.snippet,
      action = excluded.action,
      priority = excluded.priority,
      received_at = excluded.received_at,
      raw_metadata = excluded.raw_metadata
  `);

  database.exec("BEGIN");
  try {
    for (const message of messages) {
      insert.run(
        id(),
        account.id,
        message.providerMessageId,
        message.sender,
        message.subject,
        message.snippet,
        message.action,
        message.priority,
        message.receivedAt,
        JSON.stringify(message.rawMetadata ?? {}),
      );
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }

  database
    .prepare("UPDATE mail_accounts SET last_synced_at = ? WHERE id = ?")
    .run(new Date().toISOString(), account.id);

  return messages.length;
}
