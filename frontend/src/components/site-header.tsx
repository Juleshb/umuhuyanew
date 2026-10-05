"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Dropdown } from "@/components/dropdown";
import { useAuth } from "@/lib/auth";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="safe-top sticky top-0 z-40 px-3 pt-2 sm:px-4 sm:pt-3">
      <div className="liquid-glass mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full px-3 py-2 sm:px-4 sm:py-2.5">
        <BrandLogo size="sm" priority className="sm:hidden" />
        <BrandLogo size="md" priority className="hidden sm:inline-flex" />

        <nav className="hidden items-center gap-1 text-sm font-medium text-ink/70 lg:flex">
          <Dropdown
            align="left"
            buttonClassName={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 transition hover:bg-white/55 ${
              pathname.startsWith("/properties") ? "bg-white/60 text-teal shadow-sm" : ""
            }`}
            label={<span>Explore</span>}
            items={[
              {
                label: "All properties",
                hint: "Browse every approved listing",
                href: "/properties",
              },
              {
                label: "Map search",
                hint: "View listings on the map",
                href: "/properties/map",
              },
              {
                label: "Rent",
                hint: "Homes available for rent",
                href: "/properties?listingType=RENT",
              },
              {
                label: "Buy",
                hint: "Properties for sale",
                href: "/properties?listingType=SALE",
              },
            ]}
          />

          <Dropdown
            align="left"
            buttonClassName="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 transition hover:bg-white/55"
            label={<span>Sell</span>}
            items={[
              {
                label: "List a property",
                hint: "Join as an agent and publish",
                href: "/register?role=AGENT",
              },
              {
                label: "Agent dashboard",
                hint: "Manage your listings",
                href: user ? "/dashboard/listings" : "/login?next=/dashboard/listings",
              },
            ]}
          />

          <Link
            href="/pricing"
            className={`rounded-full px-3.5 py-2 transition hover:bg-white/55 ${
              pathname.startsWith("/pricing") ? "bg-white/60 text-teal shadow-sm" : ""
            }`}
          >
            Pricing
          </Link>
          <Link
            href="/about"
            className={`rounded-full px-3.5 py-2 transition hover:bg-white/55 ${
              pathname.startsWith("/about") ? "bg-white/60 text-teal shadow-sm" : ""
            }`}
          >
            About
          </Link>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {!loading && !user ? (
            <>
              <Link
                href="/login"
                className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-ink/70 transition hover:bg-white/55 hover:text-teal sm:inline"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="btn btn-primary rounded-full px-4 py-2 text-sm shadow-sm"
              >
                Sign up
              </Link>
            </>
          ) : null}

          {user ? (
            <Dropdown
              align="right"
              buttonClassName="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/45 py-1.5 pl-1.5 pr-3 text-sm font-medium text-slate-700 shadow-sm backdrop-blur hover:bg-white/70"
              label={
                <>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal text-[11px] font-bold text-white">
                    {user.name
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </span>
                  <span className="hidden max-w-[110px] truncate sm:inline">{user.name}</span>
                </>
              }
              items={[
                { label: "Dashboard", href: "/dashboard", hint: "Your workspace" },
                { label: "Favorites", href: "/dashboard/favorites" },
                { label: "Inquiries", href: "/dashboard/inquiries" },
                ...(user.role === "BUYER" || user.role === "AGENT" || user.role === "ADMIN"
                  ? [{ label: "My listings", href: "/dashboard/listings" }]
                  : []),
                ...(user.role === "ADMIN"
                  ? [{ label: "Admin panel", href: "/admin" }]
                  : []),
                {
                  label: "Log out",
                  danger: true,
                  onClick: () => {
                    void logout().then(() => router.push("/"));
                  },
                },
              ]}
            />
          ) : null}

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/40 backdrop-blur transition hover:bg-white/70 lg:hidden"
            aria-label="Open menu"
            onClick={() => setOpen((v) => !v)}
          >
            <div className="space-y-1.5">
              <span className="block h-0.5 w-4 rounded-full bg-ink" />
              <span className="block h-0.5 w-4 rounded-full bg-ink" />
              <span className="block h-0.5 w-4 rounded-full bg-ink" />
            </div>
          </button>
        </div>
      </div>

      {open ? (
        <div className="liquid-glass mx-auto mt-2 max-w-6xl overflow-hidden rounded-[1.75rem] px-3 py-3 lg:hidden">
          <div className="flex flex-col gap-1 text-sm font-medium">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Explore
            </p>
            <Link
              href="/properties"
              className="rounded-full px-3 py-2.5 hover:bg-white/55"
              onClick={() => setOpen(false)}
            >
              All properties
            </Link>
            <Link
              href="/properties/map"
              className="rounded-full px-3 py-2.5 hover:bg-white/55"
              onClick={() => setOpen(false)}
            >
              Map search
            </Link>
            <Link
              href="/properties?listingType=RENT"
              className="rounded-full px-3 py-2.5 hover:bg-white/55"
              onClick={() => setOpen(false)}
            >
              Rent
            </Link>
            <Link
              href="/properties?listingType=SALE"
              className="rounded-full px-3 py-2.5 hover:bg-white/55"
              onClick={() => setOpen(false)}
            >
              Buy
            </Link>
            <Link
              href="/pricing"
              className="rounded-full px-3 py-2.5 hover:bg-white/55"
              onClick={() => setOpen(false)}
            >
              Pricing
            </Link>
            <p className="mt-2 px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Account
            </p>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-full px-3 py-2.5 text-teal hover:bg-white/55"
                  onClick={() => setOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  className="rounded-full px-3 py-2.5 text-left text-rose-600 hover:bg-white/55"
                  onClick={() => {
                    setOpen(false);
                    void logout();
                  }}
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-full px-3 py-2.5 hover:bg-white/55"
                onClick={() => setOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
