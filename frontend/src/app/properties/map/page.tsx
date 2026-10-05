"use client";

import Link from "next/link";
import { Suspense, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { api, formatPrice, mediaUrl } from "@/lib/api";
import { PropertyMap } from "@/components/map";
import { MapPropertyPreview } from "@/components/map/map-property-preview";
import { RwandaLocationFields } from "@/components/rwanda-location-fields";
import { formatLocation } from "@/lib/location";
import { hasCoordinates } from "@/lib/map";
import { normalizeProvinceCode } from "@/lib/rwanda-location";
import type { Property } from "@/lib/types";

type ListResponse = {
  data: Property[];
  meta: { total: number };
};

type SortKey = "newest" | "price-asc" | "price-desc";

function MapExplorer() {
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [listingType, setListingType] = useState(searchParams.get("listingType") ?? "");
  const [type, setType] = useState(searchParams.get("type") ?? "");
  const [bedrooms, setBedrooms] = useState(searchParams.get("bedrooms") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "APPROVED");
  const [sort, setSort] = useState<SortKey>("newest");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [fitToken, setFitToken] = useState(0);
  const hoverClearRef = useRef<number | null>(null);
  const [location, setLocation] = useState({
    province: normalizeProvinceCode(searchParams.get("province")) || "",
    district: searchParams.get("district") ?? "",
    sector: searchParams.get("sector") ?? "",
    cell: searchParams.get("cell") ?? "",
    village: searchParams.get("village") ?? "",
  });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", "50");
    if (status) params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    if (listingType) params.set("listingType", listingType);
    if (type) params.set("type", type);
    if (bedrooms) params.set("bedrooms", bedrooms);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (location.province) params.set("province", location.province);
    if (location.district) params.set("district", location.district);
    if (location.sector) params.set("sector", location.sector);
    if (location.cell) params.set("cell", location.cell);
    if (location.village) params.set("village", location.village);
    return params.toString();
  }, [q, listingType, type, bedrooms, minPrice, maxPrice, status, location]);

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ["properties-map", queryString],
    queryFn: () => api<ListResponse>(`/properties?${queryString}`),
  });

  const mapped = useMemo(() => {
    const rows = (data?.data ?? []).filter(hasCoordinates);
    const copy = [...rows];
    copy.sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return copy;
  }, [data?.data, sort]);

  const preview =
    mapped.find((p) => p.id === (selectedId ?? hoveredId)) ?? null;
  const saleCount = mapped.filter((p) => p.listingType === "SALE").length;
  const rentCount = mapped.filter((p) => p.listingType === "RENT").length;

  const activeFilterCount = [
    q,
    listingType,
    type,
    bedrooms,
    minPrice,
    maxPrice,
    status && status !== "APPROVED" ? status : "",
    location.province,
    location.district,
    location.sector,
    location.cell,
    location.village,
  ].filter(Boolean).length;

  function setHovered(id: string | null) {
    if (hoverClearRef.current) window.clearTimeout(hoverClearRef.current);
    if (id) {
      setHoveredId(id);
      return;
    }
    hoverClearRef.current = window.setTimeout(() => {
      setHoveredId(null);
    }, 160);
  }

  function clearFilters() {
    setQ("");
    setListingType("");
    setType("");
    setBedrooms("");
    setMinPrice("");
    setMaxPrice("");
    setStatus("APPROVED");
    setLocation({
      province: "",
      district: "",
      sector: "",
      cell: "",
      village: "",
    });
    setSelectedId(null);
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0c1520]">
      <div className="absolute inset-0 z-0 isolate">
        <PropertyMap
          properties={mapped}
          selectedId={selectedId}
          hoveredId={hoveredId}
          onSelect={(id) => {
            setSelectedId(id);
            setPanelOpen(true);
          }}
          onHover={setHovered}
          showPopup={false}
          fitToken={fitToken}
          heightClassName="h-full"
          className="h-full"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_top_left,rgba(12,21,32,0.2),transparent_45%),linear-gradient(90deg,rgba(12,21,32,0.45)_0%,transparent_38%)]" />

      {/* Overlay stack: must not block map pan/zoom/pin clicks */}
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col">
        {/* Search + filters + status — always above Results */}
        <div className="pointer-events-none relative z-30 shrink-0 p-3 sm:p-4">
          <div className="pointer-events-auto mx-auto flex max-w-[1400px] flex-wrap items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-white/20 bg-white p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
              <div className="hidden shrink-0 border-r border-slate-100 pl-3 pr-3 sm:block">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal">Map</p>
                <p className="text-sm font-semibold text-[#0b1c2c]">Explore Rwanda</p>
              </div>
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search</span>
                <svg
                  viewBox="0 0 20 20"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M8.5 14.5a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm5.5-1.5 3.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search district, sector, street…"
                  className="h-11 w-full rounded-xl border-0 bg-transparent pl-9 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
              </label>
              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Filters
                {activeFilterCount ? (
                  <span className="rounded-full bg-teal px-1.5 py-0.5 text-[10px] font-bold">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setFitToken((n) => n + 1)}
                className="inline-flex h-11 items-center rounded-xl border border-white/25 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Fit all
              </button>
              <Link
                href="/properties"
                className="inline-flex h-11 items-center rounded-xl border border-white/25 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                List view
              </Link>
              <button
                type="button"
                className="inline-flex h-11 items-center rounded-xl border border-white/25 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 lg:hidden"
                onClick={() => setPanelOpen((v) => !v)}
              >
                {panelOpen ? "Hide" : "Results"}
              </button>
            </div>
          </div>

          <div className="pointer-events-auto mx-auto mt-2 flex max-w-[1400px] flex-wrap gap-2">
            {(
              [
                { value: "", label: "All" },
                { value: "SALE", label: "Buy" },
                { value: "RENT", label: "Rent" },
              ] as const
            ).map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => setListingType(chip.value)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm transition ${
                  listingType === chip.value
                    ? "bg-teal text-white"
                    : "border border-white/25 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {chip.label}
              </button>
            ))}
            <span className="rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
              {isLoading || isFetching ? "Updating…" : `${mapped.length} on map`}
            </span>
            <span className="hidden rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur sm:inline">
              {saleCount} sale · {rentCount} rent
            </span>
            {activeFilterCount ? (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full border border-orange/40 bg-white px-3 py-1.5 text-xs font-semibold text-orange shadow-sm hover:bg-orange/5"
              >
                Clear filters
              </button>
            ) : null}
          </div>

          {filtersOpen ? (
            <div className="pointer-events-auto mx-auto mt-2 max-w-[1400px] rounded-2xl border border-white/20 bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.18)] sm:max-w-xl">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal">Filters</p>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="input rounded-xl text-sm"
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
                  className="input rounded-xl text-sm"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                >
                  <option value="">Bedrooms</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </select>
                <input
                  className="input rounded-xl text-sm"
                  type="number"
                  placeholder="Min RWF"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <input
                  className="input rounded-xl text-sm"
                  type="number"
                  placeholder="Max RWF"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
                <select
                  className="input col-span-2 rounded-xl text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">Available + sold/rented</option>
                  <option value="APPROVED">Available only</option>
                  <option value="SOLD">Sold</option>
                  <option value="RENTED">Rented</option>
                </select>
              </div>
              <RwandaLocationFields
                value={location}
                onChange={setLocation}
                selectClassName="input rounded-xl text-sm"
                className="mt-2 grid gap-2"
                showLabels={false}
              />
            </div>
          ) : null}
        </div>

        {/* Results live only in the space below filters/status */}
        <div className="pointer-events-none relative z-20 min-h-0 flex-1 px-0 pb-[calc(4.25rem+env(safe-area-inset-bottom))] sm:px-4 sm:pb-4 md:pb-4">
          <aside
            className={`pointer-events-auto absolute inset-x-0 bottom-0 top-auto flex max-h-[min(52vh,480px)] flex-col overflow-hidden rounded-t-3xl border border-white/15 bg-white shadow-[0_16px_48px_rgba(0,0,0,0.28)] transition-transform duration-300 ease-out sm:inset-y-0 sm:left-0 sm:right-auto sm:max-h-none sm:w-[380px] sm:rounded-3xl ${
              panelOpen
                ? "translate-y-0"
                : "translate-y-[calc(100%-3rem)] sm:translate-y-0 sm:-translate-x-[110%]"
            }`}
          >
            <button
              type="button"
              className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-slate-200 sm:hidden"
              aria-label={panelOpen ? "Collapse results" : "Expand results"}
              onClick={() => setPanelOpen((v) => !v)}
            />
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal">
                  Results
                </p>
                <p className="truncate text-sm font-semibold text-[#0b1c2c]">
                  {isLoading ? "Loading…" : `${mapped.length} mapped listings`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <select
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                >
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price ↑</option>
                  <option value="price-desc">Price ↓</option>
                </select>
                <button
                  type="button"
                  className="hidden h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 sm:inline-flex"
                  onClick={() => setPanelOpen(false)}
                  aria-label="Hide results"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
              {error ? (
                <p className="rounded-xl bg-orange/10 px-3 py-3 text-sm text-orange">
                  Could not load map listings.
                </p>
              ) : null}

              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                  ))}
                </div>
              ) : null}

              {!isLoading && mapped.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center">
                  <p className="font-semibold text-[#0b1c2c]">No mapped homes here</p>
                  <p className="mt-1 text-sm text-ink/55">
                    Widen filters or switch to list view.
                  </p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-3 text-sm font-semibold text-teal"
                  >
                    Reset filters
                  </button>
                </div>
              ) : null}

              <div className="space-y-2">
                {mapped.map((property) => {
                  const image =
                    property.images.find((img) => img.isPrimary) ?? property.images[0];
                  const active = selectedId === property.id;
                  return (
                    <button
                      key={property.id}
                      type="button"
                  onClick={() => {
                    setSelectedId(property.id);
                    setHoveredId(null);
                  }}
                  onMouseEnter={() => setHovered(property.id)}
                  onMouseLeave={() => {
                    if (selectedId !== property.id) setHovered(null);
                  }}
                  className={`flex w-full gap-3 rounded-2xl border p-2.5 text-left transition ${
                    active
                      ? "border-teal bg-teal/5 shadow-sm"
                      : "border-slate-100 bg-white hover:border-teal/30 hover:bg-slate-50"
                  }`}
                >
                      <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={mediaUrl(image.url)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-[#0b1c2c]">
                            {property.title}
                          </p>
                          <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                            {property.listingType}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm font-bold text-teal">
                          {formatPrice(property.price, property.currency)}
                          {property.listingType === "RENT" ? (
                            <span className="text-xs font-medium text-ink/45"> / mo</span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-ink/55">
                          {formatLocation(property, { compact: true })}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </aside>

          {!panelOpen ? (
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              className="pointer-events-auto absolute bottom-4 left-4 hidden rounded-2xl border border-white/20 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-lg sm:inline-flex"
            >
              Show results ({mapped.length})
            </button>
          ) : null}

          {/* Full property card on map (hover or click) */}
          {preview ? (
            <div
              className={`pointer-events-auto absolute z-30 w-[min(100%-1.5rem,360px)] transition duration-200 ${
                panelOpen
                  ? "bottom-[calc(min(52vh,480px)+0.75rem)] left-1/2 -translate-x-1/2 sm:bottom-4 sm:left-auto sm:right-4 sm:translate-x-0"
                  : "bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0"
              }`}
              onMouseEnter={() => setHovered(preview.id)}
              onMouseLeave={() => {
                if (!selectedId) setHovered(null);
              }}
            >
              <MapPropertyPreview
                property={preview}
                pinned={Boolean(selectedId && preview.id === selectedId)}
                onClose={
                  selectedId || hoveredId
                    ? () => {
                        setSelectedId(null);
                        setHoveredId(null);
                      }
                    : undefined
                }
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function PropertiesMapPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center bg-[#0c1520] text-sm text-slate-300">
          Loading map…
        </div>
      }
    >
      <MapExplorer />
    </Suspense>
  );
}
