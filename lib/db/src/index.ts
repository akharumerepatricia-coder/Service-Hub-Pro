import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

let _pool: InstanceType<typeof Pool> | undefined;
let _db: DbInstance | undefined;

function requirePool(): InstanceType<typeof Pool> {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?",
      );
    }
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return _pool;
}

function requireDb(): DbInstance {
  if (!_db) {
    _db = drizzle(requirePool(), { schema });
  }
  return _db;
}

/**
 * Lazy proxy: the pool and db connections are only created on first access,
 * not at module-import time. This lets endpoints like /api/healthz start up
 * on Vercel (or any environment) even before DATABASE_URL is configured —
 * the error surfaces only when a route actually queries the database.
 */
export const pool = new Proxy({} as InstanceType<typeof Pool>, {
  get(_target, prop) {
    const instance = requirePool();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export const db = new Proxy({} as DbInstance, {
  get(_target, prop) {
    const instance = requireDb();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export * from "./schema";
