"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import SpinningLogo from "@/components/SpinningLogo";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/ddd", label: "DDD" },
  { href: "/redzone", label: "RedzoneEarth" },
  { href: "/social", label: "Social Media" },
  { href: "/krypto", label: "Krypto" },
  { href: "/todo", label: "To-Do" },
  { href: "/briefing", label: "Morgen-Briefing" },
];

/**
 * Fixe Sidebar-Navigation (240 px, #111111). Ab lg immer sichtbar,
 * darunter als Overlay-Drawer mit Hamburger-Button. Aktiver Punkt:
 * linker Akzent-Border + heller Text; Hover neutral weiß (Design-Regel).
 */
export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Navigation schließen" : "Navigation öffnen"}
        className="fixed left-4 top-3.5 z-50 flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-sidebar text-foreground transition-colors hover:bg-white/5 lg:hidden"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          {open ? (
            <path
              d="M6 6 L18 18 M18 6 L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          ) : (
            <path
              d="M4 7 H20 M4 12 H20 M4 17 H20"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          )}
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-line bg-sidebar transition-transform duration-200 motion-reduce:transition-none lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-line px-5 py-5">
          <SpinningLogo className="h-8 w-8" />
          <div>
            <p className="font-display text-base font-semibold tracking-tight text-foreground">
              Overview
            </p>
            <p className="text-[11px] text-muted">Alle Projekte, ein Blick</p>
          </div>
        </div>

        <nav aria-label="Projekte" className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-0.5">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex border-l-2 px-4 py-2.5 text-sm transition-colors ${
                      active
                        ? "border-accent bg-white/[0.04] font-medium text-foreground"
                        : "border-transparent text-muted hover:bg-white/5 hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <p className="border-t border-line px-5 py-4 text-[11px] text-muted">
          lokal &amp; privat · read-only
        </p>
      </aside>
    </>
  );
}
