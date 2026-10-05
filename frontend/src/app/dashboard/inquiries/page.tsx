"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, formatPrice } from "@/lib/api";
import {
  DataTableEmpty,
  DataTablePagination,
  DataTableToolbar,
  SortableTh,
} from "@/components/data-table";
import { DashboardShell } from "@/components/dashboard-shell";
import { useAuth } from "@/lib/auth";
import { formatLocation } from "@/lib/location";
import { useDataTable } from "@/lib/use-data-table";
import type { Inquiry, InquiryStatus } from "@/lib/types";

export default function InquiriesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["inquiries"],
    queryFn: () => api<{ data: Inquiry[] }>("/inquiries"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: InquiryStatus }) =>
      api(`/inquiries/${id}/status`, { method: "PATCH", json: { status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inquiries"] }),
  });

  const isAgentSide = user?.role === "AGENT" || user?.role === "ADMIN";

  const filterDefs = useMemo(
    () => [
      {
        key: "status",
        match: (row: Inquiry, selected: string) => row.status === selected,
      },
    ],
    []
  );

  const table = useDataTable({
    rows: data?.data,
    searchKeys: [
      (i) => i.property.title,
      (i) => i.property.district,
      (i) => i.property.province,
      (i) => i.message,
      (i) => i.buyer.name,
      (i) => i.buyer.email,
      (i) => i.agent.name,
      (i) => i.status,
    ],
    sortAccessors: {
      property: (i) => i.property.title,
      contact: (i) => (isAgentSide ? i.buyer.name : i.agent.name),
      status: (i) => i.status,
      createdAt: (i) => new Date(i.createdAt),
      price: (i) => i.property.price ?? 0,
    },
    defaultSortKey: "createdAt",
    filterDefs,
    initialFilters: { status: "" },
  });

  return (
    <DashboardShell
      title="Inquiries"
      subtitle={
        isAgentSide
          ? "Leads from buyers and renters interested in your listings."
          : "Messages you have sent to agents."
      }
    >
      {isLoading ? <p className="text-sm text-slate-500">Loading inquiries…</p> : null}
      {error ? <p className="text-sm text-rose-600">Could not load inquiries.</p> : null}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {!isLoading && !data?.data.length ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-semibold text-slate-800">No inquiries yet</p>
            <p className="mt-1 text-sm text-slate-500">
              {isAgentSide
                ? "When buyers contact your listings, they will appear here."
                : "Contact an agent from a property page to start a conversation."}
            </p>
          </div>
        ) : (
          <>
            <DataTableToolbar
              search={table.search}
              onSearch={table.setSearch}
              searchPlaceholder="Search property, contact, message…"
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
                  options: [
                    { value: "", label: "All statuses" },
                    { value: "NEW", label: "New" },
                    { value: "READ", label: "Read" },
                    { value: "REPLIED", label: "Replied" },
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
                      sortKey="property"
                      activeKey={table.sortKey}
                      dir={table.sortDir}
                      onSort={table.toggleSort}
                    />
                    <SortableTh
                      label={isAgentSide ? "Buyer" : "Agent"}
                      sortKey="contact"
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
                    <SortableTh
                      label="Date"
                      sortKey="createdAt"
                      activeKey={table.sortKey}
                      dir={table.sortDir}
                      onSort={table.toggleSort}
                    />
                    {isAgentSide ? (
                      <th className="px-4 py-3 font-semibold uppercase tracking-wide text-slate-500">
                        Update
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {table.rows.map((inquiry) => {
                    const contact = isAgentSide ? inquiry.buyer : inquiry.agent;
                    return (
                      <tr key={inquiry.id} className="align-top">
                        <td className="px-4 py-3">
                          <p className="max-w-[240px] truncate font-semibold text-slate-900">
                            {inquiry.property.title}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {formatLocation(inquiry.property, { compact: true })}
                            {inquiry.property.price != null
                              ? ` · ${formatPrice(inquiry.property.price, inquiry.property.currency ?? "RWF")}`
                              : ""}
                          </p>
                          <p className="mt-1 max-w-md line-clamp-2 text-xs text-slate-600">
                            {inquiry.message}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <p className="font-medium">{contact.name}</p>
                          <p className="text-xs text-slate-500">{contact.email}</p>
                          {contact.phone ? (
                            <p className="text-xs text-slate-500">{contact.phone}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                            {inquiry.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                          {new Date(inquiry.createdAt).toLocaleDateString()}
                        </td>
                        {isAgentSide ? (
                          <td className="px-4 py-3">
                            <select
                              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs"
                              value={inquiry.status}
                              disabled={
                                statusMutation.isPending &&
                                statusMutation.variables?.id === inquiry.id
                              }
                              onChange={(e) =>
                                statusMutation.mutate({
                                  id: inquiry.id,
                                  status: e.target.value as InquiryStatus,
                                })
                              }
                            >
                              <option value="NEW">NEW</option>
                              <option value="READ">READ</option>
                              <option value="REPLIED">REPLIED</option>
                            </select>
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!table.rows.length ? (
                <DataTableEmpty message="No inquiries match your search or filters." />
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
