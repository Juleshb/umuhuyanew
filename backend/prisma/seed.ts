import { PrismaClient, ListingType, PropertyStatus, PropertyType, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.inquiry.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.contactUnlock.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.propertyImage.deleteMany();
  await prisma.property.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@umuhuza.rw",
      name: "Umuhuza Admin",
      phone: "+250780000001",
      role: Role.ADMIN,
      passwordHash,
    },
  });

  const agent1 = await prisma.user.create({
    data: {
      email: "claire@umuhuza.rw",
      name: "Claire Mukamana",
      phone: "+250780000002",
      role: Role.AGENT,
      passwordHash,
      agentActiveUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    },
  });

  const agent2 = await prisma.user.create({
    data: {
      email: "jean@umuhuza.rw",
      name: "Jean Habimana",
      phone: "+250780000003",
      role: Role.AGENT,
      passwordHash,
      agentActiveUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    },
  });

  await prisma.user.create({
    data: {
      email: "buyer@umuhuza.rw",
      name: "Aline Uwase",
      phone: "+250780000004",
      role: Role.BUYER,
      passwordHash,
    },
  });

  const listings = [
    {
      title: "Modern Apartment in Nyarutarama",
      description:
        "Bright 3-bedroom apartment with city views, secure parking, and backup power. Ideal for professionals settling in Kigali.",
      type: PropertyType.APARTMENT,
      listingType: ListingType.RENT,
      price: 850000,
      bedrooms: 3,
      bathrooms: 2,
      sizeSqm: 120,
      province: "Kigali",
      district: "Gasabo",
      sector: "Remera",
      cell: "Nyarutarama",
      village: "Gishushu",
      address: "KG 9 Ave",
      lat: -1.9335,
      lng: 30.1302,
      agentId: agent1.id,
      images: [
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80",
      ],
    },
    {
      title: "Family House in Kibagabaga",
      description:
        "Spacious family home with a garden, dining room, and quiet neighborhood streets — perfect for long-term living in Kigali.",
      type: PropertyType.HOUSE,
      listingType: ListingType.SALE,
      price: 185000000,
      bedrooms: 4,
      bathrooms: 3,
      sizeSqm: 220,
      province: "Kigali",
      district: "Gasabo",
      sector: "Kimironko",
      cell: "Kibagabaga",
      village: "Akintwari",
      address: "Kibagabaga Road",
      lat: -1.9358,
      lng: 30.1356,
      agentId: agent1.id,
      images: [
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
      ],
    },
    {
      title: "Hillside Plot near Musanze",
      description:
        "Scenic land with open views near Volcanoes National Park — suited for a lodge, villa, or investment near Rwanda’s tourism corridor.",
      type: PropertyType.LAND,
      listingType: ListingType.SALE,
      price: 45000000,
      bedrooms: null,
      bathrooms: null,
      sizeSqm: 1500,
      province: "North",
      district: "Musanze",
      sector: "Muhoza",
      cell: "Cyabararika",
      village: "Buhuye",
      address: "Near Kinigi road",
      lat: -1.4992,
      lng: 29.6346,
      agentId: agent2.id,
      images: [
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80",
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80",
      ],
    },
    {
      title: "Lake-View Cottage in Rubavu",
      description:
        "Charming lakeside cottage for short or long stays. Welcome visitors exploring Lake Kivu and the western lakeshore.",
      type: PropertyType.HOUSE,
      listingType: ListingType.RENT,
      price: 1200000,
      bedrooms: 2,
      bathrooms: 2,
      sizeSqm: 95,
      province: "West",
      district: "Rubavu",
      sector: "Gisenyi",
      cell: "Nengo",
      village: "Gacuba",
      address: "Lake Kivu waterfront",
      lat: -1.6969,
      lng: 29.2366,
      agentId: agent2.id,
      images: [
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdbc?w=1200&q=80",
      ],
    },
    {
      title: "Retail Space in Huye",
      description:
        "Ground-floor commercial unit near the university town center — strong foot traffic for shops and services.",
      type: PropertyType.COMMERCIAL,
      listingType: ListingType.RENT,
      price: 650000,
      bedrooms: null,
      bathrooms: 1,
      sizeSqm: 80,
      province: "South",
      district: "Huye",
      sector: "Ngoma",
      cell: "Butare",
      village: "Akabuye",
      address: "Main road, Huye",
      lat: -2.5967,
      lng: 29.7389,
      agentId: agent2.id,
      images: [
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
        "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&q=80",
      ],
    },
    {
      title: "Townhouse in Kicukiro",
      description:
        "Newly finished townhouse with three bedrooms, modern finishes, and easy access to Kigali’s southern districts.",
      type: PropertyType.HOUSE,
      listingType: ListingType.SALE,
      price: 125000000,
      bedrooms: 3,
      bathrooms: 2,
      sizeSqm: 160,
      province: "Kigali",
      district: "Kicukiro",
      sector: "Gatenga",
      cell: "Gatenga",
      village: "Amahoro",
      address: "KK 15 Ave",
      lat: -1.9784,
      lng: 30.1127,
      agentId: agent1.id,
      images: [
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80",
        "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80",
      ],
    },
  ];

  for (const listing of listings) {
    const { images, ...data } = listing;
    await prisma.property.create({
      data: {
        ...data,
        currency: "RWF",
        status: PropertyStatus.APPROVED,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
        listingFeePaidAt: new Date(),
        images: {
          create: images.map((url, index) => ({
            url,
            isPrimary: index === 0,
          })),
        },
      },
    });
  }

  await prisma.banner.createMany({
    data: [
      {
        kicker: "Featured",
        title: "Homes for rent in Kigali",
        subtitle: "Apartments and houses with trusted local agents.",
        ctaLabel: "Browse rentals",
        href: "/explore?listingType=RENT&province=Kigali",
        imageUrl:
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&q=80",
        sortOrder: 0,
        isActive: true,
      },
      {
        kicker: "For sale",
        title: "Buy a family home this season",
        subtitle: "Townhouses and villas across Rwanda’s five provinces.",
        ctaLabel: "See listings",
        href: "/explore?listingType=SALE",
        imageUrl:
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80",
        sortOrder: 1,
        isActive: true,
      },
      {
        kicker: "Agents",
        title: "List your property on Umuhuza",
        subtitle: "Reach buyers and renters from Kigali to Rubavu.",
        ctaLabel: "Start listing",
        href: "/register",
        imageUrl:
          "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=80",
        sortOrder: 2,
        isActive: true,
      },
    ],
  });

  console.log("Seed complete");
  console.log("Admin:", admin.email, "/ password123");
  console.log("Agents:", agent1.email, agent2.email, "/ password123");
  console.log("Buyer: buyer@umuhuza.rw / password123");
  console.log("Banners: 3 home advertising slides");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
