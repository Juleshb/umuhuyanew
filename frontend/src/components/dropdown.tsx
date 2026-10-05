"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

type DropdownItem = {
  label: string;
  href?: string;
  onClick?: () => void;
  hint?: string;
  danger?: boolean;
};

type DropdownProps = {
  label: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  buttonClassName?: string;
  menuClassName?: string;
};

export function Dropdown({
  label,
  items,
  align = "right",
  buttonClassName = "",
  menuClassName = "",
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className={buttonClassName}
      >
        {label}
        <svg
          className={`h-3.5 w-3.5 shrink-0 opacity-70 transition ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path d="M5.25 7.5 10 12.25 14.75 7.5" />
        </svg>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className={`absolute top-[calc(100%+6px)] z-50 min-w-[220px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.12)] ${
            align === "right" ? "right-0" : "left-0"
          } ${menuClassName}`}
        >
          {items.map((item) => {
            const className = `flex w-full items-start gap-2 px-3.5 py-2.5 text-left text-sm transition hover:bg-slate-50 ${
              item.danger ? "text-rose-600" : "text-slate-700"
            }`;
            if (item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  role="menuitem"
                  className={className}
                  onClick={() => {
                    item.onClick?.();
                    setOpen(false);
                  }}
                >
                  <span className="min-w-0">
                    <span className="block font-medium">{item.label}</span>
                    {item.hint ? (
                      <span className="mt-0.5 block text-xs text-slate-500">{item.hint}</span>
                    ) : null}
                  </span>
                </Link>
              );
            }
            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={className}
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
              >
                <span className="min-w-0">
                  <span className="block font-medium">{item.label}</span>
                  {item.hint ? (
                    <span className="mt-0.5 block text-xs text-slate-500">{item.hint}</span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
