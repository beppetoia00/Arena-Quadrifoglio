import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { get, put, BlobPreconditionFailedError } from "@vercel/blob";
import { DB, emptyDb } from "./types";

/**
 * Storage layer.
 * - On Vercel (BLOB_READ_WRITE_TOKEN set) the whole database lives in one private
 *   JSON blob, read with the CDN cache bypassed and written with ETag conditional
 *   writes (optimistic concurrency). Photos are private blobs served via /api/photo.
 * - Locally (no token) everything is written to ./.data (git-ignored).
 */

const DB_PATH = "db/arena.json";
const LOCAL_DIR = path.join(process.cwd(), ".data");
const LOCAL_DB = path.join(LOCAL_DIR, "db.json");
const LOCAL_PHOTOS = path.join(LOCAL_DIR, "photos");

export const usesBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export class ConflictError extends Error {
  constructor() {
    super("conflict");
  }
}

export interface Loaded {
  data: DB;
  etag?: string;
}

async function streamToString(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export async function loadRaw(): Promise<Loaded> {
  if (usesBlob()) {
    const res = await get(DB_PATH, { access: "private", useCache: false });
    if (!res || !res.stream) return { data: emptyDb() };
    const text = await streamToString(res.stream);
    const data = normalize(JSON.parse(text));
    return { data, etag: res.blob.etag };
  }
  try {
    const text = await fs.readFile(LOCAL_DB, "utf8");
    const data = normalize(JSON.parse(text));
    return { data, etag: String(data.v) };
  } catch {
    return { data: emptyDb() };
  }
}

export async function saveRaw(db: DB, etag?: string): Promise<void> {
  db.v = (db.v || 0) + 1;
  const body = JSON.stringify(db);
  if (usesBlob()) {
    try {
      await put(DB_PATH, body, {
        access: "private",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 60,
        ...(etag ? { ifMatch: etag } : {}),
      });
    } catch (e) {
      if (e instanceof BlobPreconditionFailedError) throw new ConflictError();
      throw e;
    }
    return;
  }
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  // naive optimistic check for local dev
  try {
    const current = JSON.parse(await fs.readFile(LOCAL_DB, "utf8")) as DB;
    if (etag && String(current.v) !== etag) throw new ConflictError();
  } catch (e) {
    if (e instanceof ConflictError) throw e;
  }
  await fs.writeFile(LOCAL_DB, body, "utf8");
}

export async function savePhoto(
  bytes: Buffer,
  filename: string,
  contentType: string,
): Promise<string> {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const pathname = `photos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
  if (usesBlob()) {
    const res = await put(pathname, bytes, {
      access: "private",
      contentType,
      addRandomSuffix: false,
      cacheControlMaxAge: 31536000,
    });
    return res.pathname;
  }
  await fs.mkdir(LOCAL_PHOTOS, { recursive: true });
  await fs.writeFile(path.join(LOCAL_DIR, pathname), bytes);
  return pathname;
}

export async function readPhoto(
  pathname: string,
): Promise<{ body: Buffer | ReadableStream<Uint8Array>; contentType: string } | null> {
  if (!pathname.startsWith("photos/") || pathname.includes("..")) return null;
  if (usesBlob()) {
    const res = await get(pathname, { access: "private" });
    if (!res || !res.stream) return null;
    return { body: res.stream, contentType: res.blob.contentType || "image/jpeg" };
  }
  try {
    const buf = await fs.readFile(path.join(LOCAL_DIR, pathname));
    const ext = path.extname(pathname).toLowerCase();
    const ct =
      ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    return { body: buf, contentType: ct };
  } catch {
    return null;
  }
}

function normalize(raw: Partial<DB>): DB {
  const base = emptyDb();
  return {
    v: raw.v ?? 0,
    players: raw.players ?? [],
    votes: raw.votes ?? [],
    matches: raw.matches ?? [],
    lineups: raw.lineups ?? [],
    settings: { ...base.settings, ...(raw.settings ?? {}) },
  };
}
