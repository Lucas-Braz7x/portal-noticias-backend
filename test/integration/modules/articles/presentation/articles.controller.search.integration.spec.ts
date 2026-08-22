import { ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Client } from '@opensearch-project/opensearch';
import { ArticlesModule } from '@/modules/articles/articles.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { OpenSearchSearchRepository } from '@/modules/articles/infrastructure/repositories/opensearch-search.repository';
import { ARTICLES_INDEX } from '@/modules/articles/infrastructure/opensearch/articles-index.constants';
import { ArticlesSearchBootstrap } from '@/modules/articles/infrastructure/search/articles-search.bootstrap';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter';
import {
  clearOpenSearchIndex,
  getOpenSearchNode,
  isOpenSearchAvailable,
} from '../../../helpers/opensearch.helper';

const INGEST_API_KEY = 'test-ingest-key';

async function createPublishedArticle(
  app: NestFastifyApplication,
  overrides: {
    title?: string;
    category?: string;
    tags?: string[];
    publishedAt?: string;
  } = {},
): Promise<{ id: string; slug: string; title: string }> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/articles',
    headers: { 'x-api-key': INGEST_API_KEY },
    payload: {
      title: overrides.title ?? 'Blockchain revoluciona finanças',
      summary: 'Resumo sobre inovação financeira',
      content: 'Conteúdo completo sobre blockchain',
      author: 'Maria Silva',
      category: overrides.category ?? 'Tecnologia',
      tags: overrides.tags ?? ['blockchain'],
      publishedAt: overrides.publishedAt ?? '2026-01-15T10:00:00Z',
    },
  });

  expect(response.statusCode).toBe(201);
  return JSON.parse(response.body) as {
    id: string;
    slug: string;
    title: string;
  };
}

describe('ArticlesController search (integration)', () => {
  let app: NestFastifyApplication;
  let openSearchClient: Client;

  beforeAll(async () => {
    const openSearchAvailable = await isOpenSearchAvailable();

    if (!openSearchAvailable) {
      throw new Error(
        'OpenSearch is not available. Start it with: docker compose up -d opensearch',
      );
    }

    process.env.INGEST_API_KEY = INGEST_API_KEY;

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        ArticlesModule,
      ],
    })
      .overrideProvider(ArticlesSearchBootstrap)
      .useValue({ onModuleInit: async () => undefined })
      .compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    openSearchClient = new Client({ node: getOpenSearchNode() });
    const repository = app.get(OpenSearchSearchRepository);

    try {
      await openSearchClient.indices.delete({ index: ARTICLES_INDEX });
    } catch {
      // index may not exist yet
    }

    await repository.ensureIndex();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await clearOpenSearchIndex(openSearchClient);
  });

  it('GET /api/v1/articles?q= returns matching published articles', async () => {
    const article = await createPublishedArticle(app, {
      title: 'Blockchain revoluciona finanças',
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/articles?q=blockchain',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body) as {
      data: Array<{ slug: string; title: string }>;
      meta: { total: number };
    };

    expect(body.meta.total).toBeGreaterThanOrEqual(1);
    expect(body.data.map((item) => item.slug)).toContain(article.slug);
    expect(body.data[0]).toEqual(
      expect.objectContaining({
        slug: article.slug,
        title: article.title,
        summary: expect.any(String),
        author: 'Maria Silva',
        category: { name: 'Tecnologia', slug: 'tecnologia' },
        tags: [{ name: 'blockchain', slug: 'blockchain' }],
        publishedAt: expect.any(String),
      }),
    );
  });

  it('GET /api/v1/articles?q= returns empty result for no matches', async () => {
    await createPublishedArticle(app);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/articles?q=termo-inexistente-xyz',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body) as {
      data: unknown[];
      meta: { total: number; totalPages: number };
    };

    expect(body.data).toEqual([]);
    expect(body.meta.total).toBe(0);
    expect(body.meta.totalPages).toBe(0);
  });

  it('GET /api/v1/articles?q= paginates search results', async () => {
    for (let index = 0; index < 6; index += 1) {
      await createPublishedArticle(app, {
        title: `Paginação blockchain artigo ${index}`,
      });
    }

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/articles?q=blockchain&page=2&limit=5',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body) as {
      data: unknown[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    };

    expect(body.meta).toEqual({
      page: 2,
      limit: 5,
      total: 6,
      totalPages: 2,
    });
    expect(body.data).toHaveLength(1);
  });

  it('GET /api/v1/articles?q= filters by category slug', async () => {
    await createPublishedArticle(app, {
      title: 'Inovação digital exclusiva',
      category: 'Tecnologia',
    });
    await createPublishedArticle(app, {
      title: 'Inovação digital exclusiva',
      category: 'Esportes',
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/articles?q=inovação+digital+exclusiva&category=tecnologia',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body) as {
      data: Array<{ category: { name: string } }>;
      meta: { total: number };
    };

    expect(body.meta.total).toBe(1);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].category.name).toBe('Tecnologia');
  });

  it('GET /api/v1/articles?q= excludes draft articles', async () => {
    const draftResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/articles',
      headers: { 'x-api-key': INGEST_API_KEY },
      payload: {
        title: 'Rascunho exclusivo blockchain',
        summary: 'Resumo',
        content: 'Conteúdo',
        author: 'Maria Silva',
        category: 'Tecnologia',
        tags: ['blockchain'],
      },
    });

    expect(draftResponse.statusCode).toBe(201);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/articles?q=rascunho+exclusivo+blockchain',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body) as { data: unknown[] };
    expect(body.data).toEqual([]);
  });

  it('GET /api/v1/articles?q= excludes article after unpublish', async () => {
    const article = await createPublishedArticle(app, {
      title: 'Artigo para despublicar blockchain',
    });

    const beforeUnpublish = await app.inject({
      method: 'GET',
      url: '/api/v1/articles?q=despublicar+blockchain',
    });
    const beforeBody = JSON.parse(beforeUnpublish.body) as {
      data: Array<{ slug: string }>;
    };
    expect(beforeBody.data.map((item) => item.slug)).toContain(article.slug);

    const unpublishResponse = await app.inject({
      method: 'PUT',
      url: `/api/v1/articles/${article.id}`,
      headers: { 'x-api-key': INGEST_API_KEY },
      payload: { publishedAt: null },
    });
    expect(unpublishResponse.statusCode).toBe(200);

    const afterUnpublish = await app.inject({
      method: 'GET',
      url: '/api/v1/articles?q=despublicar+blockchain',
    });
    const afterBody = JSON.parse(afterUnpublish.body) as { data: unknown[] };
    expect(afterBody.data).toEqual([]);
  });
});
