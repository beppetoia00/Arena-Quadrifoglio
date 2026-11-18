import Link from "next/link";
import { adminPinIsDefault, isAdmin } from "@/lib/auth";
import { loadArena, publicPlayer } from "@/lib/view";
import { usesBlob } from "@/lib/storage";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { PlayerForm } from "@/components/admin/PlayerForm";
import { PlayersTable } from "@/components/admin/PlayersTable";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { DangerZone } from "@/components/admin/DangerZone";
import { BulkImport } from "@/components/admin/BulkImport";
import { BroadcastForm } from "@/components/admin/BroadcastForm";
import { pushConfigured } from "@/lib/push";
import { adminLogoutAction } from "@/lib/actions";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const admin = await isAdmin();
  if (!admin) {
    return (
      <div className="mx-auto max-w-sm space-y-4">
        <h1 className="font-display text-3xl uppercase tracking-wider">Area admin</h1>
        <p className="text-muted">Inserisci il PIN admin per gestire giocatori, partite e impostazioni.</p>
        <AdminLoginForm />
      </div>
    );
  }
  const { db, rated } = await loadArena();
  const players = db.players.map((p) => ({ ...publicPlayer(p), pin: p.pin, isAdmin: p.isAdmin ?? false, isCaptain: p.isCaptain ?? false, overall: rated.find((r) => r.player.id === p.id)?.overall ?? null, votes: rated.find((r) => r.player.id === p.id)?.votesCount ?? 0 }));

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wider">Admin</h1>
          <p className="text-muted">Gestisci la rosa, le partite e le regole dell&apos;Arena.</p>
        </div>
        <form action={adminLogoutAction}>
          <button className="btn-ghost !py-1.5 !text-sm">Esci da admin</button>
        </form>
      </div>

      {(adminPinIsDefault() || !usesBlob()) && (
        <div className="rounded-xl border border-gold/40 bg-gold/10 p-3 text-sm text-gold">
          {adminPinIsDefault() && <div>⚠️ Stai usando il PIN admin di default (2727). Imposta la variabile ADMIN_PIN su Vercel.</div>}
          {!usesBlob() && <div>⚠️ Storage locale (.data). Su Vercel collega un Blob store (BLOB_READ_WRITE_TOKEN) per salvare i dati in modo permanente.</div>}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <div className="card-panel">
            <h2 className="mb-3 font-display text-xl uppercase tracking-wider">Nuovo giocatore</h2>
            <PlayerForm />
          </div>
          <div className="card-panel">
            <h2 className="mb-1 font-display text-xl uppercase tracking-wider">Import rapido</h2>
            <BulkImport />
          </div>
        </div>
        <div className="card-panel">
          <h2 className="mb-3 font-display text-xl uppercase tracking-wider">
            Rosa <span className="text-muted">({players.length})</span>
          </h2>
          <PlayersTable players={players} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card-panel">
          <h2 className="mb-3 font-display text-xl uppercase tracking-wider">Partite</h2>
          <p className="mb-3 text-sm text-muted">{db.matches.length} partite registrate.</p>
          <div className="flex gap-2">
            <Link href="/partite/nuova" className="btn-primary">
              + Nuova partita
            </Link>
            <Link href="/partite" className="btn-ghost">
              Elenco
            </Link>
          </div>
        </div>
        <div className="card-panel">
          <h2 className="mb-3 font-display text-xl uppercase tracking-wider">Impostazioni</h2>
          <SettingsForm settings={db.settings} />
        </div>
      </section>

      <section className="card-panel">
        <h2 className="mb-1 font-display text-xl uppercase tracking-wider">Notifiche push</h2>
        <p className="mb-3 text-sm text-muted">
          {pushConfigured() ? "✅ Chiavi configurate" : "⚠️ Chiavi VAPID mancanti (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY)"} · {db.pushSubs.length} {db.pushSubs.length === 1 ? "dispositivo iscritto" : "dispositivi iscritti"}
          {db.pushSubs.length > 0 && (
            <>
              {" "}
              (
              {[...new Set(db.pushSubs.map((s) => db.players.find((p) => p.id === s.playerId)?.name ?? "?"))].join(", ")})
            </>
          )}
        </p>
        <BroadcastForm />
      </section>

      <DangerZone hasPlayers={db.players.length > 0} votes={db.votes.length} />
    </div>
  );
}
