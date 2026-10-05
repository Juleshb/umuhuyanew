/** Rwanda admin levels: Province → District → Sector → Cell → Village */
import { provinceLabel } from "@/lib/rwanda-location";

export type RwandaLocation = {
  province?: string | null;
  district?: string | null;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;
};

export function formatLocation(
  location: RwandaLocation,
  options?: { includeProvince?: boolean; compact?: boolean }
) {
  const includeProvince = options?.includeProvince ?? true;
  const parts = [
    location.village,
    location.cell,
    location.sector,
    location.district,
    includeProvince ? provinceLabel(location.province) || location.province : null,
  ].filter((part): part is string => Boolean(part && part.trim()));

  if (options?.compact) {
    return parts.slice(0, 3).join(", ");
  }
  return parts.join(", ");
}

export function formatLocationLines(location: RwandaLocation) {
  return [
    location.village ? `Village: ${location.village}` : null,
    location.cell ? `Cell: ${location.cell}` : null,
    location.sector ? `Sector: ${location.sector}` : null,
    location.district ? `District: ${location.district}` : null,
    location.province
      ? `Province: ${provinceLabel(location.province) || location.province}`
      : null,
  ].filter((line): line is string => Boolean(line));
}
