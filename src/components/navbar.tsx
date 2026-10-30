"use client";

import { useEffect, useRef, useState } from "react";
import AppLink from "@/components/ui/link";
import { site } from "@/content/site";
import { useGlobalStore } from "@/stores/global-store";

export default function Navbar() {
  const setShowContactForm = useGlobalStore((s) => s.setShowContactForm);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("scroll", close, { passive: true });
    document.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("scroll", close);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  return (
    <>
      <header className="wide:top-4 container pointer-events-none fixed inset-x-0 top-0 z-[1000000] flex h-navbar-height items-center justify-between px-8 mix-blend-difference">
        <AppLink
          href="/"
          noDataEvent
          hasProximityHover
          className="group pointer-events-auto flex text-lg font-medium text-brand-05"
        >
          {site.name}
        </AppLink>
        <div className="pointer-events-auto flex items-center justify-end gap-4 text-sm text-brand-05">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              data-event="simple-hover"
              onClick={() => setOpen((v) => !v)}
              aria-label={site.nav.openMenu}
              aria-expanded={open}
              className="group relative z-100 flex h-8 w-8 flex-col items-center justify-center gap-1 mix-blend-difference"
            >
              <span className="flex flex-col items-end justify-center gap-1">
                <span className="w-6 h-0.5 scale-x-100 origin-left bg-brand-05 group-hover:scale-x-80 transition-transform duration-400" />
                <span className="w-6 h-0.5 scale-x-85 origin-right bg-brand-05 group-hover:scale-x-65 transition-transform duration-400" />
              </span>
            </button>
            <nav
              style={{ clipPath: open ? "inset(0 0 0 0)" : "inset(0 0 100% 0)" }}
              className="flex gap-1 flex-col items-end justify-center absolute -top-3 -right-5 w-40 bg-brand-10/4 backdrop-blur-[30px] p-5 pt-12 rounded-xs transition-all duration-400"
            >
              {site.nav.pages.map((page) => (
                <AppLink
                  key={page.href}
                  noDataEvent
                  hasProximityHover
                  href={page.href}
                  onClick={() => setOpen(false)}
                >
                  {page.label}
                </AppLink>
              ))}
              <AppLink
                noDataEvent
                isTextLink
                onClick={() => {
                  setOpen(false);
                  setShowContactForm(true);
                }}
              >
                {site.nav.contact}
              </AppLink>
            </nav>
          </div>
        </div>
      </header>

      {/* Viewport frame with accent corners */}
      <div className="mx-auto pointer-events-none fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] h-[calc(100vh-32px)] border border-white/10 z-[999999]">
        <div className="absolute top-0 left-0 w-4 h-0.5 bg-brand-30" />
        <div className="absolute top-0 right-0 w-4 h-0.5 bg-brand-30" />
        <div className="absolute bottom-0 left-0 w-4 h-0.5 bg-brand-30" />
        <div className="absolute bottom-0 right-0 w-4 h-0.5 bg-brand-30" />
        <div className="absolute top-0 left-0 w-0.5 h-4 bg-brand-30" />
        <div className="absolute top-0 right-0 w-0.5 h-4 bg-brand-30" />
        <div className="absolute bottom-0 left-0 w-0.5 h-4 bg-brand-30" />
        <div className="absolute bottom-0 right-0 w-0.5 h-4 bg-brand-30" />
      </div>
    </>
  );
}
