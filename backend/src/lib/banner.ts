import type { Banner } from "@prisma/client";

export function serializeBanner(banner: Banner) {
  return {
    id: banner.id,
    kicker: banner.kicker,
    title: banner.title,
    subtitle: banner.subtitle,
    ctaLabel: banner.ctaLabel,
    href: banner.href,
    imageUrl: banner.imageUrl,
    sortOrder: banner.sortOrder,
    isActive: banner.isActive,
    startsAt: banner.startsAt,
    endsAt: banner.endsAt,
    createdAt: banner.createdAt,
    updatedAt: banner.updatedAt,
  };
}

export function activeBannerWhere(now = new Date()) {
  return {
    isActive: true,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
    ],
  };
}
