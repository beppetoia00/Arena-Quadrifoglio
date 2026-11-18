import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { InstallBanner } from "@/components/InstallBanner";
import { currentPlayer, isAdmin } from "@/lib/auth";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: { default: "Arena Quadrifoglio", template: "%s · Arena Quadrifoglio" },
  description: "Ultimate Team tra amici: carte, pacchetti, voti, partite e formazioni. Blacks vs Blancos.",
  applicationName: "Arena Quadrifoglio",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Arena",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "Arena Quadrifoglio",
    description: "L'Ultimate Team dei tuoi amici. Blacks vs Blancos.",
    images: ["/brand/og.png"],
    locale: "it_IT",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#070b10",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [me, admin] = await Promise.all([currentPlayer(), isAdmin()]);
  return (
    <html lang="it" className={`${inter.variable} ${oswald.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Nav me={me ? { id: me.id, name: me.name } : null} admin={admin} />
        <main className="app-main mx-auto w-full max-w-6xl flex-1 px-4 pt-4 md:pb-10">{children}</main>
        <footer className="hidden border-t border-line/60 py-6 text-center text-xs text-muted md:block">
          Arena Quadrifoglio · Ultimate Team tra amici · Blacks vs Blancos
        </footer>
        <InstallBanner />
      </body>
    </html>
  );
}
