"use client";

import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { KIGALI_CENTER, RWANDA_DEFAULT_ZOOM } from "@/lib/map";

const tealIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:16px;height:16px;border-radius:999px;background:#0f9ea8;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function ClickHandler({
  onPick,
}: {
  onPick: (coords: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(e) {
      onPick({
        lat: Number(e.latlng.lat.toFixed(6)),
        lng: Number(e.latlng.lng.toFixed(6)),
      });
    },
  });
  return null;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], Math.max(map.getZoom(), 15));
  }, [lat, lng, map]);
  return null;
}

type Props = {
  lat: number | null;
  lng: number | null;
  onChange: (coords: { lat: number; lng: number }) => void;
  className?: string;
  heightClassName?: string;
};

export function PropertyMapPicker({
  lat,
  lng,
  onChange,
  className = "",
  heightClassName = "h-72",
}: Props) {
  const center: [number, number] =
    lat != null && lng != null ? [lat, lng] : [KIGALI_CENTER[1], KIGALI_CENTER[0]];

  return (
    <div className={className}>
      <div className={`${heightClassName} w-full overflow-hidden rounded-xl border border-black/10`}>
        <MapContainer
          center={center}
          zoom={lat != null && lng != null ? 15 : RWANDA_DEFAULT_ZOOM}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={onChange} />
          {lat != null && lng != null ? (
            <>
              <Marker position={[lat, lng]} icon={tealIcon} />
              <Recenter lat={lat} lng={lng} />
            </>
          ) : null}
        </MapContainer>
      </div>
      <p className="mt-2 text-xs text-ink/55">
        Click the map to drop a pin. Coordinates update automatically.
      </p>
    </div>
  );
}
