export type Role = "BUYER" | "AGENT" | "ADMIN";

export type PropertyType = "HOUSE" | "APARTMENT" | "LAND" | "COMMERCIAL";
export type ListingType = "SALE" | "RENT";
export type PropertyStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "SOLD"
  | "RENTED";
export type InquiryStatus = "NEW" | "READ" | "REPLIED";

export type User = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  avatarUrl: string | null;
  createdAt: string;
  agentActiveUntil?: string | null;
  agentActive?: boolean;
};

export type PropertyImage = {
  id: string;
  url: string;
  isPrimary: boolean;
};

export type PropertyAgent = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
};

export type Property = {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  listingType: ListingType;
  price: number;
  currency: string;
  bedrooms: number | null;
  bathrooms: number | null;
  sizeSqm: number | null;
  province: string;
  district: string;
  sector: string | null;
  cell: string | null;
  village: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  status: PropertyStatus;
  agentId: string;
  expiresAt?: string | null;
  listingFeePaidAt?: string | null;
  contactUnlocked?: boolean;
  unlockExpiresAt?: string | null;
  contactUnlockPrice?: number;
  listingFeePrice?: number;
  createdAt: string;
  updatedAt: string;
  images: PropertyImage[];
  agent: PropertyAgent;
};

export type Inquiry = {
  id: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
  property: {
    id: string;
    title: string;
    province: string;
    district: string;
    sector?: string | null;
    cell?: string | null;
    village?: string | null;
    listingType?: ListingType;
    price?: number;
    currency?: string;
  };
  buyer: { id: string; name: string; email: string; phone: string | null };
  agent: { id: string; name: string; email: string; phone: string | null };
};

export type FavoriteItem = {
  id: string;
  createdAt?: string;
  property: Property;
};

export type PropertyListResponse = {
  data: Property[];
  meta: { total: number; page: number; limit: number; pages: number };
};

export type AdBanner = {
  id: string;
  kicker: string;
  title: string;
  subtitle: string | null;
  ctaLabel: string;
  href: string | null;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};
