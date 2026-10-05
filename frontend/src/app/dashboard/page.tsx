"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ApexOptions } from "apexcharts";
import { api, formatPrice, mediaUrl } from "@/lib/api";
import { DashboardShell } from "@/components/dashboard-shell";
import { ModernChart } from "@/components/modern-chart";
import { useAuth } from "@/lib/auth";
import {
  averagePrice,
  buildActivitySeries,
  buildHourlySeries,
  countBy,
  sparklineFromSeries,
  splitRecent,
  sumPrices,
} from "@/lib/dashboard-stats";
import type { Inquiry, Property } from "@/lib/types";

type FavoriteItem = { id: string; createdAt?: string; property: Property };
type ListResponse = { data: Property[]; meta?: { total: number } };

const POLL_MS = 4000;
const TEAL = "#0f9ea8";
const ORANGE = "#f26b1d";
const NAVY = "#0b1c2c";
const COLORS = [TEAL, ORANGE, NAVY, "#38bdf8", "#94a3b8", "#22c55e"];

export default function DashboardHomePage() {
  const { user } = useAuth();
  const isAgent = user?.role === "AGENT" || user?.role === "ADMIN";
  const isAdmin = user?.role === "ADMIN";
  const [now, setNow] = useState(() => new Date());
  const [range, setRange] = useState<"24h" | "14d">("24h");

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const liveQuery = {
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  };

  const favorites = useQuery({
    queryKey: ["favorites"],
    queryFn: () => api<{ data: FavoriteItem[] }>("/favorites"),
    ...liveQuery,
  });
  const inquiries = useQuery({
    queryKey: ["inquiries"],
    queryFn: () => api<{ data: Inquiry[] }>("/inquiries"),
    ...liveQuery,
  });
  const listings = useQuery({
    queryKey: ["agent-properties"],
    enabled: !!isAgent,
    queryFn: () => api<{ data: Property[] }>("/agent/properties"),
    ...liveQuery,
  });
  const market = useQuery({
    queryKey: ["market-properties"],
    queryFn: () => api<ListResponse>("/properties?limit=50"),
    ...liveQuery,
  });

  const inquiryList = inquiries.data?.data ?? [];
  const listingList = listings.data?.data ?? [];
  const marketList = market.data?.data ?? [];
  const favoriteList = favorites.data?.data ?? [];

  const fetching =
    favorites.isFetching ||
    inquiries.isFetching ||
    market.isFetching ||
    (isAgent && listings.isFetching);

  const lastSynced =
    favorites.dataUpdatedAt ||
    inquiries.dataUpdatedAt ||
    market.dataUpdatedAt ||
    listings.dataUpdatedAt ||
    Date.now();

  const stats = useMemo(() => {
    const source = isAgent ? listingList : marketList;
    const pending = listingList.filter((p) => p.status === "PENDING").length;
    const approved = listingList.filter((p) => p.status === "APPROVED").length;
    const drafts = listingList.filter((p) => p.status === "DRAFT").length;
    const newInquiries = inquiryList.filter((i) => i.status === "NEW").length;
    const rent = source.filter((p) => p.listingType === "RENT");
    const sale = source.filter((p) => p.listingType === "SALE");
    const daily = buildActivitySeries(inquiryList, listingList, 14);
    const hourly = buildHourlySeries(inquiryList, listingList, 24);

    return {
      pending,
      approved,
      drafts,
      newInquiries,
      portfolioValue: sumPrices(listingList.filter((p) => p.status === "APPROVED")),
      avgPrice: averagePrice(source),
      avgRent: averagePrice(rent),
      avgSale: averagePrice(sale),
      daily,
      hourly,
      spark: sparklineFromSeries(hourly),
      byStatus: countBy(listingList.map((p) => p.status)),
      byType: countBy(source.map((p) => p.type)),
      byProvince: countBy(source.map((p) => p.province)).slice(0, 6),
      byListingType: countBy(source.map((p) => p.listingType)),
      inquiryTrend: splitRecent(inquiryList.map((i) => i.createdAt)),
      listingTrend: splitRecent(listingList.map((p) => p.createdAt)),
      favoriteTrend: splitRecent(favoriteList.map((f) => f.createdAt ?? f.property.createdAt)),
      inquiryStatus: countBy(inquiryList.map((i) => i.status)),
    };
  }, [favoriteList, inquiryList, isAgent, listingList, marketList]);

  const activity = range === "24h" ? stats.hourly : stats.daily;

  const areaOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "area",
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: {
          enabled: true,
          speed: 700,
          dynamicAnimation: { enabled: true, speed: 350 },
        },
        fontFamily: "inherit",
        background: "transparent",
      },
      colors: [TEAL, ORANGE],
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 3 },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.35,
          opacityTo: 0.02,
          stops: [0, 90, 100],
        },
      },
      grid: {
        borderColor: "#eef2f7",
        strokeDashArray: 4,
        padding: { left: 8, right: 8 },
      },
      xaxis: {
        categories: activity.map((p) => p.label),
        labels: { style: { colors: "#94a3b8", fontSize: "11px" } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: { style: { colors: "#94a3b8", fontSize: "11px" } },
        forceNiceScale: true,
        min: 0,
      },
      legend: {
        position: "top",
        horizontalAlign: "right",
        labels: { colors: "#64748b" },
      },
      tooltip: {
        theme: "light",
        shared: true,
        intersect: false,
      },
    }),
    [activity]
  );

  const donutOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "donut",
        animations: { enabled: true, dynamicAnimation: { enabled: true, speed: 350 } },
        fontFamily: "inherit",
      },
      labels: stats.byType.map((i) => i.name),
      colors: COLORS,
      legend: { show: false },
      dataLabels: { enabled: false },
      stroke: { width: 0 },
      plotOptions: {
        pie: {
          donut: {
            size: "72%",
            labels: {
              show: true,
              name: { show: true, color: "#64748b", fontSize: "12px" },
              value: {
                show: true,
                fontSize: "22px",
                fontWeight: 700,
                color: NAVY,
              },
              total: {
                show: true,
                label: "Total",
                color: "#94a3b8",
                formatter: () =>
                  String(stats.byType.reduce((s, i) => s + i.value, 0) || 0),
              },
            },
          },
        },
      },
      tooltip: { theme: "light" },
    }),
    [stats.byType]
  );

  const statusData = isAgent ? stats.byStatus : stats.inquiryStatus;
  const barOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        toolbar: { show: false },
        animations: { enabled: true, dynamicAnimation: { enabled: true, speed: 350 } },
        fontFamily: "inherit",
      },
      colors: [TEAL],
      plotOptions: {
        bar: {
          borderRadius: 8,
          columnWidth: "42%",
          distributed: true,
        },
      },
      dataLabels: { enabled: false },
      legend: { show: false },
      grid: { borderColor: "#eef2f7", strokeDashArray: 4 },
      xaxis: {
        categories: statusData.map((i) => i.name),
        labels: { style: { colors: "#94a3b8", fontSize: "11px" } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: { style: { colors: "#94a3b8", fontSize: "11px" } },
        forceNiceScale: true,
        min: 0,
      },
      tooltip: { theme: "light" },
    }),
    [statusData]
  );

  const provinceOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        toolbar: { show: false },
        animations: { enabled: true, dynamicAnimation: { enabled: true, speed: 350 } },
        fontFamily: "inherit",
      },
      colors: [ORANGE],
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 7,
          barHeight: "55%",
        },
      },
      dataLabels: { enabled: false },
      grid: { borderColor: "#eef2f7", strokeDashArray: 4 },
      xaxis: {
        categories: stats.byProvince.map((i) => i.name),
        labels: { style: { colors: "#94a3b8", fontSize: "11px" } },
      },
      yaxis: {
        labels: { style: { colors: "#64748b", fontSize: "11px" } },
      },
      tooltip: { theme: "light" },
    }),
    [stats.byProvince]
  );

  const recentInquiries = inquiryList.slice(0, 6);
  const recentListings = listingList.slice(0, 6);

  return (
    <DashboardShell
      title="Live analytics"
      subtitle={`Realtime marketplace pulse · ${now.toLocaleTimeString()}`}
      actions={
        <div className="flex items-center gap-2">
          <LiveBadge fetching={fetching} syncedAt={lastSynced} />
          <div className="hidden rounded-lg border border-slate-200 bg-white p-0.5 sm:inline-flex">
            <RangeButton active={range === "24h"} onClick={() => setRange("24h")}>
              24h
            </RangeButton>
            <RangeButton active={range === "14d"} onClick={() => setRange("14d")}>
              14d
            </RangeButton>
          </div>
        </div>
      }
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Inquiries"
          value={inquiryList.length}
          detail={`${stats.newInquiries} new · ${trendLabel(stats.inquiryTrend.change)} vs last week`}
          href="/dashboard/inquiries"
          trend={stats.inquiryTrend.change}
          spark={stats.spark}
          color={TEAL}
        />
        <Metric
          label="Favorites"
          value={favoriteList.length}
          detail={`${trendLabel(stats.favoriteTrend.change)} saved interest`}
          href="/dashboard/favorites"
          trend={stats.favoriteTrend.change}
          spark={stats.spark.map((v, i) => (i % 2 === 0 ? v : Math.max(0, v - 1)))}
          color={ORANGE}
        />
        {isAgent ? (
          <>
            <Metric
              label="Live listings"
              value={stats.approved}
              detail={`${listingList.length} total · ${stats.pending} pending`}
              href="/dashboard/listings"
              trend={stats.listingTrend.change}
              spark={stats.daily.map((d) => d.listings)}
              color={TEAL}
            />
            <Metric
              label="Portfolio value"
              value={compactRwf(stats.portfolioValue)}
              detail={`Avg ${compactRwf(stats.avgPrice)}`}
              href="/dashboard/listings"
              spark={stats.daily.map((d) => d.total)}
              color={NAVY}
            />
          </>
        ) : (
          <>
            <Metric
              label="Market listings"
              value={market.data?.meta?.total ?? marketList.length}
              detail={`Avg ${compactRwf(stats.avgPrice)}`}
              href="/properties"
              spark={stats.spark}
              color={TEAL}
            />
            <Metric
              label="Avg rent"
              value={compactRwf(stats.avgRent)}
              detail={`Sale avg ${compactRwf(stats.avgSale)}`}
              href="/properties?listingType=RENT"
              spark={stats.daily.map((d) => d.inquiries)}
              color={ORANGE}
            />
          </>
        )}
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.65fr_1fr]">
        <Panel
          title={range === "24h" ? "Realtime activity (24 hours)" : "Activity (14 days)"}
          subtitle="Auto-refreshes every few seconds"
        >
          <div className="px-2 pb-1 pt-2 sm:hidden">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
              <RangeButton active={range === "24h"} onClick={() => setRange("24h")}>
                24h
              </RangeButton>
              <RangeButton active={range === "14d"} onClick={() => setRange("14d")}>
                14d
              </RangeButton>
            </div>
          </div>
          <ModernChart
            type="area"
            height={320}
            options={areaOptions}
            series={[
              { name: "Inquiries", data: activity.map((p) => p.inquiries) },
              { name: "Listings", data: activity.map((p) => p.listings) },
            ]}
          />
        </Panel>

        <Panel title="Listing mix" subtitle={isAgent ? "Your inventory types" : "Market types"}>
          <ModernChart
            type="donut"
            height={280}
            options={donutOptions}
            series={stats.byType.length ? stats.byType.map((i) => i.value) : [1]}
          />
          <div className="space-y-2 px-4 pb-4">
            {(stats.byType.length ? stats.byType : [{ name: "No data", value: 0 }]).map(
              (item, index) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: COLORS[index % COLORS.length] }}
                    />
                    {item.name}
                  </span>
                  <span className="font-semibold text-slate-900">{item.value}</span>
                </div>
              )
            )}
          </div>
        </Panel>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel
          title={isAgent ? "Status pipeline" : "Inquiry status"}
          subtitle="Live distribution"
        >
          <ModernChart
            type="bar"
            height={280}
            options={barOptions}
            series={[
              {
                name: isAgent ? "Listings" : "Inquiries",
                data: statusData.length ? statusData.map((i) => i.value) : [0],
              },
            ]}
          />
        </Panel>

        <Panel title="Top provinces" subtitle="Where demand and supply concentrate">
          <ModernChart
            type="bar"
            height={280}
            options={provinceOptions}
            series={[
              {
                name: "Properties",
                data: stats.byProvince.length
                  ? stats.byProvince.map((i) => i.value)
                  : [0],
              },
            ]}
          />
        </Panel>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Panel
          title={isAgent ? "Recent listings" : "Recent inquiries"}
          action={
            <Link
              href={isAgent ? "/dashboard/listings" : "/dashboard/inquiries"}
              className="text-xs font-semibold text-teal hover:text-teal-deep"
            >
              View all
            </Link>
          }
        >
          {isAgent ? (
            recentListings.length ? (
              <div className="divide-y divide-slate-100">
                {recentListings.map((property) => {
                  const image = property.images[0];
                  return (
                    <Link
                      key={property.id}
                      href={`/dashboard/listings/${property.id}/edit`}
                      className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50/80"
                    >
                      <div className="h-11 w-14 overflow-hidden rounded-md bg-slate-100">
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
                        <p className="truncate text-sm font-medium text-slate-900">
                          {property.title}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {property.district} · {formatPrice(property.price, property.currency)}
                        </p>
                      </div>
                      <StatusPill status={property.status} />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                text="No listings yet."
                href="/dashboard/listings/new"
                cta="Create listing"
              />
            )
          ) : recentInquiries.length ? (
            <div className="divide-y divide-slate-100">
              {recentInquiries.map((inquiry) => (
                <div key={inquiry.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {inquiry.property.title}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                        {inquiry.message}
                      </p>
                    </div>
                    <StatusPill status={inquiry.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="No inquiries yet." href="/properties" cta="Browse properties" />
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="Live ratios">
            <div className="grid grid-cols-2 gap-3 p-4">
              <RatioCard label="Backlog" value={`${stats.newInquiries}`} hint="New inquiries" />
              <RatioCard
                label="Approval rate"
                value={`${approvalRate(stats.approved, listingList.length)}%`}
                hint="Live vs total"
              />
              <RatioCard
                label="Rent share"
                value={`${share(stats.byListingType, "RENT")}%`}
                hint="Of inventory"
              />
              <RatioCard
                label="Sale share"
                value={`${share(stats.byListingType, "SALE")}%`}
                hint="Of inventory"
              />
            </div>
          </Panel>

          {isAdmin ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-[#0c1520] p-5 text-white">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-teal" />
                </span>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal">
                  Live admin
                </p>
              </div>
              <h2 className="mt-2 text-base font-semibold">
                {stats.pending} listing{stats.pending === 1 ? "" : "s"} awaiting review
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Queue updates automatically as agents submit properties.
              </p>
              <Link
                href="/admin"
                className="mt-4 inline-flex h-9 items-center rounded-lg bg-teal px-3.5 text-sm font-semibold text-white hover:bg-teal-deep"
              >
                Open moderation
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </DashboardShell>
  );
}

function LiveBadge({ fetching, syncedAt }: { fetching: boolean; syncedAt: number }) {
  return (
    <div className="inline-flex h-9 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700">
      <span className="relative flex h-2 w-2">
        <span
          className={`absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 ${
            fetching ? "animate-ping" : ""
          }`}
        />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      LIVE
      <span className="font-medium text-emerald-600/80">
        {new Date(syncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </span>
    </div>
  );
}

function RangeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
        active ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

function Metric({
  label,
  value,
  detail,
  href,
  trend,
  spark,
  color,
}: {
  label: string;
  value: string | number;
  detail: string;
  href: string;
  trend?: number;
  spark: number[];
  color: string;
}) {
  const sparkOptions: ApexOptions = {
    chart: {
      type: "area",
      sparkline: { enabled: true },
      animations: { enabled: true, dynamicAnimation: { enabled: true, speed: 300 } },
    },
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.35, opacityTo: 0.02 },
    },
    colors: [color],
    tooltip: { enabled: false },
  };

  return (
    <Link
      href={href}
      className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
        </div>
        {typeof trend === "number" ? (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
              trend > 0
                ? "bg-emerald-50 text-emerald-700"
                : trend < 0
                  ? "bg-rose-50 text-rose-700"
                  : "bg-slate-100 text-slate-600"
            }`}
          >
            {trendLabel(trend)}
          </span>
        ) : null}
      </div>
      <div className="mt-2 h-12">
        <ModernChart
          type="area"
          height={48}
          options={sparkOptions}
          series={[{ name: label, data: spark.length ? spark : [0, 0, 0, 0] }]}
        />
      </div>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </Link>
  );
}

function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function RatioCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-3">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
      <p className="text-[11px] text-slate-500">{hint}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    APPROVED: "bg-emerald-50 text-emerald-700",
    PENDING: "bg-amber-50 text-amber-700",
    DRAFT: "bg-slate-100 text-slate-600",
    REJECTED: "bg-rose-50 text-rose-700",
    NEW: "bg-sky-50 text-sky-700",
    READ: "bg-slate-100 text-slate-600",
    REPLIED: "bg-emerald-50 text-emerald-700",
  };
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        styles[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

function EmptyState({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <div className="px-4 py-10 text-center">
      <p className="text-sm text-slate-500">{text}</p>
      <Link href={href} className="mt-3 inline-flex text-sm font-semibold text-teal hover:text-teal-deep">
        {cta}
      </Link>
    </div>
  );
}

function compactRwf(value: number) {
  if (!value) return "RWF 0";
  if (value >= 1_000_000_000) return `RWF ${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `RWF ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `RWF ${(value / 1_000).toFixed(0)}K`;
  return formatPrice(value);
}

function trendLabel(change: number) {
  if (change > 0) return `+${change}%`;
  if (change < 0) return `${change}%`;
  return "0%";
}

function approvalRate(approved: number, total: number) {
  if (!total) return 0;
  return Math.round((approved / total) * 100);
}

function share(items: { name: string; value: number }[], key: string) {
  const total = items.reduce((sum, i) => sum + i.value, 0);
  if (!total) return 0;
  const found = items.find((i) => i.name === key)?.value ?? 0;
  return Math.round((found / total) * 100);
}
