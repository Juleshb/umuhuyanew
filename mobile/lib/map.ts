import type { Property } from "./types";

/** Kigali — latitude, longitude for react-native-maps */
export const KIGALI_REGION = {
  latitude: -1.9441,
  longitude: 30.0619,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

export type MappedProperty = Property & { lat: number; lng: number };

export function hasCoordinates(value: Property | null | undefined): value is MappedProperty {
  return (
    value != null &&
    typeof value.lat === "number" &&
    typeof value.lng === "number" &&
    Number.isFinite(value.lat) &&
    Number.isFinite(value.lng)
  );
}

export function regionForProperties(properties: MappedProperty[]) {
  if (!properties.length) return KIGALI_REGION;

  let minLat = properties[0].lat;
  let maxLat = properties[0].lat;
  let minLng = properties[0].lng;
  let maxLng = properties[0].lng;

  for (const property of properties) {
    minLat = Math.min(minLat, property.lat);
    maxLat = Math.max(maxLat, property.lat);
    minLng = Math.min(minLng, property.lng);
    maxLng = Math.max(maxLng, property.lng);
  }

  const latitude = (minLat + maxLat) / 2;
  const longitude = (minLng + maxLng) / 2;
  const latitudeDelta = Math.max((maxLat - minLat) * 1.45, 0.04);
  const longitudeDelta = Math.max((maxLng - minLng) * 1.45, 0.04);

  return { latitude, longitude, latitudeDelta, longitudeDelta };
}
