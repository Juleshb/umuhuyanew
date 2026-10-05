"use client";

import type { ReactNode } from "react";
import type { SortDir } from "@/lib/use-data-table";

export type ToolbarFilter = {
  key: string;
  label?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
};

export function DataTableToolbar({
  search,
  onSearch,
  searchPlaceholder = "Search…",
  filters = [],
  filteredTotal,
  total,
  pageSize,
  onPageSizeChange,
  trailing,
}: {
  search: string;
  onSearch: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ToolbarFilter[];
  filteredTotal: number;
  total: number;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <label className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <span className="sr-only">Search</span>
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
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
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-800 outline-none ring-teal/30 placeholder:text-slate-400 focus:ring-2"
          />
        </label>

        {filters.map((filter) => (
          <select
            key={filter.key}
            aria-label={filter.label ?? filter.key}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
          >
            {filter.options.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs text-slate-500">
          {filteredTotal === total
            ? `${total} row${total === 1 ? "" : "s"}`
            : `${filteredTotal} of ${total}`}
        </p>
        <label className="flex items-center gap-1.5 text-xs text-slate-500">
          Show
          <select
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {[5, 10, 25, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        {trailing}
      </div>
    </div>
  );
}

export function SortableTh({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  align = "left",
  className = "",
}: {
  label: string;
  sortKey: string;
  activeKey: string;
  dir: SortDir;
  onSort: (key: string) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const active = activeKey === sortKey;
  return (
    <th
      className={`px-4 py-3 font-semibold ${align === "right" ? "text-right" : "text-left"} ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 uppercase tracking-wide transition hover:text-slate-800 ${
          active ? "text-slate-800" : "text-slate-500"
        } ${align === "right" ? "flex-row-reverse" : ""}`}
      >
        {label}
        <span className="inline-flex w-3 justify-center text-[10px]" aria-hidden>
          {active ? (dir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </th>
  );
}

export function DataTablePagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
      <p className="text-xs text-slate-500">
        Page {page} of {pageCount}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-8 items-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-8 items-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function DataTableEmpty({ message }: { message: string }) {
  return (
    <p className="px-4 py-10 text-center text-sm text-slate-500">{message}</p>
  );
}
