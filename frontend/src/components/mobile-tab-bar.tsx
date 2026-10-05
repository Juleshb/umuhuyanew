"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const items = [
  { href: "/", label: "Home", icon: "home", match: (p: string) => p === "/" },
  {
    href: "/properties",
    label: "Explore",
    icon: "search",
    match: (p: string) => p.startsWith("/properties"),
  },
  {
    href: "/dashboard/favorites",
    label: "Saved",
    icon: "heart",
    match: (p: string) => p.startsWith("/dashboard/favorites"),
    auth: true,
  },
  {
    href: "/dashboard",
    label: "Account",
    icon: "user",
    match: (p: string) =>
      p.startsWith("/dashboard") || p.startsWith("/admin") || p.startsWith("/login"),
  },
] as const;

function Icon({ name, active }: { name: string; active: boolean }) {
  const stroke = active ? "#0f9ea8" : "currentColor";
  const common = { className: "h-5 w-5", fill: "none", stroke, strokeWidth: 2 as const };
  switch (name) {
    case "home":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M4 11.5 12 5l8 6.5" />
          <path d="M6 10.8V20h12v-9.2" />
        </svg>
      );
    case "search":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
        </svg>
      );
    default:
      return (
        <svg {...common} viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 19.5c1.8-3.2 4.2-4.8 7-4.8s5.2 1.6 7 4.8" />
        </svg>
      );
  }
}

export function MobileTabBar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const hide =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  if (hide) return null;

  return (
    <nav className="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-2 md:hidden">
      <ul className="liquid-glass pointer-events-auto mx-auto grid max-w-lg grid-cols-4 gap-1 rounded-full p-1.5">
        {items.map((item) => {
          const href =
            item.icon === "user" && !user
              ? "/login"
              : item.icon === "heart" && !user
                ? "/login?next=/dashboard/favorites"
                : item.href;
          const active = item.match(pathname);
          return (
            <li key={item.label}>
              <Link
                href={href}
                className={`flex flex-col items-center gap-1 rounded-full px-2 py-2 text-[11px] font-semibold transition ${
                  active
                    ? "bg-white/75 text-teal shadow-sm"
                    : "text-ink/45 hover:bg-white/40 hover:text-ink/70"
                }`}
              >
                <Icon name={item.icon} active={active} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
