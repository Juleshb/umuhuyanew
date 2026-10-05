-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('CONTACT_UNLOCK', 'AGENT_SUBSCRIPTION', 'LISTING_FEE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "listingFeePaidAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "agentActiveUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "PaymentKind" NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT NOT NULL,
    "propertyId" TEXT,
    "paidAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactUnlock" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactUnlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_kind_idx" ON "Payment"("kind");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_propertyId_idx" ON "Payment"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "ContactUnlock_paymentId_key" ON "ContactUnlock"("paymentId");

-- CreateIndex
CREATE INDEX "ContactUnlock_userId_idx" ON "ContactUnlock"("userId");

-- CreateIndex
CREATE INDEX "ContactUnlock_propertyId_idx" ON "ContactUnlock"("propertyId");

-- CreateIndex
CREATE INDEX "ContactUnlock_expiresAt_idx" ON "ContactUnlock"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContactUnlock_userId_propertyId_key" ON "ContactUnlock"("userId", "propertyId");

-- CreateIndex
CREATE INDEX "Property_expiresAt_idx" ON "Property"("expiresAt");

-- CreateIndex
CREATE INDEX "User_agentActiveUntil_idx" ON "User"("agentActiveUntil");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactUnlock" ADD CONSTRAINT "ContactUnlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactUnlock" ADD CONSTRAINT "ContactUnlock_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactUnlock" ADD CONSTRAINT "ContactUnlock_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
