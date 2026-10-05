import type { ReactNode } from "react";
import Link from "next/link";
import { formatPrice, mediaUrl } from "@/lib/api";
import { formatLocation } from "@/lib/location";
import type { Property } from "@/lib/types";

type Props = {
  property: Property;
  popular?: boolean;
};

function MetaItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5" title={label}>
      {children}
    </span>
  );
}

function BedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 18h18M5 10V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BathIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 12h16v2a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-2Zm3-6V4m0 2h8a2 2 0 0 1 2 2v4H7V6Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 18v1M18 18v1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AreaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 5h6v6H5V5Zm8 8h6v6h-6v-6ZM9 15H5v4h4v-4Zm10-10h-4v4h4V5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-5H10v5H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LocationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function PropertyCard({ property, popular = false }: Props) {
  const image = property.images.find((img) => img.isPrimary) ?? property.images[0];
  const iconClass = "h-3.5 w-3.5 shrink-0 text-teal";

  return (
    <Link
      href={`/properties/${property.id}`}
      className="group block overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_10px_30px_rgba(20,32,34,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(20,32,34,0.1)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-mist">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(image.url)}
            alt={property.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink/40">No image</div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {property.status === "SOLD" || property.status === "RENTED" ? (
            <span className="rounded-md bg-slate-900/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              {property.status === "SOLD" ? "Sold" : "Rented"}
            </span>
          ) : popular ? (
            <span className="rounded-md bg-teal px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              Popular
            </span>
          ) : (
            <span className="rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-teal">
              {property.listingType === "RENT" ? "Rent" : "Sale"}
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        <p
          className={`text-lg font-bold ${
            property.status === "SOLD" || property.status === "RENTED"
              ? "text-ink/55 line-through decoration-ink/30"
              : "text-teal"
          }`}
        >
          {formatPrice(property.price, property.currency)}
          {property.listingType === "RENT" &&
          property.status !== "SOLD" &&
          property.status !== "RENTED" ? (
            <span className="text-sm font-medium text-ink/50"> / month</span>
          ) : null}
        </p>
        <h3 className="mt-1 line-clamp-1 text-base font-semibold text-ink">{property.title}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink/55">
          <LocationIcon className="h-3.5 w-3.5 shrink-0 text-ink/40" />
          <span className="line-clamp-1">
            {formatLocation(property, { compact: true })}
          </span>
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-black/5 pt-3 text-xs font-medium text-ink/65">
          {property.bedrooms != null ? (
            <MetaItem label={`${property.bedrooms} bedrooms`}>
              <BedIcon className={iconClass} />
              <span>
                {property.bedrooms} Bed{property.bedrooms === 1 ? "" : "s"}
              </span>
            </MetaItem>
          ) : null}
          {property.bathrooms != null ? (
            <MetaItem label={`${property.bathrooms} bathrooms`}>
              <BathIcon className={iconClass} />
              <span>
                {property.bathrooms} Bath{property.bathrooms === 1 ? "" : "s"}
              </span>
            </MetaItem>
          ) : null}
          {property.sizeSqm != null ? (
            <MetaItem label={`${property.sizeSqm} square meters`}>
              <AreaIcon className={iconClass} />
              <span>{property.sizeSqm} m²</span>
            </MetaItem>
          ) : null}
          <MetaItem label={property.type}>
            <HomeIcon className={iconClass} />
            <span className="capitalize">{property.type.toLowerCase()}</span>
          </MetaItem>
        </div>
      </div>
    </Link>
  );
}
