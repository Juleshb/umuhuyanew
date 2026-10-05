const PROVINCE_LABELS: Record<string, string> = {
  Kigali: "Kigali City",
  North: "Northern Province",
  South: "Southern Province",
  East: "Eastern Province",
  West: "Western Province",
};

const LEGACY_TO_CODE: Record<string, string> = {
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

export const PROVINCES = [
  { value: "Kigali", label: "Kigali City" },
  { value: "North", label: "Northern Province" },
  { value: "South", label: "Southern Province" },
  { value: "East", label: "Eastern Province" },
  { value: "West", label: "Western Province" },
];

export const DISTRICTS: Record<string, string[]> = {
  Kigali: ["Gasabo", "Kicukiro", "Nyarugenge"],
  North: ["Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo"],
  South: [
    "Gisagara",
    "Huye",
    "Kamonyi",
    "Muhanga",
    "Nyamagabe",
    "Nyanza",
    "Nyaruguru",
    "Ruhango",
  ],
  East: ["Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Nyagatare", "Rwamagana"],
  West: ["Karongi", "Ngororero", "Nyabihu", "Nyamasheke", "Rubavu", "Rusizi", "Rutsiro"],
};

export function normalizeProvinceCode(value?: string | null) {
  if (!value) return "";
  const trimmed = value.trim();
  if (PROVINCE_LABELS[trimmed]) return trimmed;
  return LEGACY_TO_CODE[trimmed.toLowerCase()] ?? trimmed;
}

export function provinceLabel(value?: string | null) {
  const code = normalizeProvinceCode(value);
  return PROVINCE_LABELS[code] || value || "";
}

export function formatLocation(property: {
  village?: string | null;
  cell?: string | null;
  sector?: string | null;
  district?: string | null;
  province?: string | null;
}) {
  return [
    property.village,
    property.cell,
    property.sector,
    property.district,
    provinceLabel(property.province),
  ]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(", ");
}

export function formatPrice(price: number, currency = "RWF") {
  try {
    return new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${Math.round(price).toLocaleString()} ${currency}`;
  }
}

export const PROPERTY_TYPES = [
  { value: "", label: "All types" },
  { value: "HOUSE", label: "House" },
  { value: "APARTMENT", label: "Apartment" },
  { value: "LAND", label: "Land" },
  { value: "COMMERCIAL", label: "Commercial" },
];

export const LISTING_TYPES = [
  { value: "", label: "All" },
  { value: "SALE", label: "Buy" },
  { value: "RENT", label: "Rent" },
];
