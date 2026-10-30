"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  error?: boolean;
  active?: boolean;
  portalTarget?: HTMLElement | null;
}

export default function Select({
  id,
  label,
  placeholder,
  value,
  options,
  onChange,
  error = false,
  active = true,
  portalTarget = null,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selected = options.find((o) => o.value === value);
  const isOpen = open && active;

  useEffect(() => {
    if (!active && open) setOpen(false);
  }, [active, open]);

  const measure = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (portalTarget) {
      const p = portalTarget.getBoundingClientRect();
      setPos({ top: r.bottom - p.top, left: r.left - p.left, width: r.width });
      return;
    }
    setPos({ top: r.bottom, left: r.left, width: r.width });
  }, [portalTarget]);

  useEffect(() => {
    if (!isOpen) return;
    measure();
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!wrapperRef.current?.contains(t) && !listRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [isOpen, measure]);

  const list = pos && (
    <ul
      ref={listRef}
      role="listbox"
      data-lenis-prevent
      style={{ position: portalTarget ? "absolute" : "fixed", top: pos.top, left: pos.left, width: pos.width }}
      className={clsx(
        "z-10 max-h-0 overflow-hidden bg-brand-10/4 backdrop-blur-[20px] transition-[max-height] duration-400",
        {
          "pointer-events-auto max-h-c-160! overflow-y-auto border-t border-brand-10/10": isOpen,
          "pointer-events-none": !isOpen,
        },
      )}
    >
      {options.map((o) => (
        <li key={o.value} role="option" aria-selected={o.value === value}>
          <button
            type="button"
            data-event="hover"
            onClick={() => {
              onChange(o.value);
              setOpen(false);
            }}
            className={clsx(
              "block w-full px-c-16 py-3 text-left body-md transition-colors duration-200 hover:bg-brand-05/6",
              { "bg-brand-05/6": o.value === value },
            )}
          >
            {o.label}
          </button>
        </li>
      ))}
    </ul>
  );

  const target = portalTarget ?? (typeof document !== "undefined" ? document.body : null);

  return (
    <div ref={wrapperRef} className="relative border-t border-brand-10/10">
      <button
        ref={triggerRef}
        type="button"
        id={id}
        data-event="hover"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setOpen((v) => !v)}
        className="relative h-20 max-h-[10vh] w-full px-c-16 py-3 flex flex-col justify-start text-left cursor-pointer"
      >
        <span className="body-xs pointer-events-none flex items-center gap-1.5">
          {label}
          {error && <span aria-hidden="true" className="block w-1 h-1 rounded-full bg-red-500" />}
        </span>
        <span className={clsx("body-md pt-1 pointer-events-none", { "text-brand-05/40": !selected })}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={clsx(
            "absolute right-c-16 top-1/2 -translate-y-1/2 transition-transform duration-300 pointer-events-none",
            { "rotate-180": isOpen },
          )}
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M1 1.5L6 6.5L11 1.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {list && target ? createPortal(list, target) : null}
    </div>
  );
}
