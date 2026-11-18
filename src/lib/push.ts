import "server-only";
import { sendNotification, setVapidDetails } from "web-push";
import { mutateDb } from "./db";
import { DB, Player, PushSub } from "./types";

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export function pushConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function configure() {
  setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:arena@quadrifoglio.local",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string,
  );
}

/**
 * Send a (possibly personalised) notification to every subscribed player.
 * `build` returns the payload for a player, or null to skip them.
 * Dead subscriptions (410/404) are pruned.
 */
export async function notifyPlayers(db: DB, build: (player: Player) => PushPayload | null): Promise<{ sent: number; failed: number }> {
  if (!pushConfigured() || !db.pushSubs?.length) return { sent: 0, failed: 0 };
  configure();
  const dead: string[] = [];
  let sent = 0;
  let failed = 0;
  await Promise.all(
    db.pushSubs.map(async (sub) => {
      const player = db.players.find((p) => p.id === sub.playerId);
      if (!player) {
        dead.push(sub.endpoint);
        return;
      }
      const payload = build(player);
      if (!payload) return;
      try {
        await sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, JSON.stringify(payload), { TTL: 60 * 60 * 24 });
        sent++;
      } catch (e) {
        failed++;
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) dead.push(sub.endpoint);
      }
    }),
  );
  if (dead.length) {
    await mutateDb((d) => {
      d.pushSubs = (d.pushSubs ?? []).filter((s) => !dead.includes(s.endpoint));
    }).catch(() => undefined);
  }
  return { sent, failed };
}

export type { PushSub };
