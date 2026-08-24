import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Client } from '@opensearch-project/opensearch';
import { PrismaModule } from '@/prisma/prisma.module';
import { ArticlesModule } from '@/modules/articles/articles.module';
import { ARTICLE_REPOSITORY } from '@/modules/articles/domain/repositories/article.repository';
import { INDEX_JOB_REPOSITORY } from '@/modules/articles/domain/repositories/index-job.repository';
import { SEARCH_REPOSITORY } from '@/modules/articles/domain/repositories/search.repository';
import { PrismaArticleRepository } from '@/modules/articles/infrastructure/repositories/prisma-article.repository';
import { PrismaIndexJobRepository } from '@/modules/articles/infrastructure/repositories/prisma-index-job.repository';
import { IndexWorkerService } from '@/modules/articles/infrastructure/indexing/index-worker.service';
import { OpenSearchSearchRepository } from '@/modules/articles/infrastructure/repositories/opensearch-search.repository';
import { ARTICLES_INDEX } from '@/modules/articles/infrastructure/opensearch/articles-index.constants';
import { ArticlesSearchBootstrap } from '@/modules/articles/infrastructure/search/articles-search.bootstrap';
import { FrontendCacheInvalidationService } from '@/shared/infrastructure/cache/frontend-cache-invalidation.service';
import {
  clearOpenSearchIndex,
  getOpenSearchNode,
  isOpenSearchAvailable,
} from '../../../../helpers/opensearch.helper';
import {
  getTestPrisma,
  resetTables,
} from '../../../../helpers/database.helper';
import { seedArticleRefs } from '../../../../helpers/fixtures.helper';
import { Article } from '@/modules/articles/domain/entities/article.entity';

describe('IndexWorkerService with OpenSearch (integration)', () => {
  let worker: IndexWorkerService;
  let articleRepository: PrismaArticleRepository;
  let indexJobRepository: PrismaIndexJobRepository;
  let searchRepository: OpenSearchSearchRepository;
  let client: Client;
  let openSearchAvailable = false;

  beforeAll(async () => {
    openSearchAvailable = await isOpenSearchAvailable();

    if (!openSearchAvailable) {
      return;
    }
    process.env.OPENSEARCH_ENABLED = 'true';
    process.env.OPENSEARCH_NODE = getOpenSearchNode();

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        ArticlesModule,
      ],
    })
      .overrideProvider(ArticlesSearchBootstrap)
      .useValue({ onModuleInit: async () => undefined })
      .overrideProvider(FrontendCacheInvalidationService)
      .useValue({ invalidate: jest.fn(), isConfigured: jest.fn() })
      .compile();

    worker = moduleRef.get(IndexWorkerService);
    articleRepository = moduleRef.get(ARTICLE_REPOSITORY);
    indexJobRepository = moduleRef.get(INDEX_JOB_REPOSITORY);
    searchRepository = moduleRef.get(SEARCH_REPOSITORY);
    client = new Client({ node: getOpenSearchNode() });
  });

  beforeEach(async () => {
    if (!openSearchAvailable) {
      return;
    }

    await resetTables(getTestPrisma());
    await clearOpenSearchIndex(client);
    await searchRepository.ensureIndex();
  });

  it('processes enqueued INDEX job and makes article searchable', async () => {
    if (!openSearchAvailable) {
      return;
    }
    const prisma = getTestPrisma();
    const { author, category, tags } = await seedArticleRefs(prisma);
    const article = Article.create({
      title: 'Blockchain revoluciona finanças',
      summary: 'Resumo sobre blockchain',
      content: 'Conteúdo completo sobre blockchain',
      author,
      category,
      tags,
      publishedAt: new Date('2026-01-15T10:00:00Z'),
    });
    const saved = await articleRepository.save(article);

    await indexJobRepository.enqueue(saved.id, 'INDEX');

    const processed = await worker.processPendingBatch();

    expect(processed).toBe(1);

    const searchResult = await searchRepository.search({
      q: 'blockchain',
      page: 1,
      limit: 10,
    });

    expect(searchResult.ids).toContain(saved.id);

    const job = await prisma.indexJob.findFirstOrThrow();
    expect(job.status).toBe('COMPLETED');
  });

  it('processes REMOVE job and deletes document from index', async () => {
    if (!openSearchAvailable) {
      return;
    }
    const prisma = getTestPrisma();
    const { author, category, tags } = await seedArticleRefs(prisma);
    const article = Article.create({
      title: 'IA generativa no jornalismo',
      summary: 'Resumo',
      content: 'Conteúdo',
      author,
      category,
      tags,
      publishedAt: new Date('2026-01-15T10:00:00Z'),
    });
    const saved = await articleRepository.save(article);

    await searchRepository.index({
      id: saved.id,
      slug: saved.slug,
      title: saved.title,
      summary: saved.summary,
      content: saved.content,
      author: saved.author.name,
      category: saved.category.slug,
      tags: saved.tags.map((tag) => tag.slug),
      publishedAt: saved.publishedAt!.toISOString(),
    });

    await indexJobRepository.enqueue(saved.id, 'REMOVE');
    await worker.processPendingBatch();

    const response = await client.search({
      index: ARTICLES_INDEX,
      body: { query: { term: { _id: saved.id } } },
    });

    expect(response.body.hits.hits).toHaveLength(0);

    const job = await prisma.indexJob.findFirstOrThrow();
    expect(job.status).toBe('COMPLETED');
  });
});
