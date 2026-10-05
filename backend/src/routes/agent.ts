import { Router } from "express";
import { prisma } from "../lib/prisma";
import { propertyInclude, serializeProperty } from "../lib/property";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

router.get(
  "/properties",
  authenticate,
  requireRole("BUYER", "AGENT", "ADMIN"),
  async (req, res, next) => {
    try {
      const where =
        req.user!.role === "ADMIN"
          ? {}
          : { agentId: req.user!.id };

      const items = await prisma.property.findMany({
        where,
        include: propertyInclude,
        orderBy: { updatedAt: "desc" },
      });

      return res.json({ data: items.map(serializeProperty) });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
