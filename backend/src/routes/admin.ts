import { Router } from "express";
import { z } from "zod";
import { PropertyStatus, Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { paramId } from "../lib/params";
import { propertyInclude, serializeProperty } from "../lib/property";
import { serializeBanner } from "../lib/banner";
import { imageUpload, publicUploadPath } from "../lib/upload";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/properties", async (req, res, next) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const items = await prisma.property.findMany({
      where: status ? { status: status as PropertyStatus } : undefined,
      include: propertyInclude,
      orderBy: { updatedAt: "desc" },
    });
    return res.json({ data: items.map(serializeProperty) });
  } catch (err) {
    return next(err);
  }
});

const statusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "PENDING", "DRAFT", "SOLD", "RENTED"]),
});

router.patch("/properties/:id/status", async (req, res, next) => {
  try {
    const { status } = statusSchema.parse(req.body);
    const id = paramId(req.params.id);
    const existing = await prisma.property.findUnique({
      where: { id },
      include: { images: true },
    });
    if (!existing) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (
      (status === "APPROVED" || status === "PENDING") &&
      existing.images.length < 2
    ) {
      return res.status(400).json({
        error: "Property must have at least 2 images before approval",
      });
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
});

router.get("/users", async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: { select: { properties: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ data: users });
  } catch (err) {
    return next(err);
  }
});

const roleSchema = z.object({
  role: z.nativeEnum(Role),
});

router.patch("/users/:id/role", async (req, res, next) => {
  try {
    const { role } = roleSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: paramId(req.params.id) },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });
    return res.json({ data: user });
  } catch (err) {
    return next(err);
  }
});

function emptyToNull(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseActive(value: unknown, fallback = true) {
  if (typeof value === "boolean") return value;
  if (value === "false" || value === "off" || value === "0") return false;
  if (value === "true" || value === "on" || value === "1") return true;
  return fallback;
}

function parseOptionalDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const bannerFieldsSchema = z.object({
  kicker: z.string().trim().max(24).optional(),
  title: z.string().trim().min(2).max(80),
  subtitle: z.string().trim().max(160).optional(),
  ctaLabel: z.string().trim().max(40).optional(),
  href: z.string().trim().max(500).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
  isActive: z.any().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
});

const bannerPatchSchema = bannerFieldsSchema.partial().extend({
  title: z.string().trim().min(2).max(80).optional(),
});

router.get("/banners", async (_req, res, next) => {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return res.json({ data: banners.map(serializeBanner) });
  } catch (err) {
    return next(err);
  }
});

router.post("/banners", imageUpload.single("image"), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "Banner image is required" });
    }
    const body = bannerFieldsSchema.parse(req.body);
    const banner = await prisma.banner.create({
      data: {
        kicker: emptyToNull(body.kicker) ?? "Ad",
        title: body.title,
        subtitle: emptyToNull(body.subtitle),
        ctaLabel: emptyToNull(body.ctaLabel) ?? "Learn more",
        href: emptyToNull(body.href),
        imageUrl: publicUploadPath(file.filename),
        sortOrder: body.sortOrder ?? 0,
        isActive: parseActive(body.isActive, true),
        startsAt: parseOptionalDate(body.startsAt),
        endsAt: parseOptionalDate(body.endsAt),
      },
    });
    return res.status(201).json({ data: serializeBanner(banner) });
  } catch (err) {
    return next(err);
  }
});

router.patch("/banners/:id", async (req, res, next) => {
  try {
    const id = paramId(req.params.id);
    const body = bannerPatchSchema.parse(req.body);
    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Banner not found" });
    }

    const banner = await prisma.banner.update({
      where: { id },
      data: {
        ...(body.kicker !== undefined ? { kicker: emptyToNull(body.kicker) ?? "Ad" } : {}),
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.subtitle !== undefined ? { subtitle: emptyToNull(body.subtitle) } : {}),
        ...(body.ctaLabel !== undefined ? { ctaLabel: emptyToNull(body.ctaLabel) ?? "Learn more" } : {}),
        ...(body.href !== undefined ? { href: emptyToNull(body.href) } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
        ...(body.isActive !== undefined ? { isActive: parseActive(body.isActive, existing.isActive) } : {}),
        ...(body.startsAt !== undefined ? { startsAt: parseOptionalDate(body.startsAt) } : {}),
        ...(body.endsAt !== undefined ? { endsAt: parseOptionalDate(body.endsAt) } : {}),
      },
    });
    return res.json({ data: serializeBanner(banner) });
  } catch (err) {
    return next(err);
  }
});

router.post("/banners/:id/image", imageUpload.single("image"), async (req, res, next) => {
  try {
    const id = paramId(req.params.id);
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "Banner image is required" });
    }
    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Banner not found" });
    }
    const banner = await prisma.banner.update({
      where: { id },
      data: { imageUrl: publicUploadPath(file.filename) },
    });
    return res.json({ data: serializeBanner(banner) });
  } catch (err) {
    return next(err);
  }
});

router.delete("/banners/:id", async (req, res, next) => {
  try {
    const id = paramId(req.params.id);
    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Banner not found" });
    }
    await prisma.banner.delete({ where: { id } });
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

export default router;
