"use client";

import type { PropertyStatus, Role } from "@/lib/types";

const ALL_STATUSES: PropertyStatus[] = [
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "SOLD",
  "RENTED",
];

const LABELS: Record<PropertyStatus, string> = {
  DRAFT: "Draft",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SOLD: "Sold",
  RENTED: "Rented",
};

const TONE: Record<PropertyStatus, string> = {
  DRAFT: "border-slate-200 bg-slate-50 text-slate-700",
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
  SOLD: "border-violet-200 bg-violet-50 text-violet-800",
  RENTED: "border-sky-200 bg-sky-50 text-sky-800",
};

export function agentStatusOptions(current: PropertyStatus): PropertyStatus[] {
  const options = new Set<PropertyStatus>([current, "DRAFT"]);
  if (current === "DRAFT" || current === "REJECTED") options.add("PENDING");
  if (current === "APPROVED" || current === "SOLD" || current === "RENTED") {
    options.add("APPROVED");
    options.add("SOLD");
    options.add("RENTED");
  }
  return ALL_STATUSES.filter((s) => options.has(s));
}

export function PropertyStatusSelect({
  value,
  role,
  disabled,
  onChange,
}: {
  value: PropertyStatus;
  role: Role;
  disabled?: boolean;
  onChange: (status: PropertyStatus) => void;
}) {
  const options =
    role === "ADMIN" ? ALL_STATUSES : agentStatusOptions(value);

  return (
    <select
      className={`h-8 rounded-lg border px-2 text-xs font-semibold uppercase tracking-wide ${TONE[value]} disabled:opacity-60`}
      value={value}
      disabled={disabled}
      aria-label="Property status"
      onChange={(e) => onChange(e.target.value as PropertyStatus)}
    >
      {options.map((status) => (
        <option key={status} value={status}>
          {LABELS[status]}
        </option>
      ))}
    </select>
  );
}
