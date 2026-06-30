import { decryptSecret, encryptSecret } from "../security/secrets.js";

const localUser = {
  email: "local.dashboard@example.test",
  displayName: "Local Dashboard",
};

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

export async function upsertPostgresGoogleAccount(pool, { profile, tokens }) {
  const client = await pool.connect();
  const email = profile.email;
  const displayName = profile.name || email;
  const expiresAt = tokens.expiry_date
    ? new Date(tokens.expiry_date).toISOString()
    : null;

  try {
    await client.query("BEGIN");
    const userResult = await client.query(
      `
        INSERT INTO users (email, display_name)
        VALUES ($1, $2)
        ON CONFLICT (email)
        DO UPDATE SET display_name = EXCLUDED.display_name
        RETURNING *
      `,
      [email, displayName],
    );
    const user = userResult.rows[0];

    await client.query(
      `
        INSERT INTO oauth_accounts (
          user_id,
          provider,
          provider_account_id,
          access_token_ciphertext,
          refresh_token_ciphertext,
          scope,
          expires_at
        )
        VALUES ($1, 'google', $2, $3, $4, $5, $6)
        ON CONFLICT (provider, provider_account_id)
        DO UPDATE SET
          access_token_ciphertext = EXCLUDED.access_token_ciphertext,
          refresh_token_ciphertext = COALESCE(
            EXCLUDED.refresh_token_ciphertext,
            oauth_accounts.refresh_token_ciphertext
          ),
          scope = EXCLUDED.scope,
          expires_at = EXCLUDED.expires_at
      `,
      [
        user.id,
        profile.sub,
        encryptSecret(tokens.access_token),
        encryptSecret(tokens.refresh_token),
        tokens.scope ?? "",
        expiresAt,
      ],
    );

    await client.query(
      `
        INSERT INTO mail_accounts (user_id, provider, address, display_name)
        VALUES ($1, 'google', $2, 'Gmail')
        ON CONFLICT (user_id, provider, address)
        DO UPDATE SET display_name = EXCLUDED.display_name
      `,
      [user.id, email],
    );

    await client.query("COMMIT");
    return {
      userId: user.id,
      email,
      displayName,
      expiresAt,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getLatestPostgresGoogleOAuthAccount(pool) {
  const result = await pool.query(
    `
      SELECT oauth_accounts.*, users.email
      FROM oauth_accounts
      JOIN users ON users.id = oauth_accounts.user_id
      WHERE oauth_accounts.provider = 'google'
      ORDER BY oauth_accounts.created_at DESC
      LIMIT 1
    `,
  );
  const account = result.rows[0];
  if (!account) return null;

  return {
    ...account,
    accessToken: decryptSecret(account.access_token_ciphertext),
    refreshToken: decryptSecret(account.refresh_token_ciphertext),
  };
}

export async function upsertPostgresMailMessages(pool, accountAddress, messages) {
  const accountResult = await pool.query(
    "SELECT * FROM mail_accounts WHERE provider = 'google' AND address = $1",
    [accountAddress],
  );
  const account = accountResult.rows[0];
  if (!account) return 0;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const message of messages) {
      await client.query(
        `
          INSERT INTO mail_messages (
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
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (account_id, provider_message_id)
          DO UPDATE SET
            sender = EXCLUDED.sender,
            subject = EXCLUDED.subject,
            snippet = EXCLUDED.snippet,
            action = EXCLUDED.action,
            priority = EXCLUDED.priority,
            received_at = EXCLUDED.received_at,
            raw_metadata = EXCLUDED.raw_metadata
        `,
        [
          account.id,
          message.providerMessageId,
          message.sender,
          message.subject,
          message.snippet,
          message.action,
          message.priority,
          message.receivedAt,
          message.rawMetadata ?? {},
        ],
      );
    }
    await client.query("UPDATE mail_accounts SET last_synced_at = now() WHERE id = $1", [
      account.id,
    ]);
    await client.query("COMMIT");
    return messages.length;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getOrCreatePostgresLocalUser(pool) {
  const result = await pool.query(
    `
      INSERT INTO users (email, display_name)
      VALUES ($1, $2)
      ON CONFLICT (email)
      DO UPDATE SET display_name = EXCLUDED.display_name
      RETURNING *
    `,
    [localUser.email, localUser.displayName],
  );
  return result.rows[0];
}

export async function getOrCreatePostgresDefaultBoard(pool, userId) {
  const existing = await pool.query(
    "SELECT * FROM boards WHERE user_id = $1 ORDER BY position ASC LIMIT 1",
    [userId],
  );
  if (existing.rows[0]) return existing.rows[0];

  const created = await pool.query(
    `
      INSERT INTO boards (user_id, name, description, position)
      VALUES ($1, 'Monday board', 'Inbox-driven personal work queue', 0)
      RETURNING *
    `,
    [userId],
  );
  return created.rows[0];
}

export async function readPostgresDashboard(pool) {
  const user = await getOrCreatePostgresLocalUser(pool);
  const defaultBoard = await getOrCreatePostgresDefaultBoard(pool, user.id);
  await pool.query(
    "UPDATE tasks SET board_id = $1 WHERE user_id = $2 AND board_id IS NULL",
    [defaultBoard.id, user.id],
  );

  const [boards, tasks, subtasks, journals, accounts] = await Promise.all([
    pool.query(
      "SELECT * FROM boards WHERE user_id = $1 ORDER BY position ASC, created_at ASC",
      [user.id],
    ),
    pool.query(
      "SELECT * FROM tasks WHERE user_id = $1 ORDER BY board_id ASC, status ASC, position ASC, created_at DESC",
      [user.id],
    ),
    pool.query(
      `
        SELECT subtasks.*
        FROM subtasks
        JOIN tasks ON tasks.id = subtasks.task_id
        WHERE tasks.user_id = $1
        ORDER BY subtasks.task_id ASC, subtasks.position ASC, subtasks.created_at ASC
      `,
      [user.id],
    ),
    pool.query(
      "SELECT * FROM journal_entries WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20",
      [user.id],
    ),
    pool.query("SELECT * FROM mail_accounts ORDER BY created_at DESC"),
  ]);

  const subtasksByTaskId = subtasks.rows.reduce((grouped, subtask) => {
    grouped.set(subtask.task_id, [
      ...(grouped.get(subtask.task_id) ?? []),
      subtask,
    ]);
    return grouped;
  }, new Map());

  const mailAccounts = await Promise.all(
    accounts.rows.map(async (account) => {
      const [messages, stats] = await Promise.all([
        pool.query(
          "SELECT * FROM mail_messages WHERE account_id = $1 ORDER BY received_at DESC LIMIT 5",
          [account.id],
        ),
        pool.query(
          "SELECT count(*)::int AS total, COALESCE(sum(CASE WHEN priority > 0 THEN 1 ELSE 0 END), 0)::int AS priority_total FROM mail_messages WHERE account_id = $1",
          [account.id],
        ),
      ]);

      return {
        id: account.id,
        name: account.display_name,
        address: account.address,
        inboxUrl:
          account.provider === "google"
            ? "https://mail.google.com/"
            : "https://webmail.zfn.uni-bremen.de/",
        unread: stats.rows[0].total,
        priority: stats.rows[0].priority_total,
        lastChecked: account.last_synced_at?.toISOString() ?? "Not synced",
        nextAction: messages.rows[0]?.action ?? `Sync ${account.display_name}.`,
        threads: messages.rows.map((message) => ({
          id: message.id,
          from: message.sender,
          subject: message.subject,
          action: message.action,
        })),
      };
    }),
  );

  return {
    boards: boards.rows.map((board) => ({
      id: board.id,
      name: board.name,
      description: board.description,
      position: board.position,
      taskCount: tasks.rows.filter((task) => task.board_id === board.id).length,
    })),
    activeBoardId: defaultBoard.id,
    tasks: tasks.rows.map((task) =>
      normalizeTask(task, subtasksByTaskId.get(task.id) ?? []),
    ),
    mailAccounts,
    journalEntries: journals.rows.map((entry) => ({
      id: entry.id,
      date: entry.created_at.toLocaleDateString("en", {
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

export async function createPostgresBoard(pool, { name, description = "" }) {
  const user = await getOrCreatePostgresLocalUser(pool);
  const maxPosition = await pool.query(
    "SELECT COALESCE(MAX(position), -1) AS max_position FROM boards WHERE user_id = $1",
    [user.id],
  );
  const result = await pool.query(
    `
      INSERT INTO boards (user_id, name, description, position)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [user.id, name, description, Number(maxPosition.rows[0].max_position) + 1],
  );
  const board = result.rows[0];
  return {
    id: board.id,
    name: board.name,
    description: board.description,
    position: board.position,
    taskCount: 0,
  };
}

export async function deletePostgresBoard(pool, boardId) {
  const user = await getOrCreatePostgresLocalUser(pool);
  const boardCount = await pool.query(
    "SELECT count(*)::int AS total FROM boards WHERE user_id = $1",
    [user.id],
  );
  if (boardCount.rows[0].total <= 1) {
    return { deleted: false, reason: "Keep at least one board" };
  }

  const result = await pool.query("DELETE FROM boards WHERE id = $1 AND user_id = $2", [
    boardId,
    user.id,
  ]);
  return { deleted: result.rowCount > 0 };
}

export async function createPostgresTask(
  pool,
  {
    boardId,
    title,
    description = "",
    status = "To Do",
    priority = "medium",
    due = "",
  },
) {
  const user = await getOrCreatePostgresLocalUser(pool);
  const board = boardId
    ? await pool.query("SELECT * FROM boards WHERE id = $1 AND user_id = $2", [
        boardId,
        user.id,
      ])
    : { rows: [await getOrCreatePostgresDefaultBoard(pool, user.id)] };
  if (!board.rows[0]) throw new Error("Board not found");

  const maxPosition = await pool.query(
    "SELECT COALESCE(MAX(position), -1) AS max_position FROM tasks WHERE board_id = $1 AND status = $2",
    [board.rows[0].id, status],
  );
  const result = await pool.query(
    `
      INSERT INTO tasks (
        user_id,
        board_id,
        title,
        description,
        status,
        priority,
        due_at,
        position
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
    [
      user.id,
      board.rows[0].id,
      title,
      description,
      status,
      priority,
      due,
      Number(maxPosition.rows[0].max_position) + 1,
    ],
  );
  return normalizeTask(result.rows[0], []);
}

export async function updatePostgresTask(pool, taskId, updates) {
  const allowed = ["title", "description", "status", "priority", "due_at", "position"];
  const entries = Object.entries(updates).filter(
    ([key, value]) => allowed.includes(key) && value !== undefined,
  );
  if (entries.length === 0) return null;

  const assignments = entries
    .map(([key], index) => `${key} = $${index + 1}`)
    .join(", ");
  const values = entries.map(([, value]) => value);
  const result = await pool.query(
    `UPDATE tasks SET ${assignments} WHERE id = $${values.length + 1} RETURNING *`,
    [...values, taskId],
  );
  const task = result.rows[0];
  if (!task) return null;
  const subtasks = await pool.query(
    "SELECT * FROM subtasks WHERE task_id = $1 ORDER BY position ASC",
    [taskId],
  );
  return normalizeTask(task, subtasks.rows);
}

export async function deletePostgresTask(pool, taskId) {
  const result = await pool.query("DELETE FROM tasks WHERE id = $1", [taskId]);
  return { deleted: result.rowCount > 0 };
}

export async function createPostgresSubtask(pool, taskId, title) {
  const maxPosition = await pool.query(
    "SELECT COALESCE(MAX(position), -1) AS max_position FROM subtasks WHERE task_id = $1",
    [taskId],
  );
  const result = await pool.query(
    `
      INSERT INTO subtasks (task_id, title, completed, position)
      VALUES ($1, $2, false, $3)
      RETURNING *
    `,
    [taskId, title, Number(maxPosition.rows[0].max_position) + 1],
  );
  const subtask = result.rows[0];
  return {
    id: subtask.id,
    taskId: subtask.task_id,
    title: subtask.title,
    completed: Boolean(subtask.completed),
    position: subtask.position,
  };
}

export async function updatePostgresSubtask(pool, subtaskId, updates) {
  const allowed = ["title", "completed", "position"];
  const entries = Object.entries(updates).filter(
    ([key, value]) => allowed.includes(key) && value !== undefined,
  );
  if (entries.length === 0) return null;
  const assignments = entries
    .map(([key], index) => `${key} = $${index + 1}`)
    .join(", ");
  const values = entries.map(([, value]) => value);
  const result = await pool.query(
    `UPDATE subtasks SET ${assignments} WHERE id = $${values.length + 1} RETURNING *`,
    [...values, subtaskId],
  );
  const subtask = result.rows[0];
  if (!subtask) return null;
  return {
    id: subtask.id,
    taskId: subtask.task_id,
    title: subtask.title,
    completed: Boolean(subtask.completed),
    position: subtask.position,
  };
}

export async function deletePostgresSubtask(pool, subtaskId) {
  const result = await pool.query("DELETE FROM subtasks WHERE id = $1", [subtaskId]);
  return { deleted: result.rowCount > 0 };
}

export async function createPostgresJournalEntry(pool, { mood, focus, note }) {
  const user = await getOrCreatePostgresLocalUser(pool);
  const result = await pool.query(
    `
      INSERT INTO journal_entries (user_id, mood, focus, note)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [user.id, mood, focus, note],
  );
  return result.rows[0];
}
