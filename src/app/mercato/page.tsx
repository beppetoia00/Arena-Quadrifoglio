import Link from "next/link";
import { Crest } from "@/components/Crest";
import { TransferMarket, TransferRow } from "@/components/TransferMarket";
import { isManager } from "@/lib/auth";
import { loadArena, toVoteCard } from "@/lib/view";
import { formatValue } from "@/lib/rating";
import { TEAM_LABEL, TeamId } from "@/lib/types";

export const metadata = { title: "Calciomercato" };

export default async function MercatoPage() {
  const { db, me, rated } = await loadArena();
  const canManage = await isManager();
  const cards = rated.map((r) => ({ ...toVoteCard(r), value: r.value }));
  const byId = new Map(cards.map((c) => [c.id, c]));
  const nameOf = (id: string | null) => (id ? (db.players.find((p) => p.id === id)?.name ?? null) : null);
  const squadValue = (team: TeamId) => cards.filter((c) => c.team === team).reduce((a, c) => a + c.value, 0);
  const captains = db.players.filter((p) => p.isCaptain);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl uppercase tracking-wider">Calciomercato</h1>
        <p className="text-muted">
          Passaggi di proprietà tra Blacks e Blancos. Possono ufficializzare i trasferimenti solo l&apos;admin e i capitani
          {captains.length ? ` (${captains.map((c) => c.name).join(" e ")})` : ""}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(["blacks", "blancos"] as TeamId[]).map((t) => (
          <div key={t} className="card-panel flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center gap-3">
              <Crest team={t} size={44} />
              <div className="min-w-0">
                <div className="font-display text-lg uppercase">{TEAM_LABEL[t]}</div>
                <div className="text-xs text-muted">{cards.filter((c) => c.team === t).length} giocatori</div>
              </div>
            </div>
            <div className="sm:ml-auto sm:text-right">
              <div className="font-display text-xl text-gold">{formatValue(squadValue(t))}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted">valore rosa</div>
            </div>
          </div>
        ))}
      </div>

      {canManage ? (
        <TransferMarket players={cards} canManage meName={me?.name ?? null} />
      ) : (
        !me && (
          <div className="card-panel text-sm text-muted">
            Sei un capitano?{" "}
            <Link href="/login" className="text-teal-light">
              Entra
            </Link>{" "}
            per ufficializzare i trasferimenti.
          </div>
        )
      )}

      <section>
        <h2 className="mb-3 font-display text-xl uppercase tracking-wider">
          Trasferimenti ufficiali <span className="text-muted">({db.transfers.length})</span>
        </h2>
        {db.transfers.length ? (
          <ul className="space-y-2">
            {db.transfers.map((t) => (
              <TransferRow key={t.id} t={t} player={byId.get(t.playerId) ?? null} byName={nameOf(t.byId)} />
            ))}
          </ul>
        ) : (
          <div className="card-panel text-muted">Mercato ancora chiuso: nessun trasferimento ufficializzato.</div>
        )}
      </section>
    </div>
  );
}
