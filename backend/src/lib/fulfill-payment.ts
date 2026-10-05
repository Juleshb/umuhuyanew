import { PaymentKind, PaymentStatus, PropertyStatus, Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { DURATIONS, addDays } from "./billing";

type Tx = Prisma.TransactionClient;

export async function fulfillPaidPayment(
  tx: Tx,
  payment: {
    id: string;
    userId: string;
    kind: PaymentKind;
    propertyId: string | null;
    expiresAt: Date | null;
  }
) {
  const now = new Date();

  const paid = await tx.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.PAID,
      paidAt: now,
    },
  });

  if (payment.kind === PaymentKind.CONTACT_UNLOCK && payment.propertyId) {
    const expiresAt = payment.expiresAt ?? addDays(now, DURATIONS.CONTACT_UNLOCK_DAYS);
    await tx.contactUnlock.upsert({
      where: {
        userId_propertyId: {
          userId: payment.userId,
          propertyId: payment.propertyId,
        },
      },
      create: {
        userId: payment.userId,
        propertyId: payment.propertyId,
        paymentId: payment.id,
        expiresAt,
      },
      update: {
        paymentId: payment.id,
        expiresAt,
      },
    });
  }

  if (payment.kind === PaymentKind.AGENT_SUBSCRIPTION) {
    const user = await tx.user.findUnique({ where: { id: payment.userId } });
    const base =
      user?.agentActiveUntil && user.agentActiveUntil.getTime() > now.getTime()
        ? user.agentActiveUntil
        : now;
    const until = addDays(base, DURATIONS.AGENT_SUBSCRIPTION_DAYS);
    await tx.user.update({
      where: { id: payment.userId },
      data: { agentActiveUntil: until },
    });
    await tx.property.updateMany({
      where: {
        agentId: payment.userId,
        status: {
          in: [PropertyStatus.APPROVED, PropertyStatus.PENDING, PropertyStatus.DRAFT],
        },
      },
      data: { expiresAt: until },
    });
    await tx.payment.update({
      where: { id: payment.id },
      data: { expiresAt: until },
    });
  }

  if (payment.kind === PaymentKind.LISTING_FEE && payment.propertyId) {
    const expiresAt = addDays(now, DURATIONS.LISTING_FEE_DAYS);
    await tx.property.update({
      where: { id: payment.propertyId },
      data: {
        listingFeePaidAt: now,
        expiresAt,
      },
    });
    await tx.payment.update({
      where: { id: payment.id },
      data: { expiresAt },
    });
  }

  return paid;
}

export async function markPaymentPaidById(paymentId: string) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return null;
    if (payment.status === PaymentStatus.PAID) return payment;
    return fulfillPaidPayment(tx, payment);
  });
}
