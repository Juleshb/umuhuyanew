-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "kicker" TEXT NOT NULL DEFAULT 'Ad',
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "ctaLabel" TEXT NOT NULL DEFAULT 'Learn more',
    "href" TEXT,
    "imageUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Banner_isActive_sortOrder_idx" ON "Banner"("isActive", "sortOrder");
