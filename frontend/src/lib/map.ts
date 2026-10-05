export const KIGALI_CENTER: [number, number] = [30.0619, -1.9441]; // [lng, lat]
export const RWANDA_DEFAULT_ZOOM = 12;

export function hasCoordinates(
  value: { lat?: number | null; lng?: number | null } | null | undefined
): value is { lat: number; lng: number } {
  return (
    value != null &&
    typeof value.lat === "number" &&
    typeof value.lng === "number" &&
    Number.isFinite(value.lat) &&
    Number.isFinite(value.lng)
  );
}

export function parseCoordinate(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
