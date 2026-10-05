import type { Prisma } from "@prisma/client";

export const propertyInclude = {
  images: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
  agent: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatarUrl: true,
    },
  },
} satisfies Prisma.PropertyInclude;

export function serializeProperty<T extends { price: Prisma.Decimal | number | string }>(
  property: T
) {
  return {
    ...property,
    price: Number(property.price),
  };
}
