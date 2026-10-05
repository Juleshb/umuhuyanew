import { Router } from "express";
import { z } from "zod";
import { PaymentKind, PaymentStatus, PropertyStatus, Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authenticate, optionalAuth, requireRole } from "../middleware/auth";
import {
  DURATIONS,
  PRICING,
  addDays,
  isAgentSubscriptionActive,
} from "../lib/billing";
import { paramId } from "../lib/params";
import { env } from "../lib/env";
import {
  dpoChargeTokenMobile,
  dpoCreateToken,
  dpoGetMobilePaymentOptions,
  dpoVerifyToken,
  isDpoConfigured,
  isDpoSandboxToken,
  normalizeRwandaPhone,
} from "../lib/dpo";
import { fulfillPaidPayment, markPaymentPaidById } from "../lib/fulfill-payment";

const router = Router();

function makeReference(kind: PaymentKind) {
  return `UH-${kind.slice(0, 3)}-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

function kindLabel(kind: PaymentKind) {
  switch (kind) {
    case PaymentKind.CONTACT_UNLOCK:
      return "Umuhuza contact unlock (7 days)";
    case PaymentKind.AGENT_SUBSCRIPTION:
      return "Umuhuza agent subscription (30 days)";
    case PaymentKind.LISTING_FEE:
      return "Umuhuza private listing fee (30 days)";
    default:
      return "Umuhuza payment";
  }
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] || "Customer",
    lastName: parts.slice(1).join(" ") || "Umuhuza",
  };
}

router.get("/pricing", (_req, res) => {
  return res.json({
    data: {
      currency: "RWF",
      provider: isDpoConfigured() ? "DPO" : "DEMO",
      contactUnlock: {
        amount: PRICING.CONTACT_UNLOCK,
        durationDays: DURATIONS.CONTACT_UNLOCK_DAYS,
        description:
          "Unlock seller/agent contact and send inquiries for 1 week (includes visiting coordination).",
      },
      agentSubscription: {
        amount: PRICING.AGENT_SUBSCRIPTION,
        durationDays: DURATIONS.AGENT_SUBSCRIPTION_DAYS,
        description: "Activate your agent account for 1 month to list and manage properties.",
      },
      listingFee: {
        amount: PRICING.LISTING_FEE,
        durationDays: DURATIONS.LISTING_FEE_DAYS,
        description:
          "Post one property for 1 month (for people who are not on an active agent plan).",
      },
    },
  });
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const unlocks = await prisma.contactUnlock.findMany({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date() },
      },
      select: { propertyId: true, expiresAt: true },
    });

    return res.json({
      data: {
        agentActive: isAgentSubscriptionActive(user),
        agentActiveUntil: user.agentActiveUntil,
        pricing: PRICING,
        activeUnlocks: unlocks,
        provider: isDpoConfigured() ? "DPO" : "DEMO",
      },
    });
  } catch (err) {
    return next(err);
  }
});

const checkoutSchema = z.object({
  kind: z.nativeEnum(PaymentKind),
  propertyId: z.string().optional(),
});

router.post("/checkout", authenticate, async (req, res, next) => {
  try {
    const body = checkoutSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    let amount = 0;
    let expiresAt: Date | null = null;
    let propertyId: string | null = null;

    if (body.kind === PaymentKind.CONTACT_UNLOCK) {
      if (!body.propertyId) {
        return res.status(400).json({ error: "propertyId is required" });
      }
      const property = await prisma.property.findUnique({
        where: { id: body.propertyId },
      });
      if (!property || property.status !== PropertyStatus.APPROVED) {
        return res.status(404).json({ error: "Property not found" });
      }
      if (property.agentId === user.id) {
        return res.status(400).json({ error: "You already own this listing" });
      }
      const existing = await prisma.contactUnlock.findUnique({
        where: {
          userId_propertyId: { userId: user.id, propertyId: property.id },
        },
      });
      if (existing && existing.expiresAt.getTime() > Date.now()) {
        return res.status(400).json({
          error: "You already have an active unlock for this property",
          expiresAt: existing.expiresAt,
        });
      }
      amount = PRICING.CONTACT_UNLOCK;
      expiresAt = addDays(new Date(), DURATIONS.CONTACT_UNLOCK_DAYS);
      propertyId = property.id;
    }

    if (body.kind === PaymentKind.AGENT_SUBSCRIPTION) {
      if (user.role !== Role.AGENT && user.role !== Role.ADMIN) {
        return res.status(403).json({
          error: "Only agent accounts can buy an agent subscription",
        });
      }
      amount = PRICING.AGENT_SUBSCRIPTION;
      const base =
        user.agentActiveUntil && user.agentActiveUntil.getTime() > Date.now()
          ? user.agentActiveUntil
          : new Date();
      expiresAt = addDays(base, DURATIONS.AGENT_SUBSCRIPTION_DAYS);
    }

    if (body.kind === PaymentKind.LISTING_FEE) {
      if (!body.propertyId) {
        return res.status(400).json({ error: "propertyId is required" });
      }
      const property = await prisma.property.findUnique({
        where: { id: body.propertyId },
      });
      if (!property) return res.status(404).json({ error: "Property not found" });
      if (property.agentId !== user.id && user.role !== Role.ADMIN) {
        return res.status(403).json({ error: "Not your listing" });
      }
      if (user.role === Role.AGENT && isAgentSubscriptionActive(user)) {
        return res.status(400).json({
          error: "Active agents do not need a per-listing fee",
        });
      }
      if (property.listingFeePaidAt && property.expiresAt && property.expiresAt > new Date()) {
        return res.status(400).json({ error: "Listing fee already paid for this property" });
      }
      amount = PRICING.LISTING_FEE;
      expiresAt = addDays(new Date(), DURATIONS.LISTING_FEE_DAYS);
      propertyId = property.id;
    }

    const reference = makeReference(body.kind);
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        kind: body.kind,
        amount,
        currency: "RWF",
        status: PaymentStatus.PENDING,
        reference,
        propertyId,
        expiresAt,
        provider: isDpoConfigured() ? "DPO" : "DEMO",
      },
    });

    let paymentUrl: string | null = null;
    let providerToken: string | null = null;
    let mobileOptions: Awaited<ReturnType<typeof dpoGetMobilePaymentOptions>>["options"] = [];

    if (isDpoConfigured()) {
      const { firstName, lastName } = splitName(user.name);
      const redirectUrl = `${env.CLIENT_URL}/billing/return?paymentId=${payment.id}&ref=${encodeURIComponent(reference)}`;
      const backUrl = `${env.CLIENT_URL}/billing/return?paymentId=${payment.id}&cancelled=1`;

      const dpo = await dpoCreateToken({
        amount,
        currency: "RWF",
        companyRef: reference,
        redirectUrl,
        backUrl,
        description: kindLabel(body.kind),
        customerFirstName: firstName,
        customerLastName: lastName,
        customerEmail: user.email,
        customerPhone: user.phone,
      });

      if (dpo.result !== "000" || !dpo.transToken) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.FAILED },
        });
        return res.status(502).json({
          error: dpo.explanation || "DPO could not create payment session",
          code: "DPO_CREATE_FAILED",
        });
      }

      providerToken = dpo.transToken;
      paymentUrl = dpo.paymentUrl;
      await prisma.payment.update({
        where: { id: payment.id },
        data: { providerToken },
      });

      const mobile = await dpoGetMobilePaymentOptions(dpo.transToken);
      mobileOptions = mobile.options;
    }

    const sandbox = isDpoConfigured() && isDpoSandboxToken();

    return res.status(201).json({
      data: {
        ...payment,
        provider: isDpoConfigured() ? "DPO" : "DEMO",
        providerToken,
      },
      paymentUrl,
      mobileOptions,
      sandbox,
      instructions: {
        title: "Complete payment",
        amount,
        currency: "RWF",
        reference,
        provider: isDpoConfigured() ? "DPO" : "DEMO",
        note: !isDpoConfigured()
          ? "Demo mode: DPO keys not set. Confirm in-app, or add DPO_COMPANY_TOKEN + DPO_SERVICE_TYPE."
          : sandbox
            ? "Sandbox DPO keys do not send a real MoMo popup to your phone. Use live merchant credentials for STK push."
            : "Enter your MoMo number to receive a PIN push on your phone.",
      },
    });
  } catch (err) {
    return next(err);
  }
});

const chargeMobileSchema = z.object({
  phoneNumber: z.string().min(9).max(20),
  mno: z.string().min(1),
  mnoCountry: z.string().min(1),
});

/** In-app MoMo push — ChargeTokenMobile */
router.post("/:id/charge-mobile", authenticate, async (req, res, next) => {
  try {
    const id = paramId(req.params.id);
    const body = chargeMobileSchema.parse(req.body);
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    if (payment.userId !== req.user!.id && req.user!.role !== "ADMIN") {
      return res.status(403).json({ error: "Not allowed" });
    }
    if (payment.status === PaymentStatus.PAID) {
      return res.json({ data: payment, paid: true, message: "Already paid" });
    }
    if (!isDpoConfigured() || payment.provider !== "DPO" || !payment.providerToken) {
      return res.status(400).json({
        error: "Mobile money push is only available when DPO is configured",
        code: "DPO_MOMO_UNAVAILABLE",
      });
    }

    const phoneNumber = normalizeRwandaPhone(body.phoneNumber);
    if (phoneNumber.length < 10) {
      return res.status(400).json({ error: "Enter a valid Rwanda mobile number" });
    }

    const charged = await dpoChargeTokenMobile({
      transToken: payment.providerToken,
      phoneNumber,
      mno: body.mno,
      mnoCountry: body.mnoCountry,
    });

    if (!charged.ok) {
      return res.status(502).json({
        error: charged.explanation || "Could not start mobile money payment",
        code: "DPO_MOMO_FAILED",
        result: charged.code,
      });
    }

    return res.json({
      data: payment,
      paid: charged.code === "001" || charged.code === "000",
      sandbox: isDpoSandboxToken(),
      charge: {
        code: charged.code,
        explanation: charged.explanation,
        redirectOption: charged.redirectOption,
        redirectUrl: charged.redirectUrl,
        instructions:
          charged.instructions ||
          "Shortly, you will receive a push prompt on your phone to enter your MoMo PIN and authorize the payment",
      },
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/:id/confirm", authenticate, async (req, res, next) => {
  try {
    const id = paramId(req.params.id);
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    if (payment.userId !== req.user!.id && req.user!.role !== "ADMIN") {
      return res.status(403).json({ error: "Not allowed" });
    }
    if (payment.status === PaymentStatus.PAID) {
      return res.json({ data: payment, message: "Already paid" });
    }

    // If DPO is configured and this payment has a token, verify with DPO first
    if (payment.provider === "DPO" && payment.providerToken && isDpoConfigured()) {
      const verified = await dpoVerifyToken(payment.providerToken);
      if (!verified.paid) {
        return res.status(402).json({
          error: verified.explanation || "Payment not completed on DPO yet",
          code: "DPO_NOT_PAID",
          result: verified.result,
        });
      }
    } else if (payment.provider === "DPO" && isDpoConfigured()) {
      return res.status(400).json({
        error: "Missing DPO transaction token. Restart checkout.",
      });
    }

    const result = await prisma.$transaction(async (tx) =>
      fulfillPaidPayment(tx, payment)
    );

    return res.json({ data: result });
  } catch (err) {
    return next(err);
  }
});

router.get("/:id/status", authenticate, async (req, res, next) => {
  try {
    const id = paramId(req.params.id);
    let payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    if (payment.userId !== req.user!.id && req.user!.role !== "ADMIN") {
      return res.status(403).json({ error: "Not allowed" });
    }

    if (
      payment.status !== PaymentStatus.PAID &&
      payment.provider === "DPO" &&
      payment.providerToken &&
      isDpoConfigured()
    ) {
      const verified = await dpoVerifyToken(payment.providerToken);
      if (verified.paid) {
        payment = (await markPaymentPaidById(payment.id)) ?? payment;
      }
    }

    return res.json({
      data: {
        id: payment.id,
        status: payment.status,
        kind: payment.kind,
        amount: payment.amount,
        reference: payment.reference,
        provider: payment.provider,
        paidAt: payment.paidAt,
        expiresAt: payment.expiresAt,
        propertyId: payment.propertyId,
      },
    });
  } catch (err) {
    return next(err);
  }
});

/** DPO return helper — verifies token and fulfills when paid */
router.post("/dpo/verify", optionalAuth, async (req, res, next) => {
  try {
    const schema = z.object({
      paymentId: z.string().min(1),
      TransactionToken: z.string().optional(),
      CompanyRef: z.string().optional(),
    });
    const body = schema.parse(req.body);
    const payment = await prisma.payment.findUnique({ where: { id: body.paymentId } });
    if (!payment) return res.status(404).json({ error: "Payment not found" });

    if (req.user && req.user.id !== payment.userId && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Not allowed" });
    }

    if (payment.status === PaymentStatus.PAID) {
      return res.json({ data: payment, paid: true });
    }

    const token = body.TransactionToken || payment.providerToken;
    if (!token || !isDpoConfigured()) {
      return res.status(400).json({ error: "Unable to verify DPO payment" });
    }

    if (body.CompanyRef && body.CompanyRef !== payment.reference) {
      return res.status(400).json({ error: "Payment reference mismatch" });
    }

    const verified = await dpoVerifyToken(token);
    if (!verified.paid) {
      return res.json({
        data: payment,
        paid: false,
        explanation: verified.explanation,
        result: verified.result,
      });
    }

    if (!payment.providerToken) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { providerToken: token, provider: "DPO" },
      });
    }

    const paid = await markPaymentPaidById(payment.id);
    return res.json({ data: paid, paid: true });
  } catch (err) {
    return next(err);
  }
});

router.get(
  "/unlocks/:propertyId",
  authenticate,
  async (req, res, next) => {
    try {
      const propertyId = paramId(req.params.propertyId);
      const unlock = await prisma.contactUnlock.findUnique({
        where: {
          userId_propertyId: {
            userId: req.user!.id,
            propertyId,
          },
        },
      });
      const active = Boolean(unlock && unlock.expiresAt.getTime() > Date.now());
      return res.json({
        data: {
          unlocked: active,
          expiresAt: active ? unlock!.expiresAt : null,
          amount: PRICING.CONTACT_UNLOCK,
          durationDays: DURATIONS.CONTACT_UNLOCK_DAYS,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

router.post(
  "/agent/activate",
  authenticate,
  requireRole("AGENT", "ADMIN"),
  async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const base =
        user.agentActiveUntil && user.agentActiveUntil.getTime() > Date.now()
          ? user.agentActiveUntil
          : new Date();
      const expiresAt = addDays(base, DURATIONS.AGENT_SUBSCRIPTION_DAYS);
      const payment = await prisma.payment.create({
        data: {
          userId: user.id,
          kind: PaymentKind.AGENT_SUBSCRIPTION,
          amount: PRICING.AGENT_SUBSCRIPTION,
          currency: "RWF",
          status: PaymentStatus.PENDING,
          reference: makeReference(PaymentKind.AGENT_SUBSCRIPTION),
          expiresAt,
          provider: isDpoConfigured() ? "DPO" : "DEMO",
        },
      });
      return res.status(201).json({
        data: payment,
        instructions: {
          amount: PRICING.AGENT_SUBSCRIPTION,
          currency: "RWF",
          reference: payment.reference,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
