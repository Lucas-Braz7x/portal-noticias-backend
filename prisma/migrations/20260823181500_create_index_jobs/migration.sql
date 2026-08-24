-- CreateEnum
CREATE TYPE "IndexJobAction" AS ENUM ('INDEX', 'REMOVE');

-- CreateEnum
CREATE TYPE "IndexJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "index_jobs" (
    "id" UUID NOT NULL,
    "article_id" UUID NOT NULL,
    "action" "IndexJobAction" NOT NULL,
    "status" "IndexJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(6),

    CONSTRAINT "index_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "index_jobs_status_created_at_idx" ON "index_jobs"("status", "created_at");
