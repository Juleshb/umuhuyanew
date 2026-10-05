"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/dashboard-shell";
import { ListingForm } from "@/components/listing-form";
import type { Property } from "@/lib/types";

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ["property", params.id],
    queryFn: () => api<{ data: Property }>(`/properties/${params.id}`),
  });

  return (
    <DashboardShell
      title="Edit listing"
      subtitle="Updates move approved listings back to draft for re-approval."
    >
      {isLoading ? <p className="text-ink/60">Loading listing…</p> : null}
      {error || (!isLoading && !data) ? (
        <p className="text-orange">Listing not found.</p>
      ) : null}
      {data ? (
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_8px_24px_rgba(20,32,34,0.04)] sm:p-8">
          <ListingForm initial={data.data} />
        </div>
      ) : null}
    </DashboardShell>
  );
}
