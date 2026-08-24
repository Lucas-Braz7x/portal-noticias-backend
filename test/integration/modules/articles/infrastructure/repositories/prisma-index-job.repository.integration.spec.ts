import { PrismaService } from '@/prisma/prisma.service';
import { PrismaIndexJobRepository } from '@/modules/articles/infrastructure/repositories/prisma-index-job.repository';
import {
  getTestPrisma,
  resetTables,
} from '../../../../helpers/database.helper';

describe('PrismaIndexJobRepository (integration)', () => {
  let repository: PrismaIndexJobRepository;

  beforeEach(async () => {
    repository = new PrismaIndexJobRepository(
      getTestPrisma() as unknown as PrismaService,
    );
    await resetTables(getTestPrisma());
  });

  it('enqueue creates a pending INDEX job', async () => {
    const articleId = '00000000-0000-4000-8000-000000000001';

    await repository.enqueue(articleId, 'INDEX');

    const jobs = await getTestPrisma().indexJob.findMany();
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      articleId,
      action: 'INDEX',
      status: 'PENDING',
      attempts: 0,
    });
  });

  it('claimNextBatch returns pending jobs and marks them as processing', async () => {
    const articleId = '00000000-0000-4000-8000-000000000002';
    await repository.enqueue(articleId, 'REMOVE');

    const claimed = await repository.claimNextBatch(5);

    expect(claimed).toHaveLength(1);
    expect(claimed[0]).toMatchObject({
      articleId,
      action: 'REMOVE',
      status: 'PROCESSING',
    });

    const persisted = await getTestPrisma().indexJob.findFirstOrThrow();
    expect(persisted.status).toBe('PROCESSING');
  });

  it('markCompleted updates job status', async () => {
    await repository.enqueue('00000000-0000-4000-8000-000000000003', 'INDEX');
    const [job] = await repository.claimNextBatch(1);

    await repository.markCompleted(job.id);

    const persisted = await getTestPrisma().indexJob.findFirstOrThrow();
    expect(persisted.status).toBe('COMPLETED');
    expect(persisted.processedAt).not.toBeNull();
  });

  it('recoverStaleJobs resets processing jobs claimed too long ago', async () => {
    const articleId = '00000000-0000-4000-8000-000000000005';
    await repository.enqueue(articleId, 'INDEX');
    const [job] = await repository.claimNextBatch(1);

    const staleClaimedAt = new Date(Date.now() - 120_000);
    await getTestPrisma().indexJob.update({
      where: { id: job.id },
      data: { claimedAt: staleClaimedAt },
    });

    const recovered = await repository.recoverStaleJobs(60_000);

    expect(recovered).toBe(1);

    const persisted = await getTestPrisma().indexJob.findFirstOrThrow();
    expect(persisted.status).toBe('PENDING');
    expect(persisted.claimedAt).toBeNull();
  });

  it('recoverStaleJobs leaves recently claimed processing jobs untouched', async () => {
    await repository.enqueue('00000000-0000-4000-8000-000000000006', 'INDEX');
    await repository.claimNextBatch(1);

    const recovered = await repository.recoverStaleJobs(60_000);

    expect(recovered).toBe(0);

    const persisted = await getTestPrisma().indexJob.findFirstOrThrow();
    expect(persisted.status).toBe('PROCESSING');
  });

  it('markFailed requeues job until max attempts', async () => {
    await repository.enqueue('00000000-0000-4000-8000-000000000004', 'INDEX');
    const [job] = await repository.claimNextBatch(1);

    await repository.markFailed(job.id, 'boom', 3);

    const first = await getTestPrisma().indexJob.findFirstOrThrow();
    expect(first.status).toBe('PENDING');
    expect(first.attempts).toBe(1);
    expect(first.lastError).toBe('boom');

    await getTestPrisma().indexJob.update({
      where: { id: job.id },
      data: { status: 'PROCESSING', attempts: 2 },
    });
    await repository.markFailed(job.id, 'boom again', 3);

    const failed = await getTestPrisma().indexJob.findFirstOrThrow();
    expect(failed.status).toBe('FAILED');
    expect(failed.attempts).toBe(3);
  });
});
