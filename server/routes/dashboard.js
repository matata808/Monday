import { z } from "zod";
import { getPool, hasDatabase } from "../db/client.js";
import { getSqliteDb } from "../db/sqlite.js";
import { demoDashboard } from "../data/demoDashboard.js";
import {
  createPostgresBoard,
  createPostgresJournalEntry,
  createPostgresSubtask,
  createPostgresTask,
  deletePostgresBoard,
  deletePostgresSubtask,
  deletePostgresTask,
  readPostgresDashboard,
  updatePostgresSubtask,
  updatePostgresTask,
} from "../repositories/postgresDashboard.js";
import {
  createSqliteBoard,
  createSqliteJournalEntry,
  createSqliteSubtask,
  createSqliteTask,
  deleteSqliteBoard,
  deleteSqliteSubtask,
  deleteSqliteTask,
  readSqliteDashboard,
  updateSqliteSubtask,
  updateSqliteTask,
} from "../repositories/sqliteDashboard.js";

const taskSchema = z.object({
  boardId: z.string().optional(),
  title: z.string().trim().min(1),
  description: z.string().trim().default(""),
  status: z.enum(["To Do", "In Progress", "Done"]).default("To Do"),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  due: z.string().trim().default(""),
});

const taskUpdateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  status: z.enum(["To Do", "In Progress", "Done"]).optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  due: z.string().trim().optional(),
  position: z.number().int().min(0).optional(),
});

const boardSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().default(""),
});

const subtaskSchema = z.object({
  title: z.string().trim().min(1),
});

const subtaskUpdateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  completed: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

const journalSchema = z.object({
  mood: z.string().trim().min(1),
  focus: z.string().trim().min(1),
  note: z.string().trim().default(""),
});

export async function dashboardRoutes(fastify) {
  fastify.get("/api/dashboard", async () => {
    if (!hasDatabase()) {
      const sqlite = getSqliteDb();
      const dashboard = readSqliteDashboard(sqlite);
      return {
        source: "sqlite",
        ...dashboard,
        mailAccounts:
          dashboard.mailAccounts.length > 0
            ? dashboard.mailAccounts
            : demoDashboard.mailAccounts,
      };
    }

    const dashboard = await readPostgresDashboard(getPool());
    return { source: "database", ...dashboard };
  });

  fastify.post("/api/tasks", async (request, reply) => {
    const parsed = taskSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid task", issues: parsed.error.issues });
    }

    if (!hasDatabase()) {
      const task = createSqliteTask(getSqliteDb(), parsed.data);
      return reply.code(201).send({ mode: "sqlite", task });
    }

    const task = await createPostgresTask(getPool(), parsed.data);
    return reply.code(201).send({ mode: "postgres", task });
  });

  fastify.patch("/api/tasks/:taskId", async (request, reply) => {
    const parsed = taskUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: "Invalid task update", issues: parsed.error.issues });
    }

    const updates = { ...parsed.data };
    if ("due" in updates) {
      updates.due_at = updates.due;
      delete updates.due;
    }

    if (!hasDatabase()) {
      const task = updateSqliteTask(getSqliteDb(), request.params.taskId, updates);
      if (!task) return reply.code(404).send({ error: "Task not found" });
      return { mode: "sqlite", task };
    }

    const task = await updatePostgresTask(getPool(), request.params.taskId, updates);
    if (!task) return reply.code(404).send({ error: "Task not found" });
    return { mode: "postgres", task };
  });

  fastify.delete("/api/tasks/:taskId", async (request) => {
    if (!hasDatabase()) {
      return { mode: "sqlite", ...deleteSqliteTask(getSqliteDb(), request.params.taskId) };
    }

    return {
      mode: "postgres",
      ...(await deletePostgresTask(getPool(), request.params.taskId)),
    };
  });

  fastify.post("/api/boards", async (request, reply) => {
    const parsed = boardSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: "Invalid board", issues: parsed.error.issues });
    }

    if (!hasDatabase()) {
      const board = createSqliteBoard(getSqliteDb(), parsed.data);
      return reply.code(201).send({ mode: "sqlite", board });
    }

    const board = await createPostgresBoard(getPool(), parsed.data);
    return reply.code(201).send({ mode: "postgres", board });
  });

  fastify.delete("/api/boards/:boardId", async (request) => {
    if (!hasDatabase()) {
      return {
        mode: "sqlite",
        ...deleteSqliteBoard(getSqliteDb(), request.params.boardId),
      };
    }

    return {
      mode: "postgres",
      ...(await deletePostgresBoard(getPool(), request.params.boardId)),
    };
  });

  fastify.post("/api/tasks/:taskId/subtasks", async (request, reply) => {
    const parsed = subtaskSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: "Invalid subtask", issues: parsed.error.issues });
    }

    if (!hasDatabase()) {
      const subtask = createSqliteSubtask(
        getSqliteDb(),
        request.params.taskId,
        parsed.data.title,
      );
      return reply.code(201).send({ mode: "sqlite", subtask });
    }

    const subtask = await createPostgresSubtask(
      getPool(),
      request.params.taskId,
      parsed.data.title,
    );
    return reply.code(201).send({ mode: "postgres", subtask });
  });

  fastify.patch("/api/subtasks/:subtaskId", async (request, reply) => {
    const parsed = subtaskUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: "Invalid subtask update", issues: parsed.error.issues });
    }

    if (!hasDatabase()) {
      const subtask = updateSqliteSubtask(
        getSqliteDb(),
        request.params.subtaskId,
        parsed.data,
      );
      if (!subtask) return reply.code(404).send({ error: "Subtask not found" });
      return { mode: "sqlite", subtask };
    }

    const subtask = await updatePostgresSubtask(
      getPool(),
      request.params.subtaskId,
      parsed.data,
    );
    if (!subtask) return reply.code(404).send({ error: "Subtask not found" });
    return { mode: "postgres", subtask };
  });

  fastify.delete("/api/subtasks/:subtaskId", async (request) => {
    if (!hasDatabase()) {
      return {
        mode: "sqlite",
        ...deleteSqliteSubtask(getSqliteDb(), request.params.subtaskId),
      };
    }

    return {
      mode: "postgres",
      ...(await deletePostgresSubtask(getPool(), request.params.subtaskId)),
    };
  });

  fastify.post("/api/journal", async (request, reply) => {
    const parsed = journalSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: "Invalid journal entry", issues: parsed.error.issues });
    }

    if (!hasDatabase()) {
      const entry = createSqliteJournalEntry(getSqliteDb(), parsed.data);
      return reply.code(201).send({ mode: "sqlite", entry });
    }

    const entry = await createPostgresJournalEntry(getPool(), parsed.data);
    return reply.code(201).send({ mode: "postgres", entry });
  });
}
