"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api, formatPrice, mediaUrl } from "@/lib/api";
import { PropertyCard } from "@/components/property-card";
import { formatLocation } from "@/lib/location";
import { provinceOptions } from "@/lib/rwanda-location";
import type { Property } from "@/lib/types";

type ListResponse = {
  data: Property[];
  meta: { total: number };
};

export function LandingPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"RENT" | "SALE" | "SELL">("RENT");
  const [location, setLocation] = useState("Kigali");
  const [audience, setAudience] = useState<"buyers" | "agents">("buyers");

  const { data } = useQuery({
    queryKey: ["landing-properties"],
    queryFn: () => api<ListResponse>("/properties?status=APPROVED&limit=6"),
  });

  const featured = data?.data ?? [];
  const heroProperty = featured[0];
  const sideProperty = featured[1];

  const searchHref = useMemo(() => {
    if (tab === "SELL") return "/register?role=AGENT";
    const params = new URLSearchParams();
    params.set("listingType", tab);
    if (location) params.set("province", location);
    return `/properties?${params.toString()}`;
  }, [tab, location]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    router.push(searchHref);
  }

  return (
    <div className="bg-white text-ink">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#f3f7f8]">
        <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-teal/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-10 h-56 w-56 rounded-full bg-orange/10 blur-3xl" />

        <div className="mx-auto grid min-h-[calc(100dvh-4.5rem)] max-w-6xl gap-8 px-4 pb-10 pt-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:pb-20 lg:pt-14">
          <div className="animate-rise">
            <p className="mb-3 inline-flex rounded-full bg-teal/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-teal">
              Rwanda real estate app
            </p>
            <h1 className="max-w-xl text-[2.1rem] font-bold leading-[1.08] tracking-tight text-[#0b1c2c] sm:text-5xl lg:text-[3.4rem]">
              Buy, rent, or sell your property easily
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink/65 sm:text-lg">
              Discover properties and accommodation in one place — houses, plots, apartments, and
              lodges across Rwanda. Discover. Connect. Find Your Place.
            </p>

            <div className="mt-8 flex gap-8">
              <div>
                <p className="text-2xl font-bold text-[#0b1c2c]">1k+</p>
                <p className="text-sm text-ink/55">renters & buyers</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0b1c2c]">
                  {data?.meta.total ?? featured.length}+
                </p>
                <p className="text-sm text-ink/55">properties</p>
              </div>
            </div>

            <form
              onSubmit={onSearch}
              className="mt-8 rounded-2xl border border-black/5 bg-white p-3 shadow-[0_18px_50px_rgba(20,32,34,0.08)]"
            >
              <div className="flex gap-2 border-b border-black/5 pb-3">
                {(
                  [
                    ["RENT", "Rent"],
                    ["SALE", "Buy"],
                    ["SELL", "Sell"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTab(value)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      tab === value
                        ? "bg-teal/10 text-teal"
                        : "text-ink/55 hover:text-ink"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-[1.2fr_1fr_auto]">
                <label className="block text-xs font-semibold uppercase tracking-wide text-ink/45">
                  Location
                  <select
                    className="input mt-1.5 rounded-xl border-black/10 bg-[#f8fbfb]"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  >
                    {provinceOptions().map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-semibold uppercase tracking-wide text-ink/45">
                  Looking for
                  <input
                    className="input mt-1.5 rounded-xl border-black/10 bg-[#f8fbfb]"
                    value={tab === "SELL" ? "List with an agent" : "Homes & land"}
                    readOnly
                  />
                </label>
                <button type="submit" className="btn btn-primary self-end rounded-xl px-5">
                  Browse Properties
                </button>
              </div>
            </form>
          </div>

          <div className="relative mx-auto w-full max-w-lg animate-fade lg:max-w-none">
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-teal/20 via-white to-orange/15 p-4 sm:p-6">
              <div className="absolute inset-6 rounded-[1.5rem] border border-dashed border-teal/25" />
              {heroProperty ? (
                <Link
                  href={`/properties/${heroProperty.id}`}
                  className="relative z-10 block overflow-hidden rounded-2xl bg-white shadow-lg"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaUrl(
                      (heroProperty.images.find((i) => i.isPrimary) ?? heroProperty.images[0])
                        ?.url ?? ""
                    )}
                    alt={heroProperty.title}
                    className="aspect-[5/4] w-full object-cover"
                  />
                  <div className="p-4">
                    <p className="text-lg font-bold text-teal">
                      {formatPrice(heroProperty.price, heroProperty.currency)}
                      {heroProperty.listingType === "RENT" ? (
                        <span className="text-sm font-medium text-ink/50"> / month</span>
                      ) : null}
                    </p>
                    <p className="mt-1 font-semibold text-ink">{heroProperty.title}</p>
                    <p className="text-sm text-ink/55">
                      {formatLocation(heroProperty, { compact: true })}
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="relative z-10 aspect-[5/4] rounded-2xl bg-mist" />
              )}

              {sideProperty ? (
                <Link
                  href={`/properties/${sideProperty.id}`}
                  className="absolute -bottom-2 left-2 z-20 w-[58%] overflow-hidden rounded-xl border border-white bg-white p-2 shadow-xl sm:left-0"
                >
                  <div className="flex gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mediaUrl(
                        (sideProperty.images.find((i) => i.isPrimary) ?? sideProperty.images[0])
                          ?.url ?? ""
                      )}
                      alt=""
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                    <div className="min-w-0 py-0.5">
                      <p className="truncate text-sm font-bold text-teal">
                        {formatPrice(sideProperty.price, sideProperty.currency)}
                      </p>
                      <p className="truncate text-xs font-semibold text-ink">{sideProperty.title}</p>
                      <p className="truncate text-[11px] text-ink/50">
                        {formatLocation(sideProperty, {
                          compact: true,
                          includeProvince: false,
                        })}
                      </p>
                    </div>
                  </div>
                </Link>
              ) : null}

              <div className="absolute -right-1 top-8 z-20 rounded-xl bg-orange px-3 py-2 text-xs font-bold text-white shadow-lg sm:right-2">
                Kigali · RWF
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Easy for buyers & agents */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1400&q=80"
            alt="Modern home in Rwanda"
            className="aspect-[4/3] w-full rounded-[2rem] object-cover"
          />
          <div className="absolute left-4 top-4 rounded-xl bg-white p-3 shadow-lg sm:left-6 sm:top-6">
            <p className="text-sm font-bold text-ink">Local agent support</p>
            <p className="text-xs text-ink/55">Connect with trusted agents in Kigali</p>
          </div>
          <div className="absolute bottom-4 right-4 rounded-xl bg-white p-3 shadow-lg sm:bottom-6 sm:right-6">
            <p className="text-sm font-bold text-ink">Find the best deal</p>
            <p className="text-xs text-ink/55">Browse thousands of RWF listings</p>
          </div>
        </div>

        <div>
          <div className="inline-flex rounded-full bg-[#eef6f7] p-1">
            <button
              type="button"
              onClick={() => setAudience("buyers")}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                audience === "buyers" ? "bg-white text-teal shadow-sm" : "text-ink/55"
              }`}
            >
              For buyers & renters
            </button>
            <button
              type="button"
              onClick={() => setAudience("agents")}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                audience === "agents" ? "bg-white text-teal shadow-sm" : "text-ink/55"
              }`}
            >
              For agents
            </button>
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-[#0b1c2c] sm:text-4xl">
            We make it easy for buyers and agents.
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-ink/65">
            {audience === "buyers"
              ? "Whether you are settling in Kigali or exploring homes outside the capital, Umuhuza Online helps you discover listings, save favorites, and contact agents quickly."
              : "List properties, upload photos, and reach serious buyers and renters. Submit listings for approval and manage inquiries from one dashboard."}
          </p>
          <Link href={audience === "buyers" ? "/properties" : "/register?role=AGENT"} className="btn btn-primary mt-6 rounded-xl">
            See more
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#f5f8f9]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[#0b1c2c] sm:text-4xl">
              The new way to find your new home
            </h2>
            <p className="mt-4 max-w-md text-ink/65">
              Find your dream place to live with properties listed across Kigali and Rwanda&apos;s
              growing cities.
            </p>
            <div className="mt-8 space-y-5">
              {[
                { value: "Fast", label: "Property matching in Kigali & beyond" },
                {
                  value: String(data?.meta.total ?? 6),
                  label: "Properties in sell & rent",
                },
                { value: "Agents", label: "Local experts ready for inquiries" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal/15 text-sm font-bold text-teal">
                    {item.value.slice(0, 4)}
                  </div>
                  <div>
                    <p className="font-bold text-[#0b1c2c]">{item.value}</p>
                    <p className="text-sm text-ink/60">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="aspect-square rounded-[2rem] bg-gradient-to-br from-teal to-teal-deep p-8 text-white shadow-xl">
              <p className="text-sm uppercase tracking-[0.2em] text-white/70">Umuhuza</p>
              <p className="mt-4 text-3xl font-bold leading-tight">Homes connected to people</p>
              <p className="mt-4 text-white/80">
                From Nyarutarama apartments to lakeside cottages in Rubavu — one connector for
                Rwanda&apos;s market.
              </p>
              <Link
                href="/properties"
                className="mt-8 inline-flex rounded-xl bg-orange px-4 py-2.5 text-sm font-bold text-white"
              >
                Explore listings
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Listings */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[#0b1c2c]">
              Based on your location
            </h2>
            <p className="mt-2 text-ink/60">
              Some of our picked properties near Kigali and across Rwanda.
            </p>
          </div>
          <Link href="/properties" className="btn btn-primary rounded-xl">
            Browse more properties
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((property, index) => (
            <PropertyCard key={property.id} property={property} popular={index < 3} />
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[#f5f8f9]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="text-3xl font-bold tracking-tight text-[#0b1c2c]">Testimonials</h2>
          <p className="mt-2 max-w-xl text-ink/60">
            See what buyers, renters, and agents say about finding property with Umuhuza Online.
          </p>
          <blockquote className="mt-8 max-w-3xl rounded-3xl bg-white p-8 text-xl leading-relaxed text-[#0b1c2c] shadow-[0_12px_40px_rgba(20,32,34,0.06)] sm:text-2xl">
            “Umuhuza Online is where I go when looking for a place in Kigali. Clear listings,
            trusted agents, and a simple way to start the conversation.”
            <footer className="mt-6 text-base font-semibold text-teal">
              Aline U., Renter in Gasabo
            </footer>
          </blockquote>
        </div>
      </section>

      {/* Agent CTA */}
      <section className="bg-[#0b1c2c]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange">
              No spam promise
            </p>
            <h2 className="mt-2 text-3xl font-bold text-white">Are you an agent?</h2>
            <p className="mt-2 max-w-lg text-white/70">
              Discover ways to list homes in Kigali and beyond. Join other agents connecting
              Rwanda&apos;s growing real estate market.
            </p>
          </div>
          <Link
            href="/register?role=AGENT"
            className="btn rounded-xl bg-orange px-6 py-3 font-bold text-white hover:bg-orange-deep"
          >
            Join as an agent
          </Link>
        </div>
      </section>
    </div>
  );
}
