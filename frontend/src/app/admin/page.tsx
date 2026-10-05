"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, formatPrice } from "@/lib/api";
import {
  DataTableEmpty,
  DataTablePagination,
  DataTableToolbar,
  SortableTh,
} from "@/components/data-table";
import { DashboardShell } from "@/components/dashboard-shell";
import { PropertyStatusSelect } from "@/components/property-status-select";
import { useAuth } from "@/lib/auth";
import { formatLocation } from "@/lib/location";
import { useDataTable } from "@/lib/use-data-table";
import type { Property, PropertyStatus, Role, User } from "@/lib/types";

type AdminUser = User & { _count?: { properties: number } };

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "DRAFT", label: "Draft" },
  { value: "SOLD", label: "Sold" },
  { value: "RENTED", label: "Rented" },
];

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/login?next=/admin");
    }
  }, [loading, user, router]);

  const propertiesQuery = useQuery({
    queryKey: ["admin-properties"],
    enabled: user?.role === "ADMIN",
    queryFn: () => api<{ data: Property[] }>("/admin/properties"),
  });

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    enabled: user?.role === "ADMIN",
    queryFn: () => api<{ data: AdminUser[] }>("/admin/users"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PropertyStatus }) =>
      api(`/admin/properties/${id}/status`, { method: "PATCH", json: { status } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      api(`/admin/users/${id}/role`, { method: "PATCH", json: { role } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const propertyFilters = useMemo(
    () => [
      {
        key: "status",
        match: (row: Property, selected: string) => row.status === selected,
      },
    ],
    []
  );

  const propertiesTable = useDataTable({
    rows: propertiesQuery.data?.data,
    searchKeys: [
      (p) => p.title,
      (p) => p.district,
      (p) => p.province,
      (p) => p.sector,
      (p) => p.cell,
      (p) => p.village,
      (p) => p.agent.name,
      (p) => p.status,
    ],
    sortAccessors: {
      title: (p) => p.title,
      agent: (p) => p.agent.name,
      price: (p) => p.price,
      status: (p) => p.status,
      updatedAt: (p) => new Date(p.updatedAt),
    },
    defaultSortKey: "updatedAt",
    filterDefs: propertyFilters,
    initialFilters: { status: "PENDING" },
  });

  const userFilters = useMemo(
    () => [
      {
        key: "role",
        match: (row: AdminUser, selected: string) => row.role === selected,
      },
    ],
    []
  );

  const usersTable = useDataTable({
    rows: usersQuery.data?.data,
    searchKeys: [(u) => u.name, (u) => u.email, (u) => u.phone, (u) => u.role],
    sortAccessors: {
      name: (u) => u.name,
      email: (u) => u.email,
      role: (u) => u.role,
      createdAt: (u) => new Date(u.createdAt),
    },
    defaultSortKey: "name",
    defaultSortDir: "asc",
    filterDefs: userFilters,
    initialFilters: { role: "" },
  });

  if (loading || !user || user.role !== "ADMIN") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f6f7f9] text-sm text-slate-500">
        Loading moderation…
      </div>
    );
  }

  return (
    <DashboardShell title="Moderation" subtitle="Approve listings and manage access roles">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Listings queue</h2>
        </div>

        <DataTableToolbar
          search={propertiesTable.search}
          onSearch={propertiesTable.setSearch}
          searchPlaceholder="Search property, agent, location…"
          filteredTotal={propertiesTable.filteredTotal}
          total={propertiesTable.total}
          pageSize={propertiesTable.pageSize}
          onPageSizeChange={propertiesTable.setPageSize}
          filters={[
            {
              key: "status",
              label: "Status",
              value: propertiesTable.filters.status ?? "",
              onChange: (v) => propertiesTable.setFilter("status", v),
              options: STATUS_OPTIONS,
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
                  activeKey={propertiesTable.sortKey}
                  dir={propertiesTable.sortDir}
                  onSort={propertiesTable.toggleSort}
                />
                <SortableTh
                  label="Agent"
                  sortKey="agent"
                  activeKey={propertiesTable.sortKey}
                  dir={propertiesTable.sortDir}
                  onSort={propertiesTable.toggleSort}
                />
                <SortableTh
                  label="Price"
                  sortKey="price"
                  activeKey={propertiesTable.sortKey}
                  dir={propertiesTable.sortDir}
                  onSort={propertiesTable.toggleSort}
                />
                <SortableTh
                  label="Status"
                  sortKey="status"
                  activeKey={propertiesTable.sortKey}
                  dir={propertiesTable.sortDir}
                  onSort={propertiesTable.toggleSort}
                />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {propertiesTable.rows.map((property) => (
                <tr key={property.id}>
                  <td className="px-4 py-3">
                    <p className="max-w-[260px] truncate font-medium text-slate-900">
                      {property.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatLocation(property, { compact: true })}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{property.agent.name}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatPrice(property.price, property.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <PropertyStatusSelect
                      value={property.status}
                      role="ADMIN"
                      disabled={
                        statusMutation.isPending &&
                        statusMutation.variables?.id === property.id
                      }
                      onChange={(status) =>
                        statusMutation.mutate({ id: property.id, status })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!propertiesTable.rows.length ? (
            <DataTableEmpty message="No listings match your search or filters." />
          ) : null}
        </div>

        <DataTablePagination
          page={propertiesTable.page}
          pageCount={propertiesTable.pageCount}
          onPageChange={propertiesTable.setPage}
        />
      </section>

      <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Users</h2>
        </div>

        <DataTableToolbar
          search={usersTable.search}
          onSearch={usersTable.setSearch}
          searchPlaceholder="Search name, email, role…"
          filteredTotal={usersTable.filteredTotal}
          total={usersTable.total}
          pageSize={usersTable.pageSize}
          onPageSizeChange={usersTable.setPageSize}
          filters={[
            {
              key: "role",
              label: "Role",
              value: usersTable.filters.role ?? "",
              onChange: (v) => usersTable.setFilter("role", v),
              options: [
                { value: "", label: "All roles" },
                { value: "BUYER", label: "Buyer" },
                { value: "AGENT", label: "Agent" },
                { value: "ADMIN", label: "Admin" },
              ],
            },
          ]}
        />

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold tracking-wide">
              <tr>
                <SortableTh
                  label="Name"
                  sortKey="name"
                  activeKey={usersTable.sortKey}
                  dir={usersTable.sortDir}
                  onSort={usersTable.toggleSort}
                />
                <SortableTh
                  label="Email"
                  sortKey="email"
                  activeKey={usersTable.sortKey}
                  dir={usersTable.sortDir}
                  onSort={usersTable.toggleSort}
                />
                <SortableTh
                  label="Role"
                  sortKey="role"
                  activeKey={usersTable.sortKey}
                  dir={usersTable.sortDir}
                  onSort={usersTable.toggleSort}
                />
                <th className="px-4 py-3 font-semibold uppercase tracking-wide text-slate-500">
                  Change
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usersTable.rows.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3 text-slate-600">{u.role}</td>
                  <td className="px-4 py-3">
                    <select
                      className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs"
                      value={u.role}
                      onChange={(e) =>
                        roleMutation.mutate({ id: u.id, role: e.target.value as Role })
                      }
                    >
                      <option value="BUYER">BUYER</option>
                      <option value="AGENT">AGENT</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!usersTable.rows.length ? (
            <DataTableEmpty message="No users match your search or filters." />
          ) : null}
        </div>

        <DataTablePagination
          page={usersTable.page}
          pageCount={usersTable.pageCount}
          onPageChange={usersTable.setPage}
        />
      </section>
    </DashboardShell>
  );
}
