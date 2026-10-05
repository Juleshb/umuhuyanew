-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "cell" TEXT,
ADD COLUMN     "village" TEXT;

-- CreateIndex
CREATE INDEX "Property_sector_idx" ON "Property"("sector");

-- CreateIndex
CREATE INDEX "Property_cell_idx" ON "Property"("cell");
