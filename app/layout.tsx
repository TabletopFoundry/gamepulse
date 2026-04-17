import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { BellRing, Compass, Newspaper, Sparkles, User } from "lucide-react";

import "./globals.css";
import { SearchAutocomplete } from "@/components/client-widgets";
import { getSearchOptions } from "@/lib/gamepulse";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GamePulse",
  description: "The pulse of the board game world — aggregated critic scores, community reviews, and taste-matched discovery.",
};

const nav = [
  { href: "/browse", label: "Browse", icon: <Compass className="h-4 w-4" /> },
  { href: "/feed", label: "Feed", icon: <Newspaper className="h-4 w-4" /> },
  { href: "/critics", label: "Critics", icon: <Sparkles className="h-4 w-4" /> },
  { href: "/me", label: "You", icon: <User className="h-4 w-4" /> },
];

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const searchOptions = getSearchOptions();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth`}>
      <body className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(244,63,94,0.18),_transparent_40%),linear-gradient(180deg,#fff_0%,#f8fafc_45%,#f1f5f9_100%)] text-slate-900">
        <div className="min-h-screen">
          <header className="sticky top-0 z-40 border-b border-white/20 bg-slate-950/85 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center justify-between gap-4">
                  <Link href="/" className="flex items-center gap-3 text-white">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 via-red-500 to-orange-400 text-lg font-semibold shadow-lg shadow-rose-500/30">GP</div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.34em] text-rose-300">GamePulse</p>
                      <p className="text-sm text-slate-300">The pulse of the board game world</p>
                    </div>
                  </Link>
                  <div className="hidden items-center gap-2 lg:flex">
                    {nav.map((item) => (
                      <Link key={item.href} href={item.href} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
                        {item.icon}
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <SearchAutocomplete options={searchOptions} />
                  <span className="hidden items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm text-slate-300 xl:inline-flex">
                    <BellRing className="h-4 w-4 text-rose-300" /> Weekly pulse
                  </span>
                </div>
              </div>
              <nav className="flex items-center gap-2 overflow-x-auto lg:hidden">
                {nav.map((item) => (
                  <Link key={item.href} href={item.href} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          {children}
          <footer className="border-t border-slate-200/70 bg-white/75 backdrop-blur">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <p>GamePulse MVP · Aggregated mock board game data powered by Next.js and SQLite.</p>
              <div className="flex gap-4">
                <Link href="/browse">Discover</Link>
                <Link href="/feed">Feed</Link>
                <Link href="/me">Your Critics</Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
