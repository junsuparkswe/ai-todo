import * as Sentry from "@sentry/nextjs";

/**
 * Loads Sentry configuration for the current Next.js runtime.
 *
 * Dynamically imports and initializes the runtime-specific Sentry config module:
 * `./sentry.server.config` when `process.env.NEXT_RUNTIME` is "nodejs" and
 * `./sentry.edge.config` when it is "edge".
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
