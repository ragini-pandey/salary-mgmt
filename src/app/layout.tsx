import type { Metadata } from "next";
import Link from "next/link";

import { Nav } from "@/components/layout/nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Salary Management",
  description:
    "HR-facing tool for managing employees and exploring salary insights.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col text-zinc-950">
        <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
            <Link
              href="/"
              className="group flex items-center gap-2 font-semibold tracking-tight"
            >
              <span className="relative inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-zinc-900 to-zinc-700 text-xs font-bold text-white shadow-sm transition-transform group-hover:scale-105">
                <span className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/30 opacity-0 transition-opacity group-hover:opacity-100" />
                S
              </span>
              <span>Salary</span>
            </Link>
            <Nav />
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
