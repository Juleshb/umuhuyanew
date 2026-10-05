"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatPrice, mediaUrl } from "@/lib/api";
import { formatLocation } from "@/lib/location";
import { RWANDA_DEFAULT_ZOOM, hasCoordinates } from "@/lib/map";
import type { Property } from "@/lib/types";

type MarkerProperty = Pick<
  Property,
  | "id"
  | "title"
  | "description"
  | "price"
  | "currency"
  | "listingType"
  | "type"
  | "status"
  | "bedrooms"
  | "bathrooms"
  | "sizeSqm"
  | "province"
  | "district"
  | "sector"
  | "cell"
  | "village"
  | "address"
  | "lat"
  | "lng"
  | "images"
> & {
  agent?: Property["agent"] | null;
};

type Props = {
  properties: MarkerProperty[];
  selectedId?: string | null;
  hoveredId?: string | null;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  className?: string;
  heightClassName?: string;
  showPopup?: boolean;
  showPopupLinks?: boolean;
  fitToken?: number;
};

const tealIcon = L.divIcon({
  className: "umuhuza-map-pin",
  html: `<span style="display:block;width:16px;height:16px;border-radius:999px;background:#0f9ea8;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);pointer-events:none"></span>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const orangeIcon = L.divIcon({
  className: "umuhuza-map-pin",
  html: `<span style="display:block;width:20px;height:20px;border-radius:999px;background:#f26b1d;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);pointer-events:none"></span>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function pointsSignature(
  points: { id: string; lat: number; lng: number }[]
) {
  return points.map((p) => `${p.id}:${p.lat}:${p.lng}`).join("|");
}

function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const run = () => map.invalidateSize();
    run();
    const t = window.setTimeout(run, 120);
    window.addEventListener("resize", run);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", run);
    };
  }, [map]);
  return null;
}

function FitOrFocus({
  points,
  selectedId,
  fitToken = 0,
}: {
  points: { id: string; lat: number; lng: number }[];
  selectedId?: string | null;
  fitToken?: number;
}) {
  const map = useMap();
  const signature = pointsSignature(points);
  const lastFitRef = useRef<string>("");
  const lastSelectedRef = useRef<string | null>(null);

  // Fit all markers only when the set of points changes or Fit all is clicked —
  // never on hover / unrelated re-renders (that was resetting zoom).
  useEffect(() => {
    if (!points.length) return;
    const fitKey = `${signature}::${fitToken}`;
    if (lastFitRef.current === fitKey) return;
    lastFitRef.current = fitKey;

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 14, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds.pad(0.18), { animate: true });
  }, [map, points, signature, fitToken]);

  // Focus selected pin only when selection changes
  useEffect(() => {
    if (!selectedId || !points.length) {
      lastSelectedRef.current = selectedId ?? null;
      return;
    }
    if (lastSelectedRef.current === selectedId) return;
    lastSelectedRef.current = selectedId;

    const selected = points.find((p) => p.id === selectedId);
    if (!selected) return;
    map.setView([selected.lat, selected.lng], Math.max(map.getZoom(), 14), {
      animate: true,
    });
  }, [map, points, selectedId]);

  return null;
}

function HoverMarker({
  property,
  active,
  showPopup,
  showPopupLinks,
  onSelect,
  onHover,
}: {
  property: MarkerProperty;
  active: boolean;
  showPopup: boolean;
  showPopupLinks: boolean;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
}) {
  const image = property.images?.find((img) => img.isPrimary) ?? property.images?.[0];

  return (
    <Marker
      position={[Number(property.lat), Number(property.lng)]}
      icon={active ? orangeIcon : tealIcon}
      riseOnHover
      eventHandlers={{
        click: (e) => {
          L.DomEvent.stopPropagation(e.originalEvent);
          onSelect?.(property.id);
        },
        mouseover: () => onHover?.(property.id),
        mouseout: () => onHover?.(null),
      }}
    >
      {showPopup ? (
        <Popup className="umuhuza-map-popup" maxWidth={280} minWidth={240}>
          <div className="overflow-hidden rounded-xl">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl(image.url)}
                alt=""
                className="h-28 w-full object-cover"
              />
            ) : null}
            <div className="space-y-1.5 p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#0f9ea8]">
                {property.listingType === "RENT" ? "For rent" : "For sale"} · {property.type}
              </p>
              <p className="text-sm font-semibold leading-snug text-[#0b1c2c]">
                {property.title}
              </p>
              <p className="text-sm font-bold text-[#0f9ea8]">
                {formatPrice(property.price, property.currency)}
                {property.listingType === "RENT" ? " / mo" : ""}
              </p>
              <p className="text-xs text-slate-500">{formatLocation(property, { compact: true })}</p>
              <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                {property.bedrooms != null ? <span>{property.bedrooms} beds</span> : null}
                {property.bathrooms != null ? <span>{property.bathrooms} baths</span> : null}
                {property.sizeSqm != null ? <span>{property.sizeSqm} m²</span> : null}
              </div>
              {showPopupLinks ? (
                <a
                  href={`/properties/${property.id}`}
                  className="mt-1 inline-flex text-sm font-semibold text-[#0f9ea8]"
                >
                  View listing →
                </a>
              ) : null}
            </div>
          </div>
        </Popup>
      ) : null}
    </Marker>
  );
}

export function PropertyMap({
  properties,
  selectedId = null,
  hoveredId = null,
  onSelect,
  onHover,
  className = "",
  heightClassName = "h-80",
  showPopup = true,
  showPopupLinks = true,
  fitToken = 0,
}: Props) {
  const withCoords = useMemo(() => properties.filter(hasCoordinates), [properties]);
  const points = useMemo(
    () =>
      withCoords.map((p) => ({
        id: p.id,
        lat: Number(p.lat),
        lng: Number(p.lng),
      })),
    [withCoords]
  );

  if (!withCoords.length) {
    return (
      <div
        className={`flex ${heightClassName} items-center justify-center bg-gradient-to-br from-[#eef6f7] via-white to-[#fff4ec] px-6 text-center ${className}`}
      >
        <div>
          <p className="text-base font-semibold text-[#0b1c2c]">No pins to show</p>
          <p className="mt-1 text-sm text-ink/55">
            Try clearing filters or choose another district.
          </p>
        </div>
      </div>
    );
  }

  const center: [number, number] = [points[0].lat, points[0].lng];

  return (
    <div className={`relative z-0 ${className}`}>
      <div className={`relative z-0 ${heightClassName} w-full overflow-hidden`}>
        <MapContainer
          center={center}
          zoom={RWANDA_DEFAULT_ZOOM}
          scrollWheelZoom
          dragging
          doubleClickZoom
          touchZoom
          boxZoom
          keyboard
          className="z-0 h-full w-full"
          style={{ height: "100%", width: "100%", zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <InvalidateSize />
          <FitOrFocus selectedId={selectedId} fitToken={fitToken} points={points} />
          {withCoords.map((property) => (
            <HoverMarker
              key={property.id}
              property={property}
              active={property.id === selectedId || property.id === hoveredId}
              showPopup={showPopup}
              showPopupLinks={showPopupLinks}
              onSelect={onSelect}
              onHover={onHover}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
