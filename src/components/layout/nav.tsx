"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Users } from "lucide-react";

import { cn } from "@/lib/utils/cn";

const LINKS = [
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/insights", label: "Insights", icon: BarChart3 },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="relative flex items-center gap-1 text-sm">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors",
              active
                ? "text-zinc-900"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70",
            )}
          >
            {active && (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 -z-10 rounded-md bg-zinc-900/5"
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                }}
              />
            )}
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
