-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "provider" TEXT,
ADD COLUMN     "providerToken" TEXT;

-- CreateIndex
CREATE INDEX "Payment_providerToken_idx" ON "Payment"("providerToken");
