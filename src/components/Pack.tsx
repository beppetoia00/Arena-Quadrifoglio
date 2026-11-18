"use client";

export function Pack({ width = 230 }: { width?: number }) {
  const height = width * 1.45;
  return (
    <div
      className="relative overflow-hidden rounded-[18px] transition-transform duration-300 group-hover:scale-[1.03] group-active:scale-95"
      style={{
        width,
        height,
        background:
          "linear-gradient(160deg, #0f4b48 0%, #0a2f33 35%, #071f24 60%, #0f4b48 100%)",
        boxShadow: "0 30px 60px rgba(0,0,0,0.6), inset 0 0 0 2px rgba(30,200,191,0.55), inset 0 0 50px rgba(0,153,146,0.4), 0 0 40px rgba(0,153,146,0.35)",
      }}
    >
      {/* foil shimmer */}
      <div
        className="pointer-events-none absolute inset-0 animate-shimmer"
        style={{
          backgroundImage:
            "linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.08) 40%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.08) 60%, transparent 80%)",
          backgroundSize: "200% 100%",
        }}
      />
      {/* diagonal stripes */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.08) 0 6px, transparent 6px 22px)",
        }}
      />
      {/* tear strip */}
      <div className="absolute inset-x-0 top-0 h-[12%] border-b border-dashed border-white/25 bg-black/30" />
      <div className="absolute left-1/2 top-[4%] -translate-x-1/2 font-display text-[9px] uppercase tracking-[0.4em] text-white/60">strappa qui</div>

      {/* content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 pt-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-teal-light/40 blur-2xl" />
          <img src="/brand/clover.png" alt="" className="relative h-24 w-24 object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)] animate-float" />
        </div>
        <div className="font-display text-xl font-bold uppercase leading-tight tracking-[0.2em] text-white">
          Arena
          <br />
          Quadrifoglio
        </div>
        <div className="rounded-full border border-gold/60 bg-gold/10 px-3 py-1 font-display text-[11px] uppercase tracking-[0.3em] text-gold">
          Pacchetto giocatore
        </div>
        <div className="mt-2 text-[10px] uppercase tracking-[0.3em] text-white/50">1 carta · Rara garantita</div>
      </div>

      {/* bottom glow */}
      <div className="pointer-events-none absolute -bottom-10 left-1/2 h-32 w-56 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl" />
    </div>
  );
}
