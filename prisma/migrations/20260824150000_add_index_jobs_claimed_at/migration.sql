-- AlterTable
ALTER TABLE "index_jobs" ADD COLUMN "claimed_at" TIMESTAMPTZ(6);

-- Recover jobs left in PROCESSING after a crash (no claim timestamp)
UPDATE "index_jobs"
SET "status" = 'PENDING'
WHERE "status" = 'PROCESSING';
