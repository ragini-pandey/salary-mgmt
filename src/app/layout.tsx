import type { Metadata } from "next";
import Link from "next/link";
import { Users, BarChart3 } from "lucide-react";

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
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-950">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-zinc-900 text-xs font-bold text-white">
                S
              </span>
              <span>Salary</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/employees"
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 hover:bg-zinc-100"
              >
                <Users className="h-4 w-4" /> Employees
              </Link>
              <Link
                href="/insights"
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 hover:bg-zinc-100"
              >
                <BarChart3 className="h-4 w-4" /> Insights
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
