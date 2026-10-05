import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import {
  ListingType,
  PropertyStatus,
  PropertyType,
  Role,
  type Prisma,
} from "@prisma/client";
import { prisma } from "../lib/prisma";
import { env } from "../lib/env";
import { paramId } from "../lib/params";
import { propertyInclude, serializeProperty } from "../lib/property";
import { authenticate, optionalAuth, requireRole } from "../middleware/auth";
import {
  PRICING,
  isAgentSubscriptionActive,
  publicListingWhere,
} from "../lib/billing";

const router = Router();

const PROVINCE_ALIASES: Record<string, string[]> = {
  kigali: ["Kigali", "Kigali City", "City of Kigali"],
  "kigali city": ["Kigali", "Kigali City", "City of Kigali"],
  "city of kigali": ["Kigali", "Kigali City", "City of Kigali"],
  north: ["North", "Northern Province"],
  "northern province": ["North", "Northern Province"],
  south: ["South", "Southern Province"],
  "southern province": ["South", "Southern Province"],
  east: ["East", "Eastern Province"],
  "eastern province": ["East", "Eastern Province"],
  west: ["West", "Western Province"],
  "western province": ["West", "Western Province"],
};

function provinceAliases(province: string): string[] {
  const mapped = PROVINCE_ALIASES[province.trim().toLowerCase()];
  return mapped ? Array.from(new Set(mapped)) : [province];
}

const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);
if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image uploads are allowed"));
      return;
    }
    cb(null, true);
  },
});

const propertyBodySchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  type: z.nativeEnum(PropertyType),
  listingType: z.nativeEnum(ListingType),
  price: z.coerce.number().positive(),
  currency: z.string().default("RWF"),
  bedrooms: z.coerce.number().int().nonnegative().optional().nullable(),
  bathrooms: z.coerce.number().int().nonnegative().optional().nullable(),
  sizeSqm: z.coerce.number().positive().optional().nullable(),
  province: z.string().min(2),
  district: z.string().min(2),
  sector: z.string().optional().nullable(),
  cell: z.string().optional().nullable(),
  village: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  lat: z.coerce.number().optional().nullable(),
  lng: z.coerce.number().optional().nullable(),
});

router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const {
      type,
      listingType,
      province,
      district,
      sector,
      cell,
      village,
      minPrice,
      maxPrice,
      bedrooms,
      q,
      page = "1",
      limit = "12",
    } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const take = Math.min(50, Math.max(1, Number(limit) || 12));
    const skip = (pageNum - 1) * take;

    const publicStatuses: PropertyStatus[] = [
      PropertyStatus.APPROVED,
      PropertyStatus.SOLD,
      PropertyStatus.RENTED,
    ];

    const statusParam =
      typeof req.query.status === "string" ? req.query.status.toUpperCase() : "";
    const where: Prisma.PropertyWhereInput = {
      status:
        statusParam && publicStatuses.includes(statusParam as PropertyStatus)
          ? (statusParam as PropertyStatus)
          : { in: publicStatuses },
      ...publicListingWhere(),
    };

    if (type && typeof type === "string") {
      where.type = type as PropertyType;
    }
    if (listingType && typeof listingType === "string") {
      where.listingType = listingType as ListingType;
    }
    if (province && typeof province === "string") {
      const aliases = provinceAliases(province);
      where.AND = [
        ...((where.AND as Prisma.PropertyWhereInput[]) ?? []),
        {
          OR: aliases.map((alias) => ({
            province: { equals: alias, mode: "insensitive" as const },
          })),
        },
      ];
    }
    if (district && typeof district === "string") {
      where.district = { equals: district, mode: "insensitive" };
    }
    if (sector && typeof sector === "string") {
      where.sector = { equals: sector, mode: "insensitive" };
    }
    if (cell && typeof cell === "string") {
      where.cell = { equals: cell, mode: "insensitive" };
    }
    if (village && typeof village === "string") {
      where.village = { equals: village, mode: "insensitive" };
    }
    if (bedrooms && !Number.isNaN(Number(bedrooms))) {
      where.bedrooms = { gte: Number(bedrooms) };
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice && !Number.isNaN(Number(minPrice))) {
        where.price.gte = Number(minPrice);
      }
      if (maxPrice && !Number.isNaN(Number(maxPrice))) {
        where.price.lte = Number(maxPrice);
      }
    }
    if (q && typeof q === "string" && q.trim()) {
      where.OR = [
        { title: { contains: q.trim(), mode: "insensitive" } },
        { description: { contains: q.trim(), mode: "insensitive" } },
        { district: { contains: q.trim(), mode: "insensitive" } },
        { province: { contains: q.trim(), mode: "insensitive" } },
        { sector: { contains: q.trim(), mode: "insensitive" } },
        { cell: { contains: q.trim(), mode: "insensitive" } },
        { village: { contains: q.trim(), mode: "insensitive" } },
        { address: { contains: q.trim(), mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
        include: propertyInclude,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);

    return res.json({
      data: items.map(serializeProperty),
      meta: { total, page: pageNum, limit: take, pages: Math.ceil(total / take) },
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const id = paramId(req.params.id);
    const property = await prisma.property.findUnique({
      where: { id },
      include: propertyInclude,
    });

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    const isOwner = req.user?.id === property.agentId;
    const isAdmin = req.user?.role === "ADMIN";
    const isPublic =
      property.status === PropertyStatus.APPROVED ||
      property.status === PropertyStatus.SOLD ||
      property.status === PropertyStatus.RENTED;
    if (!isPublic && !isOwner && !isAdmin) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (
      property.status === PropertyStatus.APPROVED &&
      property.expiresAt &&
      property.expiresAt.getTime() <= Date.now() &&
      !isOwner &&
      !isAdmin
    ) {
      return res.status(404).json({ error: "This listing has expired" });
    }

    let contactUnlocked = Boolean(isOwner || isAdmin);
    let unlockExpiresAt: Date | null = null;
    if (!contactUnlocked && req.user?.id) {
      const unlock = await prisma.contactUnlock.findUnique({
        where: {
          userId_propertyId: { userId: req.user.id, propertyId: property.id },
        },
      });
      if (unlock && unlock.expiresAt.getTime() > Date.now()) {
        contactUnlocked = true;
        unlockExpiresAt = unlock.expiresAt;
      }
    }

    const serialized = serializeProperty(property) as Record<string, unknown>;
    if (!contactUnlocked) {
      serialized.agent = {
        id: property.agent.id,
        name: property.agent.name,
        email: null,
        phone: null,
        avatarUrl: property.agent.avatarUrl,
      };
    }

    return res.json({
      data: {
        ...serialized,
        contactUnlocked,
        unlockExpiresAt,
        contactUnlockPrice: PRICING.CONTACT_UNLOCK,
        listingFeePrice: PRICING.LISTING_FEE,
      },
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/", authenticate, requireRole("BUYER", "AGENT", "ADMIN"), async (req, res, next) => {
  try {
    const data = propertyBodySchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (user.role === Role.AGENT && !isAgentSubscriptionActive(user)) {
      return res.status(402).json({
        error: "Activate your agent account (15,000 RWF / month) to post listings",
        code: "AGENT_SUBSCRIPTION_REQUIRED",
        amount: PRICING.AGENT_SUBSCRIPTION,
      });
    }

    const expiresAt =
      user.role === Role.AGENT || user.role === Role.ADMIN
        ? user.agentActiveUntil
        : null;

    const property = await prisma.property.create({
      data: {
        ...data,
        agentId: req.user!.id,
        status: PropertyStatus.DRAFT,
        expiresAt,
      },
      include: propertyInclude,
    });
    return res.status(201).json({
      data: serializeProperty(property),
      billing: {
        listingFeeRequired: user.role === Role.BUYER,
        listingFeeAmount: PRICING.LISTING_FEE,
      },
    });
  } catch (err) {
    return next(err);
  }
});

router.patch("/:id", authenticate, requireRole("BUYER", "AGENT", "ADMIN"), async (req, res, next) => {
  try {
    const id = paramId(req.params.id);
    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Property not found" });
    }
    if (req.user!.role !== "ADMIN" && existing.agentId !== req.user!.id) {
      return res.status(403).json({ error: "Not allowed to edit this property" });
    }

    const data = propertyBodySchema.partial().parse(req.body);
    const property = await prisma.property.update({
      where: { id: existing.id },
      data: {
        ...data,
        status:
          existing.status === PropertyStatus.APPROVED ||
          existing.status === PropertyStatus.PENDING
            ? PropertyStatus.DRAFT
            : existing.status,
      },
      include: propertyInclude,
    });

    return res.json({ data: serializeProperty(property) });
  } catch (err) {
    return next(err);
  }
});

router.post(
  "/:id/images",
  authenticate,
  requireRole("BUYER", "AGENT", "ADMIN"),
  upload.array("images", 8),
  async (req, res, next) => {
    try {
      const id = paramId(req.params.id);
      const existing = await prisma.property.findUnique({
        where: { id },
        include: { images: true },
      });
      if (!existing) {
        return res.status(404).json({ error: "Property not found" });
      }
      if (req.user!.role !== "ADMIN" && existing.agentId !== req.user!.id) {
        return res.status(403).json({ error: "Not allowed to upload images" });
      }

      const files = req.files as Express.Multer.File[];
      if (!files?.length) {
        return res.status(400).json({ error: "No images uploaded" });
      }

      const hasPrimary = existing.images.some((img) => img.isPrimary);
      await prisma.propertyImage.createMany({
        data: files.map((file, index) => ({
          propertyId: existing.id,
          url: `/uploads/${file.filename}`,
          isPrimary: !hasPrimary && index === 0,
        })),
      });

      const property = await prisma.property.findUnique({
        where: { id: existing.id },
        include: propertyInclude,
      });

      return res.status(201).json({ data: serializeProperty(property!) });
    } catch (err) {
      return next(err);
    }
  }
);

router.post(
  "/:id/submit",
  authenticate,
  requireRole("BUYER", "AGENT", "ADMIN"),
  async (req, res, next) => {
    try {
      const id = paramId(req.params.id);
      const existing = await prisma.property.findUnique({
        where: { id },
        include: { images: true },
      });
      if (!existing) {
        return res.status(404).json({ error: "Property not found" });
      }
      if (req.user!.role !== "ADMIN" && existing.agentId !== req.user!.id) {
        return res.status(403).json({ error: "Not allowed to submit this property" });
      }
      if (existing.images.length < 2) {
        return res.status(400).json({
          error: "Add at least 2 images before submitting",
        });
      }

      const owner = await prisma.user.findUnique({ where: { id: existing.agentId } });
      if (!owner) return res.status(400).json({ error: "Listing owner not found" });

      if (owner.role === Role.AGENT && !isAgentSubscriptionActive(owner) && req.user!.role !== "ADMIN") {
        return res.status(402).json({
          error: "Activate your agent account (15,000 RWF / month) before submitting",
          code: "AGENT_SUBSCRIPTION_REQUIRED",
          amount: PRICING.AGENT_SUBSCRIPTION,
        });
      }

      if (
        owner.role === Role.BUYER &&
        !existing.listingFeePaidAt &&
        req.user!.role !== "ADMIN"
      ) {
        return res.status(402).json({
          error: "Pay 1,000 RWF listing fee before submitting (valid for 1 month)",
          code: "LISTING_FEE_REQUIRED",
          amount: PRICING.LISTING_FEE,
          propertyId: existing.id,
        });
      }

      const property = await prisma.property.update({
        where: { id: existing.id },
        data: { status: PropertyStatus.PENDING },
        include: propertyInclude,
      });

      return res.json({ data: serializeProperty(property) });
    } catch (err) {
      return next(err);
    }
  }
);

const statusUpdateSchema = z.object({
  status: z.enum(["DRAFT", "PENDING", "APPROVED", "REJECTED", "SOLD", "RENTED"]),
});

router.patch(
  "/:id/status",
  authenticate,
  requireRole("BUYER", "AGENT", "ADMIN"),
  async (req, res, next) => {
    try {
      const { status } = statusUpdateSchema.parse(req.body);
      const id = paramId(req.params.id);
      const existing = await prisma.property.findUnique({
        where: { id },
        include: { images: true },
      });
      if (!existing) {
        return res.status(404).json({ error: "Property not found" });
      }
      if (req.user!.role !== "ADMIN" && existing.agentId !== req.user!.id) {
        return res.status(403).json({ error: "Not allowed to update this property" });
      }

      if (req.user!.role !== "ADMIN") {
        const current = existing.status;
        const live = [
          PropertyStatus.APPROVED,
          PropertyStatus.SOLD,
          PropertyStatus.RENTED,
        ] as const;

        const agentAllowed =
          status === "DRAFT" ||
          (status === "PENDING" &&
            (current === PropertyStatus.DRAFT || current === PropertyStatus.REJECTED)) ||
          ((status === "SOLD" || status === "RENTED") && live.includes(current as (typeof live)[number])) ||
          (status === "APPROVED" &&
            (current === PropertyStatus.SOLD || current === PropertyStatus.RENTED));

        if (!agentAllowed) {
          return res.status(400).json({
            error: `Cannot change status from ${current} to ${status}`,
          });
        }

        if (status === "PENDING" && existing.images.length < 2) {
          return res.status(400).json({
            error: "Add at least 2 images before submitting",
          });
        }

        if (status === "PENDING") {
          const owner = await prisma.user.findUnique({ where: { id: existing.agentId } });
          if (owner?.role === Role.AGENT && !isAgentSubscriptionActive(owner)) {
            return res.status(402).json({
              error: "Activate your agent account (15,000 RWF / month) before submitting",
              code: "AGENT_SUBSCRIPTION_REQUIRED",
              amount: PRICING.AGENT_SUBSCRIPTION,
            });
          }
          if (owner?.role === Role.BUYER && !existing.listingFeePaidAt) {
            return res.status(402).json({
              error: "Pay 1,000 RWF listing fee before submitting (valid for 1 month)",
              code: "LISTING_FEE_REQUIRED",
              amount: PRICING.LISTING_FEE,
              propertyId: existing.id,
            });
          }
        }
      }

      const property = await prisma.property.update({
        where: { id: existing.id },
        data: { status: status as PropertyStatus },
        include: propertyInclude,
      });

      return res.json({ data: serializeProperty(property) });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
