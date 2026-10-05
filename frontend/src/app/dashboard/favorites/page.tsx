"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, formatPrice, mediaUrl } from "@/lib/api";
import {
  DataTableEmpty,
  DataTablePagination,
  DataTableToolbar,
  SortableTh,
} from "@/components/data-table";
import { DashboardShell } from "@/components/dashboard-shell";
import { useDataTable } from "@/lib/use-data-table";
import { formatLocation } from "@/lib/location";
import type { Property } from "@/lib/types";

type FavoriteItem = {
  id: string;
  property: Property;
};

export default function FavoritesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => api<{ data: FavoriteItem[] }>("/favorites"),
  });

  const removeMutation = useMutation({
    mutationFn: (propertyId: string) =>
      api(`/favorites/${propertyId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favorites"] }),
  });

  const filterDefs = useMemo(
    () => [
      {
        key: "listingType",
        match: (row: FavoriteItem, selected: string) =>
          row.property.listingType === selected,
      },
      {
        key: "type",
        match: (row: FavoriteItem, selected: string) => row.property.type === selected,
      },
    ],
    []
  );

  const table = useDataTable({
    rows: data?.data,
    searchKeys: [
      (f) => f.property.title,
      (f) => f.property.district,
      (f) => f.property.province,
      (f) => f.property.sector,
      (f) => f.property.cell,
      (f) => f.property.village,
      (f) => f.property.type,
      (f) => f.property.listingType,
      (f) => f.property.agent.name,
    ],
    sortAccessors: {
      title: (f) => f.property.title,
      location: (f) => formatLocation(f.property),
      price: (f) => f.property.price,
      type: (f) => f.property.type,
    },
    defaultSortKey: "title",
    defaultSortDir: "asc",
    filterDefs,
    initialFilters: { listingType: "", type: "" },
  });

  return (
    <DashboardShell title="Favorites" subtitle="Properties you want to revisit.">
      {isLoading ? <p className="text-sm text-slate-500">Loading favorites…</p> : null}
      {error ? <p className="text-sm text-rose-600">Could not load favorites.</p> : null}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {!isLoading && !data?.data.length ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-semibold text-slate-800">No favorites yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Browse listings and save homes you like.
            </p>
            <Link
              href="/properties"
              className="mt-3 inline-flex text-sm font-semibold text-teal"
            >
              Browse properties
            </Link>
          </div>
        ) : (
          <>
            <DataTableToolbar
              search={table.search}
              onSearch={table.setSearch}
              searchPlaceholder="Search title, location, agent…"
              filteredTotal={table.filteredTotal}
              total={table.total}
              pageSize={table.pageSize}
              onPageSizeChange={table.setPageSize}
              filters={[
                {
                  key: "listingType",
                  label: "Listing type",
                  value: table.filters.listingType ?? "",
                  onChange: (v) => table.setFilter("listingType", v),
                  options: [
                    { value: "", label: "Sale & rent" },
                    { value: "SALE", label: "Sale" },
                    { value: "RENT", label: "Rent" },
                  ],
                },
                {
                  key: "type",
                  label: "Property type",
                  value: table.filters.type ?? "",
                  onChange: (v) => table.setFilter("type", v),
                  options: [
                    { value: "", label: "All types" },
                    { value: "HOUSE", label: "House" },
                    { value: "APARTMENT", label: "Apartment" },
                    { value: "LAND", label: "Land" },
                    { value: "COMMERCIAL", label: "Commercial" },
                  ],
                },
              ]}
            />

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold tracking-wide">
                  <tr>
                    <SortableTh
                      label="Property"
                      sortKey="title"
                      activeKey={table.sortKey}
                      dir={table.sortDir}
                      onSort={table.toggleSort}
                    />
                    <SortableTh
                      label="Location"
                      sortKey="location"
                      activeKey={table.sortKey}
                      dir={table.sortDir}
                      onSort={table.toggleSort}
                    />
                    <SortableTh
                      label="Price"
                      sortKey="price"
                      activeKey={table.sortKey}
                      dir={table.sortDir}
                      onSort={table.toggleSort}
                    />
                    <SortableTh
                      label="Type"
                      sortKey="type"
                      activeKey={table.sortKey}
                      dir={table.sortDir}
                      onSort={table.toggleSort}
                    />
                    <th className="px-4 py-3 text-right font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {table.rows.map((item) => {
                    const property = item.property;
                    const image = property.images[0];
                    return (
                      <tr key={item.id} className="align-middle">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                              {image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={mediaUrl(image.url)}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : null}
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/properties/${property.id}`}
                                className="block max-w-[220px] truncate font-semibold text-slate-900 hover:text-teal"
                              >
                                {property.title}
                              </Link>
                              <p className="text-xs text-slate-500">{property.agent.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatLocation(property, { compact: true })}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {formatPrice(property.price, property.currency)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {property.type} · {property.listingType}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            className="inline-flex h-8 items-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                            onClick={() => removeMutation.mutate(property.id)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!table.rows.length ? (
                <DataTableEmpty message="No favorites match your search or filters." />
              ) : null}
            </div>

            <DataTablePagination
              page={table.page}
              pageCount={table.pageCount}
              onPageChange={table.setPage}
            />
          </>
        )}
      </section>
    </DashboardShell>
  );
}
