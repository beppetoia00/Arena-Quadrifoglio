import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { currentPlayer } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";
import { publicPlayer } from "@/lib/view";

export const metadata = { title: "Entra" };

export default async function LoginPage() {
  const me = await currentPlayer();
  if (me) redirect("/vota");
  const db = await getDb();
  const players = db.players.map(publicPlayer).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-3xl uppercase tracking-wider">Chi sei?</h1>
      <p className="mb-6 text-muted">Scegli la tua carta e inserisci il PIN che ti ha dato l&apos;admin.</p>
      {players.length ? (
        <LoginForm players={players} />
      ) : (
        <div className="card-panel text-muted">Nessun giocatore ancora. L&apos;admin deve prima creare la rosa da /admin.</div>
      )}
    </div>
  );
}
