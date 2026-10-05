import { Router } from "express";
import { prisma } from "../lib/prisma";
import { activeBannerWhere, serializeBanner } from "../lib/banner";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const banners = await prisma.banner.findMany({
      where: activeBannerWhere(),
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return res.json({ data: banners.map(serializeBanner) });
  } catch (err) {
    return next(err);
  }
});

export default router;
