"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, mediaUrl } from "@/lib/api";
import { PropertyMapPicker } from "@/components/map";
import { RwandaLocationFields } from "@/components/rwanda-location-fields";
import { parseCoordinate } from "@/lib/map";
import { normalizeProvinceCode } from "@/lib/rwanda-location";
import type { ListingType, Property, PropertyType } from "@/lib/types";

const MIN_IMAGES = 2;

type Props = {
  initial?: Property;
};

export function ListingForm({ initial }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    type: (initial?.type ?? "HOUSE") as PropertyType,
    listingType: (initial?.listingType ?? "SALE") as ListingType,
    price: initial?.price?.toString() ?? "",
    bedrooms: initial?.bedrooms?.toString() ?? "",
    bathrooms: initial?.bathrooms?.toString() ?? "",
    sizeSqm: initial?.sizeSqm?.toString() ?? "",
    province: (normalizeProvinceCode(initial?.province) || "Kigali") as string,
    district: initial?.district ?? "",
    sector: initial?.sector ?? "",
    cell: initial?.cell ?? "",
    village: initial?.village ?? "",
    address: initial?.address ?? "",
    lat: initial?.lat?.toString() ?? "",
    lng: initial?.lng?.toString() ?? "",
  });

  const existingCount = initial?.images?.length ?? 0;
  const totalImages = existingCount + files.length;
  const filePreviews = useMemo(
    () => files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
    [files]
  );

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (totalImages < MIN_IMAGES) {
      setError(`Add at least ${MIN_IMAGES} photos (you have ${totalImages}).`);
      setLoading(false);
      return;
    }

    try {
      const payload = {
        title: form.title,
        description: form.description,
        type: form.type,
        listingType: form.listingType,
        price: Number(form.price),
        bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        sizeSqm: form.sizeSqm ? Number(form.sizeSqm) : null,
        province: form.province,
        district: form.district,
        sector: form.sector || null,
        cell: form.cell || null,
        village: form.village || null,
        address: form.address || null,
        lat: parseCoordinate(form.lat),
        lng: parseCoordinate(form.lng),
      };

      const result = initial
        ? await api<{ data: Property }>(`/properties/${initial.id}`, {
            method: "PATCH",
            json: payload,
          })
        : await api<{ data: Property }>("/properties", {
            method: "POST",
            json: payload,
          });

      const propertyId = result.data.id;

      if (files.length) {
        const body = new FormData();
        files.forEach((file) => body.append("images", file));
        await api(`/properties/${propertyId}/images`, {
          method: "POST",
          body,
        });
      }

      router.push("/dashboard/listings");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save listing");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
      <label className="block text-sm">
        Title
        <input
          className="input mt-1"
          required
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Description
        <textarea
          className="input mt-1 min-h-32"
          required
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          Type
          <select
            className="input mt-1"
            value={form.type}
            onChange={(e) => update("type", e.target.value as PropertyType)}
          >
            <option value="HOUSE">House</option>
            <option value="APARTMENT">Apartment</option>
            <option value="LAND">Land</option>
            <option value="COMMERCIAL">Commercial</option>
          </select>
        </label>
        <label className="block text-sm">
          Listing
          <select
            className="input mt-1"
            value={form.listingType}
            onChange={(e) => update("listingType", e.target.value as ListingType)}
          >
            <option value="SALE">For sale</option>
            <option value="RENT">For rent</option>
          </select>
        </label>
      </div>
      <label className="block text-sm">
        Price (RWF)
        <input
          className="input mt-1"
          type="number"
          required
          min={1}
          value={form.price}
          onChange={(e) => update("price", e.target.value)}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm">
          Bedrooms
          <input
            className="input mt-1"
            type="number"
            min={0}
            value={form.bedrooms}
            onChange={(e) => update("bedrooms", e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Bathrooms
          <input
            className="input mt-1"
            type="number"
            min={0}
            value={form.bathrooms}
            onChange={(e) => update("bathrooms", e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Size (m²)
          <input
            className="input mt-1"
            type="number"
            min={0}
            value={form.sizeSqm}
            onChange={(e) => update("sizeSqm", e.target.value)}
          />
        </label>
      </div>

      <RwandaLocationFields
        value={{
          province: form.province,
          district: form.district,
          sector: form.sector,
          cell: form.cell,
          village: form.village,
        }}
        onChange={(next) =>
          setForm((prev) => ({
            ...prev,
            province: next.province,
            district: next.district,
            sector: next.sector,
            cell: next.cell,
            village: next.village,
          }))
        }
      />

      <label className="block text-sm">
        Street / landmark
        <input
          className="input mt-1"
          value={form.address}
          onChange={(e) => update("address", e.target.value)}
        />
      </label>

      <div>
        <p className="text-sm font-medium text-ink">Map pin</p>
        <p className="mt-1 text-xs text-ink/55">
          Drop a pin so buyers can find this listing on map search.
        </p>
        <div className="mt-3 space-y-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              Latitude
              <input
                className="input mt-1"
                type="number"
                step="any"
                placeholder="-1.9441"
                value={form.lat}
                onChange={(e) => update("lat", e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Longitude
              <input
                className="input mt-1"
                type="number"
                step="any"
                placeholder="30.0619"
                value={form.lng}
                onChange={(e) => update("lng", e.target.value)}
              />
            </label>
          </div>
          <div className="mt-3">
            <PropertyMapPicker
              lat={parseCoordinate(form.lat)}
              lng={parseCoordinate(form.lng)}
              onChange={({ lat, lng }) =>
                setForm((prev) => ({
                  ...prev,
                  lat: String(lat),
                  lng: String(lng),
                }))
              }
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-teal/20 bg-teal/5 p-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-[#0b1c2c]">Photos</p>
            <p className="mt-1 text-xs text-ink/60">
              At least {MIN_IMAGES} photos are required. You currently have{" "}
              <span className="font-semibold text-teal">{totalImages}</span>.
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center rounded-xl bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            Add photos
            <input
              className="sr-only"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const next = Array.from(e.target.files ?? []);
                setFiles((prev) => [...prev, ...next].slice(0, 8));
                e.target.value = "";
              }}
            />
          </label>
        </div>

        {existingCount > 0 ? (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/45">
              Current photos ({existingCount})
            </p>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {initial!.images.map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.id}
                  src={mediaUrl(img.url)}
                  alt=""
                  className="h-20 w-28 shrink-0 rounded-xl object-cover"
                />
              ))}
            </div>
          </div>
        ) : null}

        {filePreviews.length > 0 ? (
          <div className="mt-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/45">
                New uploads ({files.length})
              </p>
              <button
                type="button"
                className="text-xs font-semibold text-orange hover:underline"
                onClick={() => setFiles([])}
              >
                Clear new
              </button>
            </div>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {filePreviews.map((preview, index) => (
                <div key={`${preview.name}-${index}`} className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview.url}
                    alt=""
                    className="h-20 w-28 rounded-xl object-cover"
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                    onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                    aria-label="Remove photo"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {totalImages < MIN_IMAGES ? (
          <p className="mt-3 text-sm font-medium text-orange">
            Add {MIN_IMAGES - totalImages} more photo
            {MIN_IMAGES - totalImages === 1 ? "" : "s"} to continue.
          </p>
        ) : null}
      </div>

      {error ? <p className="text-sm text-clay">{error}</p> : null}
      <button
        type="submit"
        className="btn btn-primary"
        disabled={loading || totalImages < MIN_IMAGES}
      >
        {loading ? "Saving…" : initial ? "Update listing" : "Create listing"}
      </button>
    </form>
  );
}
