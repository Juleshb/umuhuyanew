"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, mediaUrl } from "@/lib/api";
import { DashboardShell } from "@/components/dashboard-shell";
import { useAuth } from "@/lib/auth";
import type { AdBanner } from "@/lib/types";

const EMPTY_FORM = {
  kicker: "Ad",
  title: "",
  subtitle: "",
  ctaLabel: "Learn more",
  href: "",
  sortOrder: "0",
  isActive: true,
  startsAt: "",
  endsAt: "",
};

function toLocalInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AdminBannersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/login?next=/admin/banners");
    }
  }, [loading, user, router]);

  const bannersQuery = useQuery({
    queryKey: ["admin-banners"],
    enabled: user?.role === "ADMIN",
    queryFn: () => api<{ data: AdBanner[] }>("/admin/banners"),
  });

  const save = useMutation({
    mutationFn: async () => {
      const fields = {
        kicker: form.kicker,
        title: form.title,
        subtitle: form.subtitle,
        ctaLabel: form.ctaLabel,
        href: form.href,
        sortOrder: Number(form.sortOrder || 0),
        isActive: form.isActive,
        startsAt: form.startsAt,
        endsAt: form.endsAt,
      };

      if (editingId) {
        await api(`/admin/banners/${editingId}`, { method: "PATCH", json: fields });
        if (file) {
          const body = new FormData();
          body.append("image", file);
          await api(`/admin/banners/${editingId}/image`, { method: "POST", body });
        }
        return;
      }

      if (!file) throw new Error("Add a banner image");
      const body = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        body.append(key, String(value));
      });
      body.append("image", file);
      await api("/admin/banners", { method: "POST", body });
    },
    onSuccess: () => {
      setError(null);
      resetForm();
      void queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api(`/admin/banners/${id}`, { method: "PATCH", json: { isActive } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-banners"] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/admin/banners/${id}`, { method: "DELETE" }),
    onSuccess: (_, id) => {
      if (editingId === id) resetForm();
      void queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
    },
  });

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFile(null);
    setPreview(null);
  }

  function editBanner(banner: AdBanner) {
    setEditingId(banner.id);
    setForm({
      kicker: banner.kicker,
      title: banner.title,
      subtitle: banner.subtitle ?? "",
      ctaLabel: banner.ctaLabel,
      href: banner.href ?? "",
      sortOrder: String(banner.sortOrder),
      isActive: banner.isActive,
      startsAt: toLocalInput(banner.startsAt),
      endsAt: toLocalInput(banner.endsAt),
    });
    setFile(null);
    setPreview(mediaUrl(banner.imageUrl));
    setError(null);
  }

  function onFile(next: File | null) {
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : null);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    save.mutate();
  }

  if (loading || !user || user.role !== "ADMIN") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f6f7f9] text-sm text-slate-500">
        Loading banners…
      </div>
    );
  }

  const banners = bannersQuery.data?.data ?? [];

  return (
    <DashboardShell
      title="Advertising banners"
      subtitle="These appear at the top of Home in the mobile app"
    >
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            {editingId ? "Edit banner" : "Add banner"}
          </h2>
        </div>
        <form onSubmit={onSubmit} className="grid gap-4 p-4 lg:grid-cols-[220px_1fr]">
          <label className="block text-sm">
            Image
            <input
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              required={!editingId}
            />
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Banner preview"
                className="mt-2 h-28 w-full rounded-lg object-cover bg-slate-100"
              />
            ) : (
              <div className="mt-2 flex h-28 items-center justify-center rounded-lg bg-slate-50 text-xs text-slate-400">
                1200 × 600 recommended
              </div>
            )}
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              Label
              <input
                className="input mt-1"
                value={form.kicker}
                onChange={(e) => setForm((prev) => ({ ...prev, kicker: e.target.value }))}
                placeholder="Ad"
              />
            </label>
            <label className="block text-sm">
              Order
              <input
                className="input mt-1"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              Title
              <input
                className="input mt-1"
                required
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Homes for rent in Kigali"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              Subtitle
              <input
                className="input mt-1"
                value={form.subtitle}
                onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Trusted agents across Rwanda"
              />
            </label>
            <label className="block text-sm">
              Button text
              <input
                className="input mt-1"
                value={form.ctaLabel}
                onChange={(e) => setForm((prev) => ({ ...prev, ctaLabel: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              Link
              <input
                className="input mt-1"
                value={form.href}
                onChange={(e) => setForm((prev) => ({ ...prev, href: e.target.value }))}
                placeholder="/explore or https://…"
              />
            </label>
            <label className="block text-sm">
              Starts
              <input
                className="input mt-1"
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm((prev) => ({ ...prev, startsAt: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              Ends
              <input
                className="input mt-1"
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => setForm((prev) => ({ ...prev, endsAt: e.target.value }))}
              />
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
              Show on Home
            </label>
            {error ? <p className="text-sm font-medium text-orange sm:col-span-2">{error}</p> : null}
            <div className="flex gap-2 sm:col-span-2">
              <button type="submit" className="btn btn-primary" disabled={save.isPending}>
                {save.isPending ? "Saving…" : editingId ? "Update banner" : "Publish banner"}
              </button>
              {editingId ? (
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
              ) : null}
            </div>
          </div>
        </form>
      </section>

      <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Live and scheduled</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {banners.map((banner) => (
            <div key={banner.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(banner.imageUrl)}
                alt={banner.title}
                className="h-20 w-full rounded-lg object-cover sm:w-36"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {banner.kicker} · order {banner.sortOrder}
                </p>
                <p className="truncate font-medium text-slate-900">{banner.title}</p>
                <p className="truncate text-sm text-slate-500">
                  {banner.subtitle || banner.href || "No link"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    banner.isActive ? "bg-teal/10 text-teal-deep" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {banner.isActive ? "Live" : "Hidden"}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary h-8 px-3 text-xs"
                  onClick={() => editBanner(banner)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-secondary h-8 px-3 text-xs"
                  onClick={() =>
                    toggle.mutate({ id: banner.id, isActive: !banner.isActive })
                  }
                >
                  {banner.isActive ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  className="h-8 rounded-lg px-3 text-xs font-semibold text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (confirm("Delete this banner?")) remove.mutate(banner.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {!banners.length ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">
              No banners yet. Publish one above to show it on Home.
            </p>
          ) : null}
        </div>
      </section>
    </DashboardShell>
  );
}
