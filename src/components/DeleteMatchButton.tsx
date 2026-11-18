"use client";

import { useTransition } from "react";
import { deleteMatchAction } from "@/lib/actions";

export function DeleteMatchButton({ matchId }: { matchId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      className="btn-danger !py-1.5 !text-sm"
      disabled={pending}
      onClick={() => {
        if (confirm("Eliminare questa partita?")) start(() => deleteMatchAction(matchId).then(() => undefined));
      }}
    >
      Elimina
    </button>
  );
}
