"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Formation } from "@/lib/formations";
import { Lineup } from "@/lib/types";
import { deleteLineupAction, toggleLineupVoteAction } from "@/lib/actions";
import { Pitch, balanceScore, LineupPlayer } from "./Pitch";
import { BalanceBar } from "./LineupBuilder";

export function LineupCard({
  lineup,
  rank,
  authorName,
  formations,
  players,
  meId,
  canDelete,
  admin,
}: {
  lineup: Lineup;
  rank: number;
  authorName: string;
  formations: { blacks: Formation; blancos: Formation };
  players: { blacks: (LineupPlayer | null)[]; blancos: (LineupPlayer | null)[] };
  meId: string | null;
  canDelete: boolean;
  admin: boolean;
}) {
  const [votes, setVotes] = useState(lineup.votes);
  const [pending, start] = useTransition();
  const voted = meId ? votes.includes(meId) : false;
  const balance = balanceScore(players.blacks, players.blancos);

  const toggle = () => {
    if (!meId) return;
    setVotes((v) => (v.includes(meId) ? v.filter((x) => x !== meId) : [...v, meId]));
    start(async () => {
      const res = await toggleLineupVoteAction(lineup.id);
      if (!res.ok) setVotes(lineup.votes);
    });
  };

  return (
    <div className={`card-panel space-y-3 ${rank === 1 && votes.length > 1 ? "border-gold/50" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-xl uppercase">
            {rank === 1 && votes.length > 1 && "🏆 "}
            {lineup.title}
          </div>
          <div className="text-xs text-muted">
            di {authorName} · {new Date(lineup.createdAt).toLocaleDateString("it-IT")}
          </div>
        </div>
        <button onClick={toggle} disabled={!meId || pending} className={voted ? "btn-gold !py-1.5 !text-sm" : "btn-ghost !py-1.5 !text-sm"}>
          👍 {votes.length}
        </button>
      </div>

      <BalanceBar balance={balance} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1 text-center text-[10px] uppercase tracking-widest text-muted">Blacks · {formations.blacks.label.split(" ")[0]}</div>
          <Pitch team="blacks" formation={formations.blacks} players={players.blacks} compact />
        </div>
        <div>
          <div className="mb-1 text-center text-[10px] uppercase tracking-widest text-muted">Blancos · {formations.blancos.label.split(" ")[0]}</div>
          <Pitch team="blancos" formation={formations.blancos} players={players.blancos} compact />
        </div>
      </div>

      <div className="flex justify-end gap-2 text-xs">
        {admin && (
          <Link href={`/partite/nuova?lineup=${lineup.id}`} className="btn-ghost !py-1 !text-xs">
            Crea partita da qui
          </Link>
        )}
        {canDelete && (
          <button
            className="btn-danger !py-1 !text-xs"
            disabled={pending}
            onClick={() => {
              if (confirm("Eliminare la formazione?")) start(() => deleteLineupAction(lineup.id).then(() => undefined));
            }}
          >
            Elimina
          </button>
        )}
      </div>
    </div>
  );
}
