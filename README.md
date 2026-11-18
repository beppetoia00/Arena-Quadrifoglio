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

1. L'admin (`/admin`) aggiunge i giocatori con foto, ruolo, squadra e PIN (anche con l'import rapido, una riga per giocatore).
2. Ogni amico entra da `/login` scegliendo la sua carta + PIN.
3. In `/vota` si sbustano i pacchetti: appare la carta dell'amico e si dà l'overall (40–99). Niente autovoto.
4. L'overall della carta è la media dei voti ricevuti e decide il livello della carta. Il valore cresce in modo esponenziale con l'overall.
5. L'admin e i due capitani registrano le partite (convocati, risultato, gol, assist); tutti votano l'MVP.
6. In `/formazioni` chiunque propone le squadre per la prossima partita e si vota la più equilibrata; da una formazione si può creare la partita ufficiale.
7. In `/mercato` (visibile a tutti) l'admin e i capitani ufficializzano i passaggi di proprietà tra Blacks e Blancos, con animazione e storico; il costo è il valore della carta.
8. Chi attiva le notifiche dal profilo riceve un avviso quando viene creata una partita o cambiano i convocati ("sei convocato con i Blacks"), e per ogni trasferimento ufficiale. Nel profilo compare anche la card animata "Oggi giochi con i ...".

## Livelli delle carte

| Overall medio | Carta |
| --- | --- |
| ≥ 80 | **Oro Rara** |
| 70 – 79 | **Oro** |
| 65 – 69 | **Argento Rara** |
| 60 – 64 | **Argento** |
| 55 – 59 | **Bronzo Rara** |
| < 55 | **Bronzo** |

Le soglie si cambiano da `/admin` → Impostazioni. Una carta senza voti mostra "??" su sfondo argento.

## Ruoli

- **Admin** (PIN `ADMIN_PIN`): gestisce giocatori, foto, PIN, impostazioni, partite, trasferimenti, avvisi push a tutti.
- **Capitani** (spunta "capitano" sul giocatore, uno per squadra): creano e modificano le partite, ufficializzano i trasferimenti.
- **Tutti**: votano gli overall, propongono e votano le formazioni, votano l'MVP.

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
