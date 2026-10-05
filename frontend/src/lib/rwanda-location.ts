import {
  Cells,
  Districts,
  Provinces,
  Sectors,
  Villages,
} from "rwanda";

export type RwandaProvinceCode = "East" | "Kigali" | "North" | "South" | "West";

export const PROVINCE_LABELS: Record<RwandaProvinceCode, string> = {
  Kigali: "Kigali City",
  North: "Northern Province",
  South: "Southern Province",
  East: "Eastern Province",
  West: "Western Province",
};

const LEGACY_TO_CODE: Record<string, RwandaProvinceCode> = {
  kigali: "Kigali",
  "kigali city": "Kigali",
  "city of kigali": "Kigali",
  north: "North",
  "northern province": "North",
  south: "South",
  "southern province": "South",
  east: "East",
  "eastern province": "East",
  west: "West",
  "western province": "West",
};

export function normalizeProvinceCode(
  value: string | null | undefined
): RwandaProvinceCode | "" {
  if (!value) return "";
  const trimmed = value.trim();
  if ((Object.keys(PROVINCE_LABELS) as string[]).includes(trimmed)) {
    return trimmed as RwandaProvinceCode;
  }
  return LEGACY_TO_CODE[trimmed.toLowerCase()] ?? "";
}

export function provinceLabel(value: string | null | undefined) {
  const code = normalizeProvinceCode(value);
  if (!code) return value ?? "";
  return PROVINCE_LABELS[code];
}

export function provinceOptions(): { value: RwandaProvinceCode; label: string }[] {
  return (Provinces() as RwandaProvinceCode[]).map((code) => ({
    value: code,
    label: PROVINCE_LABELS[code],
  }));
}

export function districtOptions(province: string) {
  const code = normalizeProvinceCode(province);
  if (!code) return [];
  return Districts({ provinces: code }) ?? [];
}

export function sectorOptions(province: string, district: string) {
  const code = normalizeProvinceCode(province);
  if (!code || !district) return [];

  // The rwanda package's Sectors({ province, district }) currently returns
  // province-wide sectors. Keep only sectors that belong to this district.
  const candidates =
    Sectors({
      province: code,
      district: district as never,
    }) ?? [];

  return candidates.filter((sector) => {
    const cells = Cells({
      province: code,
      district: district as never,
      sector,
    });
    return Array.isArray(cells) && cells.length > 0;
  });
}

export function cellOptions(province: string, district: string, sector: string) {
  const code = normalizeProvinceCode(province);
  if (!code || !district || !sector) return [];
  return (
    Cells({
      province: code,
      district: district as never,
      sector,
    }) ?? []
  );
}

export function villageOptions(
  province: string,
  district: string,
  sector: string,
  cell: string
) {
  const code = normalizeProvinceCode(province);
  if (!code || !district || !sector || !cell) return [];
  return (
    Villages({
      province: code,
      district: district as never,
      sector,
      cell,
    }) ?? []
  );
}

/** Values that should match a selected province in DB (legacy + package names). */
export function provinceMatchValues(province: string): string[] {
  const code = normalizeProvinceCode(province);
  if (!code) return province ? [province] : [];
  return Array.from(new Set([code, PROVINCE_LABELS[code], province]));
}
