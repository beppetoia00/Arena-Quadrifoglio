import "server-only";
import { cache } from "react";
import { ConflictError, loadRaw, saveRaw } from "./storage";
import { DB } from "./types";

/** Read the database once per request (React cache). */
export const getDb = cache(async (): Promise<DB> => (await loadRaw()).data);

/**
 * Atomically mutate the database with optimistic concurrency.
 * The mutator may return a value which is passed back to the caller.
 */
export async function mutateDb<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, etag } = await loadRaw();
    const result = await fn(data);
    try {
      await saveRaw(data, etag);
      return result;
    } catch (e) {
      lastError = e;
      if (e instanceof ConflictError) {
        await new Promise((r) => setTimeout(r, 60 + Math.random() * 120));
        continue;
      }
      throw e;
    }
  }
  throw lastError ?? new Error("Impossibile salvare");
}

export function newId(prefix = "") {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}${Date.now().toString(36)}${rand}`;
}
