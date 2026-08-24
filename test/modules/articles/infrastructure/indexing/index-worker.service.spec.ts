import { ConfigService } from '@nestjs/config';
import { Article } from '@/modules/articles/domain/entities/article.entity';
import { IndexWorkerService } from '@/modules/articles/infrastructure/indexing/index-worker.service';
import { ArticleMapper } from '@/modules/articles/infrastructure/mappers/article.mapper';
import { IArticleRepository } from '@/modules/articles/domain/repositories/article.repository';
import { IIndexJobRepository } from '@/modules/articles/domain/repositories/index-job.repository';
import { ISearchRepository } from '@/modules/articles/domain/repositories/search.repository';
import { FrontendCacheInvalidationService } from '@/shared/infrastructure/cache/frontend-cache-invalidation.service';

const author = { id: 'author-1', name: 'Maria Silva' };
const category = { id: 'cat-1', name: 'Política', slug: 'politica' };
const tags = [{ id: 'tag-1', name: 'economia', slug: 'economia' }];

function createPublishedArticle() {
  return Article.create({
    title: 'Como a IA está mudando o jornalismo',
    summary: 'Resumo',
    content: 'Conteúdo',
    author,
    category,
    tags,
    slug: 'como-a-ia-esta-mudando-o-jornalismo',
    publishedAt: new Date('2026-01-15T10:00:00Z'),
  });
}

describe('IndexWorkerService', () => {
  let indexJobs: jest.Mocked<IIndexJobRepository>;
  let articles: jest.Mocked<IArticleRepository>;
  let search: jest.Mocked<ISearchRepository>;
  let config: jest.Mocked<ConfigService>;
  let frontendCacheInvalidation: jest.Mocked<FrontendCacheInvalidationService>;
  let worker: IndexWorkerService;

  beforeEach(() => {
    indexJobs = {
      enqueue: jest.fn(),
      claimNextBatch: jest.fn(),
      recoverStaleJobs: jest.fn().mockResolvedValue(0),
      markCompleted: jest.fn(),
      markFailed: jest.fn(),
    };

    articles = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findByIds: jest.fn(),
      findMany: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      existsBySlug: jest.fn(),
    };

    search = {
      index: jest.fn(),
      search: jest.fn(),
      remove: jest.fn(),
    };

    config = {
      get: jest.fn((key: string, defaultValue?: unknown) => defaultValue),
    } as unknown as jest.Mocked<ConfigService>;

    frontendCacheInvalidation = {
      invalidate: jest.fn(),
      isConfigured: jest.fn(),
    } as unknown as jest.Mocked<FrontendCacheInvalidationService>;

    worker = new IndexWorkerService(
      indexJobs,
      articles,
      search,
      config,
      frontendCacheInvalidation,
    );
  });

  it('recovers stale jobs before processing on start', async () => {
    indexJobs.recoverStaleJobs.mockResolvedValue(2);
    indexJobs.claimNextBatch.mockResolvedValue([]);

    const startPromise = worker.start();

    await new Promise((resolve) => setTimeout(resolve, 0));
    worker.stop();
    await startPromise;

    expect(indexJobs.recoverStaleJobs).toHaveBeenCalledWith(60_000);
  });

  it('processes INDEX job and marks it completed', async () => {
    const article = createPublishedArticle();
    const job = {
      id: 'job-1',
      articleId: article.id,
      action: 'INDEX' as const,
      status: 'PROCESSING' as const,
      attempts: 0,
      lastError: null,
      createdAt: new Date(),
      processedAt: null,
    };

    indexJobs.claimNextBatch.mockResolvedValue([job]);
    articles.findById.mockResolvedValue(article);
    search.index.mockResolvedValue(undefined);
    indexJobs.markCompleted.mockResolvedValue(undefined);

    const processed = await worker.processPendingBatch();

    expect(processed).toBe(1);
    expect(search.index).toHaveBeenCalledWith(
      ArticleMapper.toSearchDocument(article),
    );
    expect(indexJobs.markCompleted).toHaveBeenCalledWith('job-1');
    expect(frontendCacheInvalidation.invalidate).toHaveBeenCalled();
  });

  it('processes REMOVE job', async () => {
    const article = createPublishedArticle();
    const job = {
      id: 'job-2',
      articleId: article.id,
      action: 'REMOVE' as const,
      status: 'PROCESSING' as const,
      attempts: 0,
      lastError: null,
      createdAt: new Date(),
      processedAt: null,
    };

    indexJobs.claimNextBatch.mockResolvedValue([job]);
    articles.findById.mockResolvedValue(article);
    search.remove.mockResolvedValue(undefined);

    await worker.processPendingBatch();

    expect(search.remove).toHaveBeenCalledWith(article.id);
    expect(search.index).not.toHaveBeenCalled();
  });

  it('marks job as failed when article is missing', async () => {
    const job = {
      id: 'job-3',
      articleId: 'missing',
      action: 'INDEX' as const,
      status: 'PROCESSING' as const,
      attempts: 0,
      lastError: null,
      createdAt: new Date(),
      processedAt: null,
    };

    indexJobs.claimNextBatch.mockResolvedValue([job]);
    articles.findById.mockResolvedValue(null);

    await worker.processPendingBatch();

    expect(indexJobs.markFailed).toHaveBeenCalledWith(
      'job-3',
      expect.stringContaining('Article not found'),
      5,
    );
    expect(frontendCacheInvalidation.invalidate).not.toHaveBeenCalled();
  });
});
