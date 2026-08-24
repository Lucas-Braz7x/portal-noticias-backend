import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ArticleNotFoundException } from '../../domain/exceptions/article-not-found.exception';
import {
  ARTICLE_REPOSITORY,
  IArticleRepository,
} from '../../domain/repositories/article.repository';
import {
  INDEX_JOB_REPOSITORY,
  IIndexJobRepository,
  IndexJobRecord,
} from '../../domain/repositories/index-job.repository';
import {
  ISearchRepository,
  SEARCH_REPOSITORY,
} from '../../domain/repositories/search.repository';
import { ArticleMapper } from '../mappers/article.mapper';
import { FrontendCacheInvalidationService } from '../../../../shared/infrastructure/cache/frontend-cache-invalidation.service';
import {
  getWorkerBatchSize,
  getWorkerMaxAttempts,
  getWorkerPollMs,
  getWorkerStaleMs,
} from '../../../../shared/config/indexing.config';

@Injectable()
export class IndexWorkerService {
  private readonly logger = new Logger(IndexWorkerService.name);
  private running = false;

  constructor(
    @Inject(INDEX_JOB_REPOSITORY)
    private readonly indexJobs: IIndexJobRepository,
    @Inject(ARTICLE_REPOSITORY)
    private readonly articles: IArticleRepository,
    @Inject(SEARCH_REPOSITORY)
    private readonly search: ISearchRepository,
    private readonly config: ConfigService,
    private readonly frontendCacheInvalidation: FrontendCacheInvalidationService,
  ) {}

  async start(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;

    const recovered = await this.indexJobs.recoverStaleJobs(
      getWorkerStaleMs(this.config),
    );

    if (recovered > 0) {
      this.logger.warn(`Recovered ${recovered} stale index job(s)`);
    }

    this.logger.log('Index worker started');

    while (this.running) {
      await this.processPendingBatch();
      await this.sleep(getWorkerPollMs(this.config));
    }
  }

  stop(): void {
    this.running = false;
    this.logger.log('Index worker stopping');
  }

  async processPendingBatch(): Promise<number> {
    const jobs = await this.indexJobs.claimNextBatch(
      getWorkerBatchSize(this.config),
    );

    for (const job of jobs) {
      await this.processJob(job);
    }

    return jobs.length;
  }

  private async processJob(job: IndexJobRecord): Promise<void> {
    try {
      const article = await this.articles.findById(job.articleId);

      if (!article) {
        throw new ArticleNotFoundException(job.articleId);
      }

      if (job.action === 'INDEX') {
        if (!article.isPublished()) {
          await this.search.remove(article.id);
        } else {
          await this.search.index(ArticleMapper.toSearchDocument(article));
        }
      } else {
        await this.search.remove(article.id);
      }

      await this.indexJobs.markCompleted(job.id);
      this.frontendCacheInvalidation.invalidate();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown indexing error';

      await this.indexJobs.markFailed(
        job.id,
        message,
        getWorkerMaxAttempts(this.config),
      );

      this.logger.warn(
        `Failed to process index job ${job.id} for article ${job.articleId}: ${message}`,
      );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
