"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Dropdown } from "@/components/dropdown";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";

type NavItem = {
  href: string;
  label: string;
  roles: Role[];
  icon: string;
};

const MAIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", roles: ["BUYER", "AGENT", "ADMIN"], icon: "overview" },
  { href: "/dashboard/favorites", label: "Favorites", roles: ["BUYER", "AGENT", "ADMIN"], icon: "heart" },
  { href: "/dashboard/inquiries", label: "Inquiries", roles: ["BUYER", "AGENT", "ADMIN"], icon: "chat" },
];

const AGENT_NAV: NavItem[] = [
  { href: "/dashboard/listings", label: "All listings", roles: ["BUYER", "AGENT", "ADMIN"], icon: "home" },
  { href: "/dashboard/listings/new", label: "Create listing", roles: ["BUYER", "AGENT", "ADMIN"], icon: "plus" },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Moderation queue", roles: ["ADMIN"], icon: "shield" },
  { href: "/admin/banners", label: "Ad banners", roles: ["ADMIN"], icon: "banner" },
];

function NavIcon({ name }: { name: string }) {
  const common = "h-[18px] w-[18px] shrink-0";
  switch (name) {
    case "overview":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 4h7v7H4V4zm9 0h7v4h-7V4zM4 13h7v7H4v-7zm9 2h7v5h-7v-5z" />
        </svg>
      );
    case "heart":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
        </svg>
      );
    case "chat":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 14.5a3.5 3.5 0 0 1-3.5 3.5H9l-4.5 3V7.5A3.5 3.5 0 0 1 8 4h9.5A3.5 3.5 0 0 1 21 7.5v7z" />
        </svg>
      );
    case "home":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="m3 11 9-7 9 7" />
          <path d="M5 10v10h14V10" />
        </svg>
      );
    case "plus":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "shield":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 3 4 6v6c0 5 3.4 8.4 8 9.8 4.6-1.4 8-4.8 8-9.8V6l-8-3z" />
        </svg>
      );
    case "banner":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 15h18" />
        </svg>
      );
    default:
      return null;
  }
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/admin") return pathname === "/admin";
  if (href === "/dashboard/listings") {
    return (
      pathname === "/dashboard/listings" ||
      (pathname.startsWith("/dashboard/listings/") && !pathname.endsWith("/new"))
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function CollapsibleNav({
  label,
  items,
  pathname,
  defaultOpen = false,
  onNavigate,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  defaultOpen?: boolean;
  onNavigate?: () => void;
}) {
  const hasActive = items.some((item) => isActive(pathname, item.href));
  const [open, setOpen] = useState(defaultOpen || hasActive);

  if (!items.length) return null;

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 transition hover:bg-white/[0.04] hover:text-slate-300"
      >
        {label}
        <svg
          className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M5.25 7.5 10 12.25 14.75 7.5" />
        </svg>
      </button>
      {open ? (
        <div className="mt-0.5 space-y-0.5">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition ${
                  active
                    ? "bg-white/[0.08] text-white"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                }`}
              >
                <span className={active ? "text-teal" : "text-slate-500 group-hover:text-slate-300"}>
                  <NavIcon name={item.icon} />
                </span>
                {item.label}
                {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal" /> : null}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function DashboardShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const main = useMemo(
    () => MAIN_NAV.filter((i) => user && i.roles.includes(user.role)),
    [user]
  );
  const agent = useMemo(
    () => AGENT_NAV.filter((i) => user && i.roles.includes(user.role)),
    [user]
  );
  const admin = useMemo(
    () => ADMIN_NAV.filter((i) => user && i.roles.includes(user.role)),
    [user]
  );

  if (loading || !user) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f6f7f9] text-sm text-slate-500">
        {loading ? "Loading workspace…" : "Redirecting to login…"}
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
        <BrandLogo variant="light" size="sm" href="/" />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        <CollapsibleNav
          label="Workspace"
          items={main}
          pathname={pathname}
          defaultOpen
          onNavigate={() => setOpen(false)}
        />
        <CollapsibleNav
          label="Inventory"
          items={agent}
          pathname={pathname}
          defaultOpen
          onNavigate={() => setOpen(false)}
        />
        <CollapsibleNav
          label="Administration"
          items={admin}
          pathname={pathname}
          defaultOpen
          onNavigate={() => setOpen(false)}
        />
      </div>

      <div className="border-t border-white/[0.06] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-teal to-teal-deep text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.role.toLowerCase()}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-[#f6f7f9]">
      <div className="flex min-h-[100dvh]">
        <aside className="safe-top sticky top-0 hidden h-[100dvh] w-[248px] shrink-0 border-r border-white/[0.04] bg-[#0c1520] lg:block">
          {sidebar}
        </aside>

        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 w-[280px] bg-[#0c1520] shadow-2xl">
              {sidebar}
            </aside>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="safe-top sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
            <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 lg:hidden"
                  onClick={() => setOpen(true)}
                  aria-label="Open sidebar"
                >
                  <div className="space-y-1">
                    <span className="block h-0.5 w-4 bg-current" />
                    <span className="block h-0.5 w-4 bg-current" />
                    <span className="block h-0.5 w-4 bg-current" />
                  </div>
                </button>
                <div className="min-w-0">
                  <h1 className="truncate text-[15px] font-semibold tracking-tight text-slate-900">
                    {title ?? "Dashboard"}
                  </h1>
                  {subtitle ? (
                    <p className="truncate text-xs text-slate-500">{subtitle}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {user.role === "AGENT" || user.role === "ADMIN" ? (
                  <Dropdown
                    align="right"
                    buttonClassName="inline-flex h-9 items-center gap-1.5 rounded-lg bg-teal px-3 text-sm font-semibold text-white hover:bg-teal-deep"
                    label={<span>Create</span>}
                    items={[
                      {
                        label: "New listing",
                        hint: "Add a property for sale or rent",
                        href: "/dashboard/listings/new",
                      },
                      {
                        label: "View listings",
                        hint: "Manage drafts and live homes",
                        href: "/dashboard/listings",
                      },
                    ]}
                  />
                ) : null}

                {user.role === "ADMIN" ? (
                  <Dropdown
                    align="right"
                    buttonClassName="hidden h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:inline-flex"
                    label={<span>Admin</span>}
                    items={[
                      {
                        label: "Moderation queue",
                        hint: "Approve or reject listings",
                        href: "/admin",
                      },
                      {
                        label: "Ad banners",
                        hint: "Home advertising carousel",
                        href: "/admin/banners",
                      },
                      {
                        label: "Overview",
                        hint: "Workspace summary",
                        href: "/dashboard",
                      },
                    ]}
                  />
                ) : null}

                {actions}

                <Dropdown
                  align="right"
                  buttonClassName="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white pl-1.5 pr-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  label={
                    <>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal text-[10px] font-bold text-white">
                        {initials}
                      </span>
                      <span className="hidden max-w-[120px] truncate sm:inline">{user.name}</span>
                    </>
                  }
                  items={[
                    {
                      label: "Dashboard",
                      hint: "Workspace overview",
                      href: "/dashboard",
                    },
                    {
                      label: "Favorites",
                      href: "/dashboard/favorites",
                    },
                    {
                      label: "Inquiries",
                      href: "/dashboard/inquiries",
                    },
                    {
                      label: "Browse site",
                      hint: "Back to public listings",
                      href: "/properties",
                    },
                    {
                      label: "Log out",
                      danger: true,
                      onClick: () => {
                        void logout().then(() => router.replace("/login"));
                      },
                    },
                  ]}
                />
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
