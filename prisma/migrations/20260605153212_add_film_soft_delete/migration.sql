-- AlterTable
ALTER TABLE "Film" ADD COLUMN "deletedAt" DATETIME;

-- CreateIndex
CREATE INDEX "Film_deletedAt_idx" ON "Film"("deletedAt");
