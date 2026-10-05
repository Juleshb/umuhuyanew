import { Router } from "express";
import { PropertyStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { paramId } from "../lib/params";
import { propertyInclude, serializeProperty } from "../lib/property";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user!.id },
      include: {
        property: { include: propertyInclude },
      },
      orderBy: { createdAt: "desc" },
    });

    const publicStatuses: PropertyStatus[] = [
      PropertyStatus.APPROVED,
      PropertyStatus.SOLD,
      PropertyStatus.RENTED,
    ];

    return res.json({
      data: favorites
        .filter((fav) => publicStatuses.includes(fav.property.status))
        .map((fav) => ({
          id: fav.id,
          createdAt: fav.createdAt,
          property: serializeProperty(fav.property),
        })),
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/:propertyId", async (req, res, next) => {
  try {
    const propertyId = paramId(req.params.propertyId);
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });
    const publicStatuses: PropertyStatus[] = [
      PropertyStatus.APPROVED,
      PropertyStatus.SOLD,
      PropertyStatus.RENTED,
    ];
    if (!property || !publicStatuses.includes(property.status)) {
      return res.status(404).json({ error: "Property not found" });
    }

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_propertyId: {
          userId: req.user!.id,
          propertyId: property.id,
        },
      },
      update: {},
      create: {
        userId: req.user!.id,
        propertyId: property.id,
      },
      include: {
        property: { include: propertyInclude },
      },
    });

    return res.status(201).json({
      data: {
        id: favorite.id,
        createdAt: favorite.createdAt,
        property: serializeProperty(favorite.property),
      },
    });
  } catch (err) {
    return next(err);
  }
});

router.delete("/:propertyId", async (req, res, next) => {
  try {
    await prisma.favorite.deleteMany({
      where: {
        userId: req.user!.id,
        propertyId: paramId(req.params.propertyId),
      },
    });
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

export default router;
