"use client";

import { useMemo, useState } from "react";

export type SortDir = "asc" | "desc";

export type Accessor<T> = (row: T) => string | number | null | undefined | Date;

export type FilterDef<T> = {
  key: string;
  match: (row: T, selected: string) => boolean;
};

type UseDataTableOptions<T> = {
  rows: T[] | undefined;
  searchKeys: Accessor<T>[];
  sortAccessors: Record<string, Accessor<T>>;
  defaultSortKey: string;
  defaultSortDir?: SortDir;
  filterDefs?: FilterDef<T>[];
  initialFilters?: Record<string, string>;
  initialPageSize?: number;
};

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;

  if (a instanceof Date || b instanceof Date) {
    const av = a instanceof Date ? a.getTime() : new Date(String(a)).getTime();
    const bv = b instanceof Date ? b.getTime() : new Date(String(b)).getTime();
    return av - bv;
  }

  if (typeof a === "number" && typeof b === "number") return a - b;

  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function useDataTable<T>({
  rows,
  searchKeys,
  sortAccessors,
  defaultSortKey,
  defaultSortDir = "desc",
  filterDefs = [],
  initialFilters = {},
  initialPageSize = 10,
}: UseDataTableOptions<T>) {
  const [search, setSearchState] = useState("");
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [sortDir, setSortDir] = useState<SortDir>(defaultSortDir);
  const [filters, setFilters] = useState<Record<string, string>>(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const source = rows ?? [];

  const sorted = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = source.filter((row) => {
      for (const def of filterDefs) {
        const selected = filters[def.key] ?? "";
        if (selected && !def.match(row, selected)) return false;
      }
      if (!q) return true;
      return searchKeys.some((accessor) => {
        const value = accessor(row);
        if (value == null) return false;
        return String(value).toLowerCase().includes(q);
      });
    });

    const accessor = sortAccessors[sortKey];
    if (!accessor) return filtered;

    return [...filtered].sort((a, b) => {
      const result = compareValues(accessor(a), accessor(b));
      return sortDir === "asc" ? result : -result;
    });
  }, [source, search, filters, filterDefs, searchKeys, sortAccessors, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safePage, pageSize]);

  const setSearch = (value: string) => {
    setSearchState(value);
    setPage(1);
  };

  const setFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setPage(1);
  };

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  return {
    search,
    setSearch,
    sortKey,
    sortDir,
    toggleSort,
    filters,
    setFilter,
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    pageCount,
    total: source.length,
    filteredTotal: sorted.length,
    rows: pageRows,
  };
}
