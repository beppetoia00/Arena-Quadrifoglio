"use client";

import { useState, useTransition } from "react";
import confetti from "canvas-confetti";
import { voteMvpAction } from "@/lib/actions";
import { photoUrl } from "@/lib/photo";
import { Crest } from "./Crest";
import { PublicPlayer } from "@/lib/view";

type P = PublicPlayer & { mvpVotes: number; goals: number; assists: number };

export function MvpVoting({ matchId, meId, players, myVote }: { matchId: string; meId: string; players: P[]; myVote?: string }) {
  const [selected, setSelected] = useState<string | undefined>(myVote);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const vote = (pid: string) => {
    if (pid === meId) {
      setError("Non puoi votarti MVP da solo 😄");
      return;
    }
    setError(null);
    const prev = selected;
    setSelected(pid);
    start(async () => {
      const res = await voteMvpAction(matchId, pid);
      if (!res.ok) {
        setSelected(prev);
        setError(res.error);
      } else {
        confetti({ particleCount: 50, spread: 55, origin: { y: 0.8 }, colors: ["#e9c55b", "#ffffff"] });
      }
    });
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {players.map((p) => {
          const url = photoUrl(p);
          const isSel = selected === p.id;
          const isMe = p.id === meId;
          return (
            <button
              key={p.id}
              disabled={pending || isMe}
              onClick={() => vote(p.id)}
              className={`flex items-center gap-2 rounded-xl border p-2 text-left transition ${
                isSel ? "border-gold bg-gold/15 shadow-[0_0_18px_rgba(233,197,91,0.35)]" : "border-line bg-surface hover:border-muted"
              } ${isMe ? "opacity-40" : ""}`}
            >
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-surface-2">
                {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-muted">{p.name.slice(0, 1)}</div>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 truncate text-sm font-medium">
                  {p.nickname || p.name} <Crest team={p.team} size={14} />
                </div>
                <div className="text-[11px] text-muted">
                  {p.mvpVotes} {p.mvpVotes === 1 ? "voto" : "voti"}
                  {p.goals ? ` · ⚽${p.goals}` : ""}
                </div>
              </div>
              {isSel && <span className="text-lg">⭐</span>}
            </button>
          );
        })}
      </div>
      {error && <div className="mt-3 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</div>}
    </div>
  );
}
