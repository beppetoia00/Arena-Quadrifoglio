import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { getDb } from "./db";
import { Player } from "./types";

const SESSION_COOKIE = "aq_session";
const ADMIN_COOKIE = "aq_admin";
const MAX_AGE = 60 * 60 * 24 * 180; // 180 days

function cookieSecure() {
  // Vercel is always https; set COOKIE_INSECURE=1 to test a production build over plain http
  return process.env.NODE_ENV === "production" && !process.env.COOKIE_INSECURE;
}

function secret() {
  return process.env.SESSION_SECRET || process.env.ADMIN_PIN || "arena-quadrifoglio-dev-secret";
}

export function adminPin() {
  return process.env.ADMIN_PIN || "2727";
}

export function adminPinIsDefault() {
  return !process.env.ADMIN_PIN;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function verify(value: string, sig: string) {
  const expected = sign(value);
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function setSession(playerId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, `${playerId}.${sign(playerId)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function currentPlayer(): Promise<Player | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const idx = raw.lastIndexOf(".");
  if (idx < 0) return null;
  const id = raw.slice(0, idx);
  const sig = raw.slice(idx + 1);
  if (!verify(id, sig)) return null;
  const db = await getDb();
  return db.players.find((p) => p.id === id) ?? null;
}

export async function setAdmin() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, sign("admin"), {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearAdmin() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const raw = store.get(ADMIN_COOKIE)?.value;
  if (raw && verify("admin", raw)) return true;
  const me = await currentPlayer();
  return Boolean(me?.isAdmin);
}
