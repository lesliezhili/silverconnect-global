import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import type postgres from "postgres";
import * as schema from "./schema";
import { createPgClient } from "./pg-connection";

type PgClient = ReturnType<typeof postgres>;
const g = globalThis as unknown as { __scPg?: PgClient; __scDb?: ReturnType<typeof drizzle> };

function getClient(): PgClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  if (g.__scPg) return g.__scPg;
  const client = createPgClient(url, 10);
  if (process.env.NODE_ENV !== "production") g.__scPg = client;
  return client;
}

function getDb() {
  if (g.__scDb) return g.__scDb;
  const instance = drizzle(getClient(), { schema });
  if (process.env.NODE_ENV !== "production") g.__scDb = instance;
  return instance;
}

/** Lazy DB handle — avoids throwing at import time during `next build`. */
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance as object, prop, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export { schema };
export type DB = ReturnType<typeof drizzle<typeof schema>>;
