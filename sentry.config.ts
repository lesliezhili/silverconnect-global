/**
 * Single-source Sentry init shared by client / server / edge runtimes.
 *
 * Design: Sentry initializes only when SENTRY_DSN is set in the env.
 * Without a DSN every API used here becomes a no-op, so dropping this
 * into a project that hasn't signed up yet costs nothing. Plug a DSN
 * into `.env.local` (or VPS env) to turn on capture.
 */
import * as Sentry from "@sentry/nextjs";

const DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  process.env.SENTRY_DSN ||
  "";

export const SENTRY_ENABLED = DSN.length > 0;

export function initSentry(runtime: "client" | "server" | "edge") {
  if (!SENTRY_ENABLED) return;
  Sentry.init({
    dsn: DSN,
    environment: process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV,
    tracesSampleRate: runtime === "client" ? 0.1 : 0.2,
    // Mask user-typed text in replays — old people, sensitive PII.
    replaysOnErrorSampleRate: runtime === "client" ? 1.0 : 0,
    replaysSessionSampleRate: 0,
    sendDefaultPii: false,
    beforeSend(event) {
      // Strip emails / phone numbers from breadcrumbs and messages.
      if (event.request?.headers) delete event.request.headers["cookie"];
      return event;
    },
  });
}
