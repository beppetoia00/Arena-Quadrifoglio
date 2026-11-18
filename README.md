# Arena Quadrifoglio

Ultimate Team tra amici, stile FC 27: carte con le foto dei giocatori, pacchetti da sbustare, voti sull'overall (niente autovoto), partite Blacks vs Blancos, statistiche, formazioni e MVP.

## Stack

- Next.js (App Router) + React + Tailwind CSS 4 + Framer Motion
- Dati salvati su **Vercel Blob** (un file JSON privato + le foto). In locale si usa la cartella `.data/`.
- Deploy automatico su Vercel ad ogni push su `main`.

## Variabili d'ambiente (Vercel)

| Nome | Descrizione |
| --- | --- |
| `BLOB_READ_WRITE_TOKEN` | creata automaticamente collegando un Blob store al progetto |
| `ADMIN_PIN` | PIN per l'area `/admin` (default `2727`, cambialo!) |
| `SESSION_SECRET` | stringa casuale per firmare i cookie di sessione |

## Come funziona

1. L'admin (`/admin`) aggiunge i giocatori con foto, ruolo, squadra e PIN.
2. Ogni amico entra da `/login` scegliendo la sua carta + PIN.
3. In `/vota` si sbustano i pacchetti: appare la carta dell'amico e si dà l'overall (40–99).
4. L'overall della carta è la media dei voti ricevuti: ≥ 80 **Oro Rara**, ≥ 70 **Oro**, sotto **Argento Rara** (soglie modificabili dall'admin). Il valore della carta cresce in modo esponenziale con l'overall.
5. L'admin registra le partite (risultato, convocati, gol, assist); tutti votano l'MVP.
6. In `/formazioni` chiunque propone le squadre per la prossima partita e si vota la più equilibrata.

## Da telefono (PWA)

L'app è installabile come una vera app:

- **iPhone**: apri il sito in Safari → Condividi → "Aggiungi alla schermata Home".
- **Android**: Chrome propone "Installa app" (o menu ⋮ → "Aggiungi a schermata Home").

Si apre a schermo intero, con icona Quadrifoglio e barra di navigazione in basso.

## Sviluppo locale

```bash
npm install
npm run dev
```
