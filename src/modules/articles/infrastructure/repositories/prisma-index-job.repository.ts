import { Injectable } from '@nestjs/common';
import { IndexJobAction as PrismaIndexJobAction } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  IIndexJobRepository,
  IndexJobAction,
  IndexJobRecord,
} from '../../domain/repositories/index-job.repository';

interface ClaimedIndexJobRow {
  id: string;
  article_id: string;
  action: PrismaIndexJobAction;
  status: string;
  attempts: number;
  last_error: string | null;
  created_at: Date;
  processed_at: Date | null;
}

@Injectable()
export class PrismaIndexJobRepository implements IIndexJobRepository {
  constructor(private readonly prisma: PrismaService) {}

  async enqueue(articleId: string, action: IndexJobAction): Promise<void> {
    await this.prisma.indexJob.create({
      data: {
        articleId,
        action,
        status: 'PENDING',
      },
    });
  }

  async claimNextBatch(limit: number): Promise<IndexJobRecord[]> {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<ClaimedIndexJobRow[]>`
        SELECT id, article_id, action, status, attempts, last_error, created_at, processed_at
        FROM index_jobs
        WHERE status = 'PENDING'
        ORDER BY created_at ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      `;

      if (rows.length === 0) {
        return [];
      }

      const ids = rows.map((row) => row.id);

      await tx.indexJob.updateMany({
        where: { id: { in: ids } },
        data: {
          status: 'PROCESSING',
          claimedAt: new Date(),
        },
      });

      return rows.map((row) => ({
        ...this.toRecord(row),
        status: 'PROCESSING' as const,
      }));
    });
  }

  async recoverStaleJobs(staleAfterMs: number): Promise<number> {
    const threshold = new Date(Date.now() - staleAfterMs);

    const result = await this.prisma.indexJob.updateMany({
      where: {
        status: 'PROCESSING',
        OR: [{ claimedAt: null }, { claimedAt: { lt: threshold } }],
      },
      data: {
        status: 'PENDING',
        claimedAt: null,
      },
    });

    return result.count;
  }

  async markCompleted(id: string): Promise<void> {
    await this.prisma.indexJob.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
        lastError: null,
      },
    });
  }

  async markFailed(
    id: string,
    error: string,
    maxAttempts: number,
  ): Promise<void> {
    const job = await this.prisma.indexJob.findUnique({ where: { id } });

    if (!job) {
      return;
    }

    const attempts = job.attempts + 1;
    const hasExceededAttempts = attempts >= maxAttempts;

    await this.prisma.indexJob.update({
      where: { id },
      data: {
        status: hasExceededAttempts ? 'FAILED' : 'PENDING',
        attempts,
        lastError: error,
        processedAt: hasExceededAttempts ? new Date() : null,
      },
    });
  }

  private toRecord(row: ClaimedIndexJobRow): IndexJobRecord {
    return {
      id: row.id,
      articleId: row.article_id,
      action: row.action,
      status: row.status as IndexJobRecord['status'],
      attempts: row.attempts,
      lastError: row.last_error,
      createdAt: row.created_at,
      processedAt: row.processed_at,
    };
  }
}
