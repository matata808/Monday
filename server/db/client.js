import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { config } from "../config.js";
import * as schema from "./schema.js";

const { Pool } = pg;

let pool;
let db;

export function hasDatabase() {
  return Boolean(config.databaseUrl);
}

export function getDb() {
  if (!hasDatabase()) return null;
  const activePool = getPool();
  if (!db) db = drizzle(activePool, { schema });
  return db;
}

export function getPool() {
  if (!hasDatabase()) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: config.databaseUrl,
    });
  }
  return pool;
}

export async function closeDb() {
  if (!pool) return;
  await pool.end();
  pool = undefined;
  db = undefined;
}
