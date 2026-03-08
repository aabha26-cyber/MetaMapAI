"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/register", label: "Register" },
  { href: "/metamap", label: "MetaMap" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[var(--border-subtle)] bg-[rgba(6,6,10,0.94)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-accent)] bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent)]">
            MM
          </div>
          <div>
            <div className="font-display text-lg text-[var(--text-primary)]">
              MetaMap AI
            </div>
            <div className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
              Patient risk workflow
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)] p-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === item.href
                : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--accent)] text-black"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
