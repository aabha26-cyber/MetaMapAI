"use client";

import type { ReactNode } from "react";

import { SiteHeader } from "@/components/site-header";

type PageShellProps = {
  children: ReactNode;
  maxWidthClassName?: string;
};

export function PageShell({
  children,
  maxWidthClassName = "max-w-6xl",
}: PageShellProps) {
  return (
    <div className="page-shell min-h-screen bg-grid">
      <SiteHeader />
      <main
        className={`page-content mx-auto flex w-full ${maxWidthClassName} flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8`}
      >
        {children}
      </main>
    </div>
  );
}
