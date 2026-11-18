"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "Home", short: "Home", icon: HomeIcon },
  { href: "/vota", label: "Vota", short: "Vota", icon: PackIcon },
  { href: "/giocatori", label: "Carte", short: "Carte", icon: CardIcon },
  { href: "/partite", label: "Partite", short: "Partite", icon: BallIcon },
  { href: "/formazioni", label: "Formazioni", short: "Campo", icon: PitchIcon },
  { href: "/mercato", label: "Mercato", short: "Mercato", icon: SwapIcon },
  { href: "/classifica", label: "Classifica", short: "Rank", icon: TrophyIcon },
];

// mobile tab bar: first 4 + "Altro"
const MOBILE_MAIN = LINKS.slice(0, 4);
const MOBILE_MORE = LINKS.slice(4);

export function Nav({ me, admin }: { me: { id: string; name: string } | null; admin: boolean }) {
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const moreActive = MOBILE_MORE.some((l) => active(l.href)) || pathname.startsWith("/profilo") || pathname.startsWith("/squadre") || pathname.startsWith("/admin");

  return (
    <>
      <header className="sticky top-0 z-40 glass safe-top">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 md:py-2.5">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <Image src="/brand/clover.png" alt="" width={34} height={34} className="h-7 w-7 shrink-0 object-contain md:h-8 md:w-8" priority />
            <div className="min-w-0 leading-none">
              <div className="truncate font-display text-[15px] font-semibold uppercase tracking-[0.08em] text-white md:text-lg md:tracking-[0.18em]">
                Arena <span className="text-teal-light">Quadrifoglio</span>
              </div>
              <div className="hidden text-[10px] uppercase tracking-[0.3em] text-muted sm:block">Ultimate Team · Blacks vs Blancos</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 font-display text-sm uppercase tracking-wider transition ${
                  active(l.href) ? "bg-teal/20 text-teal-light" : "text-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {admin && (
              <Link href="/admin" aria-label="Admin" className="rounded-lg border border-gold/40 px-1.5 py-1 font-display text-[11px] uppercase tracking-wider text-gold md:px-2.5 md:text-xs">
                <span className="md:hidden">⚙︎</span>
                <span className="hidden md:inline">Admin</span>
              </Link>
            )}
            {me ? (
              <Link href="/profilo" className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-sm">
                <span className="h-2 w-2 rounded-full bg-teal-light" />
                <span className="max-w-[56px] truncate md:max-w-[110px]">{me.name}</span>
              </Link>
            ) : (
              <Link href="/login" className="btn-primary !px-3 !py-1.5 !text-sm">
                Entra
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* mobile "more" sheet */}
      {more && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMore(false)}>
          <div className="glass absolute inset-x-0 rounded-t-3xl p-4 pb-6" style={{ bottom: "calc(60px + env(safe-area-inset-bottom))" }} onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
            <div className="grid grid-cols-3 gap-2">
              {[...MOBILE_MORE, { href: "/squadre", label: "Squadre", short: "Squadre", icon: ShieldIcon }, { href: me ? "/profilo" : "/login", label: me ? "Profilo" : "Entra", short: "Profilo", icon: UserIcon }, ...(admin ? [{ href: "/admin", label: "Admin", short: "Admin", icon: GearIcon }] : [])].map((l) => {
                const Icon = l.icon;
                return (
                  <Link key={l.href} href={l.href} onClick={() => setMore(false)} className={`flex flex-col items-center gap-1 rounded-2xl border p-3 text-xs font-semibold uppercase tracking-wide ${active(l.href) ? "border-teal bg-teal/15 text-teal-light" : "border-line bg-surface text-ink"}`}>
                    <Icon className="h-6 w-6" />
                    {l.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 glass safe-bottom border-t border-line md:hidden">
        <div className="grid grid-cols-5">
          {MOBILE_MAIN.map((l) => {
            const Icon = l.icon;
            const isActive = active(l.href) && !more;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative flex flex-col items-center gap-0.5 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-wide active:opacity-70 ${
                  isActive ? "text-teal-light" : "text-muted"
                }`}
              >
                {isActive && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-teal-light" />}
                <Icon className="h-5 w-5" />
                <span className="truncate">{l.short}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMore((v) => !v)}
            className={`relative flex flex-col items-center gap-0.5 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-wide active:opacity-70 ${more || moreActive ? "text-teal-light" : "text-muted"}`}
          >
            {(more || moreActive) && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-teal-light" />}
            <MoreIcon className="h-5 w-5" />
            <span>Altro</span>
          </button>
        </div>
      </nav>
    </>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}
function PackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3h10l2 3v15H5V6z" />
      <path d="M5 6h14M12 6v15M9 3l-1 3M15 3l1 3" />
    </svg>
  );
}
function CardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l6 2v9c0 4-3 7-6 9-3-2-6-5-6-9V4z" />
      <path d="M9 11h6M9 14h6" />
    </svg>
  );
}
function BallIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7l4 3-1.5 5h-5L8 10z" />
      <path d="M12 3v4M16 10l4-1M15.5 15l3 3M8.5 15l-3 3M8 10L4 9" />
    </svg>
  );
}
function PitchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M12 4v16M3 12h18" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}
function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" />
    </svg>
  );
}
function SwapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h13l-3-3M20 17H7l3 3" />
    </svg>
  );
}
function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l8 3v7c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5z" />
    </svg>
  );
}
function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}
function GearIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}
function MoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  );
}
