"use client";

import Link from "next/link";
import { formatPrice, mediaUrl } from "@/lib/api";
import { formatLocation } from "@/lib/location";
import type { Property } from "@/lib/types";

type Props = {
  property: Property;
  pinned?: boolean;
  onClose?: () => void;
  className?: string;
};

function statusLabel(status: Property["status"]) {
  if (status === "SOLD") return "Sold";
  if (status === "RENTED") return "Rented";
  if (status === "APPROVED") return "Available";
  return status;
}

export function MapPropertyPreview({
  property,
  pinned = false,
  onClose,
  className = "",
}: Props) {
  const image = property.images.find((img) => img.isPrimary) ?? property.images[0];
  const closed = property.status === "SOLD" || property.status === "RENTED";
  const description =
    property.description?.trim().length > 140
      ? `${property.description.trim().slice(0, 140).trim()}…`
      : property.description?.trim();

  return (
    <article
      className={`overflow-hidden rounded-3xl border border-white/20 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.28)] ${className}`}
    >
      <div className="relative h-44 bg-slate-100 sm:h-48">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(image.url)}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            No photo
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent p-3 pt-10">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-teal px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              {property.listingType === "RENT" ? "For rent" : "For sale"}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white ${
                closed ? "bg-orange" : "bg-black/45"
              }`}
            >
              {statusLabel(property.status)}
            </span>
            <span className="rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              {property.type}
            </span>
          </div>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-2.5 top-2.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-lg leading-none text-white hover:bg-black/70"
            aria-label="Close preview"
          >
            ×
          </button>
        ) : null}
        {pinned ? (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-teal shadow-sm">
            Selected
          </span>
        ) : (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 shadow-sm">
            Preview
          </span>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="font-display text-lg leading-snug text-[#0b1c2c]">
            {property.title}
          </h3>
          <p
            className={`mt-1 text-base font-bold ${closed ? "text-ink/45 line-through" : "text-teal"}`}
          >
            {formatPrice(property.price, property.currency)}
            {property.listingType === "RENT" ? (
              <span className="text-sm font-medium text-ink/45"> / mo</span>
            ) : null}
          </p>
          <p className="mt-1 text-sm text-ink/60">
            {formatLocation(property)}
            {property.address ? ` · ${property.address}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs font-semibold text-ink/70">
          {property.bedrooms != null ? <span>{property.bedrooms} beds</span> : null}
          {property.bathrooms != null ? <span>{property.bathrooms} baths</span> : null}
          {property.sizeSqm != null ? <span>{property.sizeSqm} m²</span> : null}
        </div>

        {description ? (
          <p className="text-sm leading-relaxed text-ink/65">{description}</p>
        ) : null}

        {property.agent ? (
          <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal">
              Agent
            </p>
            <p className="mt-0.5 text-sm font-semibold text-[#0b1c2c]">
              {property.agent.name}
            </p>
            {property.agent.phone ? (
              <p className="text-xs text-ink/55">{property.agent.phone}</p>
            ) : null}
          </div>
        ) : null}

        <div className="flex gap-2">
          <Link
            href={`/properties/${property.id}`}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-teal text-sm font-semibold text-white hover:bg-teal-deep"
          >
            View full listing
          </Link>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
