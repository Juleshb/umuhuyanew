"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { PropertyCard } from "@/components/property-card";
import { RwandaLocationFields } from "@/components/rwanda-location-fields";
import { normalizeProvinceCode } from "@/lib/rwanda-location";
import type { Property } from "@/lib/types";

type ListResponse = {
  data: Property[];
  meta: { total: number; page: number; limit: number; pages: number };
};

function PropertiesExplorer() {
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [listingType, setListingType] = useState(searchParams.get("listingType") ?? "");
  const [type, setType] = useState(searchParams.get("type") ?? "");
  const [location, setLocation] = useState({
    province: normalizeProvinceCode(searchParams.get("province")) || "",
    district: searchParams.get("district") ?? "",
    sector: searchParams.get("sector") ?? "",
    cell: searchParams.get("cell") ?? "",
    village: searchParams.get("village") ?? "",
  });
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [bedrooms, setBedrooms] = useState(searchParams.get("bedrooms") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (listingType) params.set("listingType", listingType);
    if (type) params.set("type", type);
    if (location.province) params.set("province", location.province);
    if (location.district) params.set("district", location.district);
    if (location.sector) params.set("sector", location.sector);
    if (location.cell) params.set("cell", location.cell);
    if (location.village) params.set("village", location.village);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (bedrooms) params.set("bedrooms", bedrooms);
    if (status) params.set("status", status);
    return params.toString();
  }, [q, listingType, type, location, minPrice, maxPrice, bedrooms, status]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["properties", queryString],
    queryFn: () =>
      api<ListResponse>(`/properties${queryString ? `?${queryString}` : ""}`),
  });

  return (
    <div className="min-h-[100dvh] bg-[#f7fafb]">
      <div className="sticky top-[calc(env(safe-area-inset-top)+3.25rem)] z-20 border-b border-black/5 bg-white/95 backdrop-blur-xl md:top-0">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <input
              className="input flex-1 rounded-2xl border-black/10 bg-[#f4f7f8]"
              placeholder="Search keyword, street, landmark…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-secondary rounded-2xl px-4 text-sm md:hidden"
              onClick={() => setFiltersOpen((v) => !v)}
            >
              Filters
            </button>
          </div>

          <div
            className={`mt-3 space-y-2 ${filtersOpen ? "block" : "hidden md:block"}`}
          >
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <select
                className="input rounded-xl"
                value={listingType}
                onChange={(e) => setListingType(e.target.value)}
              >
                <option value="">Sale or rent</option>
                <option value="SALE">For sale</option>
                <option value="RENT">For rent</option>
              </select>
              <select
                className="input rounded-xl"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Available + sold/rented</option>
                <option value="APPROVED">Available only</option>
                <option value="SOLD">Sold</option>
                <option value="RENTED">Rented</option>
              </select>
              <select
                className="input rounded-xl"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="">All types</option>
                <option value="HOUSE">House</option>
                <option value="APARTMENT">Apartment</option>
                <option value="LAND">Land</option>
                <option value="COMMERCIAL">Commercial</option>
              </select>
              <select
                className="input rounded-xl"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
              >
                <option value="">Bedrooms</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </div>

            <RwandaLocationFields
              value={location}
              onChange={setLocation}
              selectClassName="input rounded-xl"
              className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5"
              showLabels={false}
            />

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <input
                className="input rounded-xl"
                type="number"
                placeholder="Min RWF"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <input
                className="input rounded-xl"
                type="number"
                placeholder="Max RWF"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#0b1c2c] sm:text-3xl">Explore Rwanda</h1>
            <p className="mt-1 text-sm text-ink/60">
              {data ? `${data.meta.total} properties` : "Searching listings…"}
            </p>
          </div>
          <Link
            href="/properties/map"
            className="btn btn-secondary rounded-xl text-sm"
          >
            Map search
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : null}
        {error ? (
          <p className="rounded-2xl bg-orange/10 p-4 text-orange">
            Could not load properties. Is the API running?
          </p>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data?.data.map((property, index) => (
            <PropertyCard key={property.id} property={property} popular={index < 3} />
          ))}
        </div>

        {data && data.data.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/10 bg-white p-10 text-center">
            <p className="font-semibold text-[#0b1c2c]">No matches</p>
            <p className="mt-2 text-sm text-ink/60">
              Try another district, sector, or clear filters.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<p className="p-8 text-ink/60">Loading explore…</p>}>
      <PropertiesExplorer />
    </Suspense>
  );
}
