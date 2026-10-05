"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, api, formatPrice, mediaUrl } from "@/lib/api";
import {
  DataTableEmpty,
  DataTablePagination,
  DataTableToolbar,
  SortableTh,
} from "@/components/data-table";
import { DashboardShell } from "@/components/dashboard-shell";
import { PaymentCheckout } from "@/components/payment-checkout";
import { PropertyStatusSelect } from "@/components/property-status-select";
import { useAuth } from "@/lib/auth";
import { formatLocation } from "@/lib/location";
import { useDataTable } from "@/lib/use-data-table";
import type { Property, PropertyStatus } from "@/lib/types";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "SOLD", label: "Sold" },
  { value: "RENTED", label: "Rented" },
];

export default function ListingsPage() {
  const { user, refresh } = useAuth();
  const queryClient = useQueryClient();
  const [feePropertyId, setFeePropertyId] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["agent-properties"],
    queryFn: () => api<{ data: Property[] }>("/agent/properties"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PropertyStatus }) =>
      api(`/properties/${id}/status`, { method: "PATCH", json: { status } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["agent-properties"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setFeePropertyId(null);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === "LISTING_FEE_REQUIRED" && err.propertyId) {
        setFeePropertyId(err.propertyId);
      }
    },
  });

  const needsAgentActivation = user?.role === "AGENT" && !user.agentActive;
  const showListingFee = Boolean(feePropertyId) || user?.role === "BUYER";

  const filterDefs = useMemo(
    () => [
      {
        key: "status",
        match: (row: Property, selected: string) => row.status === selected,
      },
      {
        key: "listingType",
        match: (row: Property, selected: string) => row.listingType === selected,
      },
    ],
    []
  );

  const table = useDataTable({
    rows: data?.data,
    searchKeys: [
      (p) => p.title,
      (p) => p.district,
      (p) => p.province,
      (p) => p.sector,
      (p) => p.cell,
      (p) => p.village,
      (p) => p.status,
      (p) => p.type,
      (p) => p.listingType,
    ],
    sortAccessors: {
      title: (p) => p.title,
      location: (p) => formatLocation(p),
      price: (p) => p.price,
      status: (p) => p.status,
      updatedAt: (p) => new Date(p.updatedAt),
    },
    defaultSortKey: "updatedAt",
    defaultSortDir: "desc",
    filterDefs,
    initialFilters: { status: "", listingType: "" },
  });

  return (
    <DashboardShell
      title="Listings"
      subtitle="Draft, submit, and track publication status"
      actions={
        <Link
          href="/dashboard/listings/new"
          className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          New listing
        </Link>
      }
    >
      {needsAgentActivation ? (
        <div className="mb-6">
          <PaymentCheckout
            kind="AGENT_SUBSCRIPTION"
            amount={15000}
            title="Activate agent account"
            description="Pay 15,000 RWF per month to activate your agent account and manage listings."
            onPaid={() => {
              void refresh();
              void queryClient.invalidateQueries({ queryKey: ["agent-properties"] });
            }}
          />
        </div>
      ) : null}

      {showListingFee && user?.role === "BUYER" ? (
        <div className="mb-6 rounded-2xl border border-orange/20 bg-orange/5 px-4 py-3 text-sm text-ink/70">
          Private sellers pay <span className="font-semibold text-orange">1,000 RWF</span> per
          property. Each paid listing stays live for <span className="font-semibold">1 month</span>.
        </div>
      ) : null}

      {feePropertyId ? (
        <div className="mb-6">
          <PaymentCheckout
            kind="LISTING_FEE"
            propertyId={feePropertyId}
            amount={1000}
            title="Pay listing fee"
            description="1,000 RWF publishes this property for 1 month after approval."
            onPaid={() => {
              const id = feePropertyId;
              setFeePropertyId(null);
              void queryClient.invalidateQueries({ queryKey: ["agent-properties"] });
              if (id) statusMutation.mutate({ id, status: "PENDING" });
            }}
          />
        </div>
      ) : null}

      {isLoading ? <p className="text-sm text-slate-500">Loading listings…</p> : null}
      {error ? <p className="text-sm text-rose-600">Could not load listings.</p> : null}
      {statusMutation.isError ? (
        <p className="mb-3 text-sm text-rose-600">
          {(statusMutation.error as Error).message || "Could not update status."}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {!isLoading && !data?.data.length ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-slate-500">No listings yet.</p>
            <Link
              href="/dashboard/listings/new"
              className="mt-3 inline-flex text-sm font-semibold text-teal"
            >
              Create your first listing
            </Link>
          </div>
        ) : (
          <>
            <DataTableToolbar
              search={table.search}
              onSearch={table.setSearch}
              searchPlaceholder="Search title, location, status…"
              filteredTotal={table.filteredTotal}
              total={table.total}
              pageSize={table.pageSize}
              onPageSizeChange={table.setPageSize}
              filters={[
                {
                  key: "status",
                  label: "Status",
                  value: table.filters.status ?? "",
                  onChange: (v) => table.setFilter("status", v),
                  options: STATUS_OPTIONS,
                },
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
                      label="Status"
                      sortKey="status"
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
                  {table.rows.map((property) => {
                    const image = property.images[0];
                    return (
                      <tr key={property.id} className="align-middle">
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
                            <span className="max-w-[220px] truncate font-semibold text-slate-900">
                              {property.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatLocation(property, { compact: true })}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {formatPrice(property.price, property.currency)}
                        </td>
                        <td className="px-4 py-3">
                          <PropertyStatusSelect
                            value={property.status}
                            role={user?.role === "ADMIN" ? "ADMIN" : "AGENT"}
                            disabled={
                              statusMutation.isPending &&
                              statusMutation.variables?.id === property.id
                            }
                            onChange={(status) =>
                              statusMutation.mutate({ id: property.id, status })
                            }
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/dashboard/listings/${property.id}/edit`}
                            className="inline-flex h-8 items-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!table.rows.length ? (
                <DataTableEmpty message="No listings match your search or filters." />
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
