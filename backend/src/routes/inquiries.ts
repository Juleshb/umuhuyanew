import { Router } from "express";
import { z } from "zod";
import { InquiryStatus, PropertyStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { paramId } from "../lib/params";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

const createSchema = z.object({
  propertyId: z.string().min(1),
  message: z.string().min(5),
});

const statusSchema = z.object({
  status: z.nativeEnum(InquiryStatus),
});

router.post("/", authenticate, async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
    });

    if (!property || property.status !== PropertyStatus.APPROVED) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (property.agentId === req.user!.id) {
      return res.status(400).json({ error: "You cannot inquire on your own listing" });
    }

    if (req.user!.role !== "ADMIN") {
      const unlock = await prisma.contactUnlock.findUnique({
        where: {
          userId_propertyId: {
            userId: req.user!.id,
            propertyId: property.id,
          },
        },
      });
      if (!unlock || unlock.expiresAt.getTime() <= Date.now()) {
        return res.status(402).json({
          error:
            "Pay 5,000 RWF to unlock seller contact and send inquiries (valid for 1 week)",
          code: "CONTACT_UNLOCK_REQUIRED",
          amount: 5000,
          propertyId: property.id,
        });
      }
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        message: data.message,
        propertyId: property.id,
        buyerId: req.user!.id,
        agentId: property.agentId,
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            province: true,
            district: true,
            sector: true,
            cell: true,
            village: true,
          },
        },
        buyer: { select: { id: true, name: true, email: true, phone: true } },
        agent: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    return res.status(201).json({ data: inquiry });
  } catch (err) {
    return next(err);
  }
});

router.get("/", authenticate, async (req, res, next) => {
  try {
    const where =
      req.user!.role === "ADMIN"
        ? {}
        : req.user!.role === "AGENT"
          ? { agentId: req.user!.id }
          : { buyerId: req.user!.id };

    const inquiries = await prisma.inquiry.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            province: true,
            district: true,
            sector: true,
            cell: true,
            village: true,
            listingType: true,
            price: true,
            currency: true,
          },
        },
        buyer: { select: { id: true, name: true, email: true, phone: true } },
        agent: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      data: inquiries.map((inq) => ({
        ...inq,
        property: {
          ...inq.property,
          price: Number(inq.property.price),
        },
      })),
    });
  } catch (err) {
    return next(err);
  }
});

router.patch(
  "/:id/status",
  authenticate,
  requireRole("AGENT", "ADMIN"),
  async (req, res, next) => {
    try {
      const { status } = statusSchema.parse(req.body);
      const existing = await prisma.inquiry.findUnique({
        where: { id: paramId(req.params.id) },
      });
      if (!existing) {
        return res.status(404).json({ error: "Inquiry not found" });
      }
      if (req.user!.role !== "ADMIN" && existing.agentId !== req.user!.id) {
        return res.status(403).json({ error: "Not allowed" });
      }

      const inquiry = await prisma.inquiry.update({
        where: { id: existing.id },
        data: { status },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              province: true,
              district: true,
              sector: true,
              cell: true,
              village: true,
            },
          },
          buyer: { select: { id: true, name: true, email: true, phone: true } },
          agent: { select: { id: true, name: true, email: true, phone: true } },
        },
      });

      return res.json({ data: inquiry });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
