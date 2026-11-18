"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/vota", label: "Vota", icon: PackIcon },
  { href: "/giocatori", label: "Carte", icon: CardIcon },
  { href: "/partite", label: "Partite", icon: BallIcon },
  { href: "/formazioni", label: "Formazioni", icon: PitchIcon },
  { href: "/classifica", label: "Classifica", icon: TrophyIcon },
];

export function Nav({ me, admin }: { me: { id: string; name: string } | null; admin: boolean }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header className="sticky top-0 z-40 glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/brand/clover.png" alt="" width={34} height={34} className="h-8 w-8 object-contain" priority />
            <div className="leading-none">
              <div className="font-display text-lg font-semibold uppercase tracking-[0.18em] text-white">
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

          <div className="flex items-center gap-2">
            {admin && (
              <Link href="/admin" className="rounded-lg border border-gold/40 px-2.5 py-1 font-display text-xs uppercase tracking-wider text-gold">
                Admin
              </Link>
            )}
            {me ? (
              <Link href="/profilo" className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-sm">
                <span className="h-2 w-2 rounded-full bg-teal-light" />
                <span className="max-w-[90px] truncate">{me.name}</span>
              </Link>
            ) : (
              <Link href="/login" className="btn-primary !px-3 !py-1.5 !text-sm">
                Entra
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 glass border-t border-line md:hidden">
        <div className="grid grid-cols-6">
          {LINKS.map((l) => {
            const Icon = l.icon;
            const isActive = active(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold uppercase tracking-wide ${
                  isActive ? "text-teal-light" : "text-muted"
                }`}
              >
                <Icon className="h-5 w-5" />
                {l.label}
              </Link>
            );
          })}
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
