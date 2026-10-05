"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { ListingForm } from "@/components/listing-form";

export default function NewListingPage() {
  return (
    <DashboardShell
      title="New listing"
      subtitle="Add property details and at least 2 photos, then submit for approval."
    >
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_8px_24px_rgba(20,32,34,0.04)] sm:p-8">
        <ListingForm />
      </div>
    </DashboardShell>
  );
}
