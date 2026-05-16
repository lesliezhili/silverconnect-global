import postgres from "postgres";

/** SSL mode for Postgres.js — local/docker uses DATABASE_SSL=false. */
export function pgSslMode(url: string): false | "require" {
  if (process.env.DATABASE_SSL === "false") return false;
  try {
    const host = new URL(url.replace(/^postgres:/, "postgresql:")).hostname;
    if (host === "localhost" || host === "127.0.0.1") return false;
  } catch {
    /* default to require */
  }
  return "require";
}

export function createPgClient(url: string, max = 5) {
  return postgres(url, {
    ssl: pgSslMode(url),
    prepare: false,
    max,
  });
}
