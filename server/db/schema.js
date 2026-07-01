import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const taskStatus = pgEnum("task_status", [
  "To Do",
  "In Progress",
  "Done",
]);

export const mailProvider = pgEnum("mail_provider", ["google", "zfn"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const oauthAccounts = pgTable("oauth_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: mailProvider("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  accessTokenCiphertext: text("access_token_ciphertext"),
  refreshTokenCiphertext: text("refresh_token_ciphertext"),
  scope: text("scope"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const mailAccounts = pgTable("mail_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: mailProvider("provider").notNull(),
  address: text("address").notNull(),
  displayName: text("display_name").notNull(),
  imapHost: text("imap_host"),
  imapPort: integer("imap_port"),
  imapUsername: text("imap_username"),
  encryptedSecret: text("encrypted_secret"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const mailMessages = pgTable("mail_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => mailAccounts.id, { onDelete: "cascade" }),
  providerMessageId: text("provider_message_id").notNull(),
  sender: text("sender").notNull(),
  subject: text("subject").notNull(),
  snippet: text("snippet"),
  action: text("action").notNull().default("Review"),
  priority: integer("priority").notNull().default(0),
  receivedAt: timestamp("received_at", { withTimezone: true }),
  rawMetadata: jsonb("raw_metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const boards = pgTable("boards", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  boardId: uuid("board_id").references(() => boards.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  status: taskStatus("status").notNull().default("To Do"),
  priority: text("priority").notNull().default("medium"),
  dueAt: text("due_at"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const subtasks = pgTable("subtasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const journalEntries = pgTable("journal_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mood: text("mood").notNull(),
  focus: text("focus").notNull(),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const syncRuns = pgTable("sync_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  mailAccountId: uuid("mail_account_id")
    .notNull()
    .references(() => mailAccounts.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  message: text("message"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
});
