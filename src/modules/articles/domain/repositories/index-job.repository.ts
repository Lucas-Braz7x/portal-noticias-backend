export type IndexJobAction = 'INDEX' | 'REMOVE';

export type IndexJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface IndexJobRecord {
  id: string;
  articleId: string;
  action: IndexJobAction;
  status: IndexJobStatus;
  attempts: number;
  lastError: string | null;
  createdAt: Date;
  processedAt: Date | null;
}

export const INDEX_JOB_REPOSITORY = Symbol('INDEX_JOB_REPOSITORY');

export interface IIndexJobRepository {
  enqueue(articleId: string, action: IndexJobAction): Promise<void>;
  claimNextBatch(limit: number): Promise<IndexJobRecord[]>;
  recoverStaleJobs(staleAfterMs: number): Promise<number>;
  markCompleted(id: string): Promise<void>;
  markFailed(id: string, error: string, maxAttempts: number): Promise<void>;
}
