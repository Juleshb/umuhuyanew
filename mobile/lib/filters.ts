import { DISTRICTS, PROVINCES } from "./location";

export type PropertyFilters = {
  q: string;
  listingType: string;
  type: string;
  province: string;
  district: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  status: string;
};

export const EMPTY_FILTERS: PropertyFilters = {
  q: "",
  listingType: "",
  type: "",
  province: "",
  district: "",
  minPrice: "",
  maxPrice: "",
  bedrooms: "",
  status: "",
};

export const STATUS_OPTIONS = [
  { value: "", label: "All listings" },
  { value: "APPROVED", label: "Available" },
  { value: "SOLD", label: "Sold" },
  { value: "RENTED", label: "Rented" },
];

export const BEDROOM_OPTIONS = [
  { value: "", label: "Any" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
];

export function countSheetFilters(filters: PropertyFilters) {
  return [
    filters.listingType,
    filters.type,
    filters.province,
    filters.district,
    filters.minPrice,
    filters.maxPrice,
    filters.bedrooms,
    filters.status,
  ].filter(Boolean).length;
}

export function buildPropertyQuery(
  filters: PropertyFilters,
  options?: { limit?: number }
) {
  const search = new URLSearchParams();
  if (filters.q.trim()) search.set("q", filters.q.trim());
  if (filters.listingType) search.set("listingType", filters.listingType);
  if (filters.type) search.set("type", filters.type);
  if (filters.province) search.set("province", filters.province);
  if (filters.district) search.set("district", filters.district);
  if (filters.minPrice) search.set("minPrice", filters.minPrice);
  if (filters.maxPrice) search.set("maxPrice", filters.maxPrice);
  if (filters.bedrooms) search.set("bedrooms", filters.bedrooms);
  if (filters.status) search.set("status", filters.status);
  search.set("limit", String(options?.limit ?? 24));
  return search.toString();
}

export function filterSummaryChips(filters: PropertyFilters) {
  const chips: { key: keyof PropertyFilters; label: string }[] = [];
  if (filters.listingType === "SALE") chips.push({ key: "listingType", label: "For sale" });
  if (filters.listingType === "RENT") chips.push({ key: "listingType", label: "For rent" });
  if (filters.type) chips.push({ key: "type", label: titleCase(filters.type) });
  if (filters.province) {
    const province = PROVINCES.find((item) => item.value === filters.province);
    chips.push({ key: "province", label: province?.label ?? filters.province });
  }
  if (filters.district) chips.push({ key: "district", label: filters.district });
  if (filters.bedrooms) chips.push({ key: "bedrooms", label: `${filters.bedrooms}+ beds` });
  if (filters.minPrice) chips.push({ key: "minPrice", label: `Min ${Number(filters.minPrice).toLocaleString()} RWF` });
  if (filters.maxPrice) chips.push({ key: "maxPrice", label: `Max ${Number(filters.maxPrice).toLocaleString()} RWF` });
  if (filters.status === "APPROVED") chips.push({ key: "status", label: "Available" });
  if (filters.status === "SOLD") chips.push({ key: "status", label: "Sold" });
  if (filters.status === "RENTED") chips.push({ key: "status", label: "Rented" });
  return chips;
}

export function districtsFor(province: string) {
  return DISTRICTS[province] ?? [];
}

function titleCase(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}
