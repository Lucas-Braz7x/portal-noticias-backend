import { ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { PrismaService } from '@/prisma/prisma.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { Article } from '@/modules/articles/domain/entities/article.entity';
import { ArticlesModule } from '@/modules/articles/articles.module';
import { SEARCH_REPOSITORY } from '@/modules/articles/domain/repositories/search.repository';
import { PrismaArticleRepository } from '@/modules/articles/infrastructure/repositories/prisma-article.repository';
import { ArticlesSearchBootstrap } from '@/modules/articles/infrastructure/search/articles-search.bootstrap';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter';
import { getTestPrisma, resetTables } from '../../../helpers/database.helper';
import {
  seedArticleRefs,
  seedAuthor,
  seedCategory,
  seedTag,
} from '../../../helpers/fixtures.helper';

const INGEST_API_KEY = 'test-ingest-key';

const searchMock = {
  index: jest.fn().mockResolvedValue(undefined),
  search: jest.fn(),
  remove: jest.fn(),
};

const ingestPayload = {
  title: 'Artigo ingerido',
  summary: 'Resumo ingerido',
  content: 'Conteúdo ingerido',
  author: 'Maria Silva',
  category: 'Economia',
  tags: ['Eleições'],
  publishedAt: '2026-01-15T10:00:00Z',
};

describe('ArticlesController (integration)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
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
      .overrideProvider(SEARCH_REPOSITORY)
      .useValue(searchMock)
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
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    const prisma = getTestPrisma();
    const repository = new PrismaArticleRepository(
      prisma as unknown as PrismaService,
    );
    const { author, category, tags } = await seedArticleRefs(prisma);
    const publishedAt = new Date('2026-01-01T00:00:00Z');

    for (let index = 0; index < 12; index += 1) {
      const article = Article.create({
        title: `Artigo ${index}`,
        summary: `Resumo ${index}`,
        content: 'Conteúdo completo',
        author,
        category,
        tags,
        publishedAt: new Date(publishedAt.getTime() - index * 60_000),
      });
      await repository.save(article);
    }
  });

  it('GET /api/v1/articles returns paginated published articles with RF01 fields', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/articles',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body) as {
      data: Array<Record<string, unknown>>;
      meta: Record<string, number>;
    };

    expect(body.meta).toEqual({
      page: 1,
      limit: 10,
      total: 12,
      totalPages: 2,
    });
    expect(body.data).toHaveLength(10);
    expect(body.data[0]).toEqual(
      expect.objectContaining({
        slug: expect.any(String),
        title: expect.any(String),
        summary: expect.any(String),
        publishedAt: expect.any(String),
        author: expect.any(String),
        category: expect.any(String),
        tags: expect.any(Array),
      }),
    );
  });

  it('GET /api/v1/articles?page=2&limit=5 returns the second page', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/articles?page=2&limit=5',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body) as {
      data: unknown[];
      meta: Record<string, number>;
    };

    expect(body.data).toHaveLength(5);
    expect(body.meta).toEqual({
      page: 2,
      limit: 5,
      total: 12,
      totalPages: 3,
    });
  });

  it('GET /api/v1/articles?page=0 returns 400', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/articles?page=0',
    });

    expect(response.statusCode).toBe(400);
  });

  it('GET /api/v1/articles?limit=51 returns 400', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/articles?limit=51',
    });

    expect(response.statusCode).toBe(400);
  });

  describe('article detail (RF06)', () => {
    it('GET /api/v1/articles/:slug returns published article with RF06 fields', async () => {
      const listResponse = await app.inject({
        method: 'GET',
        url: '/api/v1/articles?limit=1',
      });
      const listBody = JSON.parse(listResponse.body) as {
        data: Array<{ slug: string }>;
      };
      const slug = listBody.data[0].slug;

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/articles/${slug}`,
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body) as Record<string, unknown>;

      expect(body).toEqual(
        expect.objectContaining({
          slug,
          title: expect.any(String),
          summary: expect.any(String),
          content: 'Conteúdo completo',
          publishedAt: expect.any(String),
          author: expect.any(String),
          category: expect.any(String),
          tags: expect.any(Array),
        }),
      );
    });

    it('GET /api/v1/articles/:slug returns standardized 404 for unknown slug', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/articles/slug-inexistente',
      });

      expect(response.statusCode).toBe(404);

      const body = JSON.parse(response.body) as {
        error: { code: string; message: string; statusCode: number };
      };

      expect(body.error).toEqual({
        code: 'ARTICLE_NOT_FOUND',
        message: 'Artigo não encontrado',
        statusCode: 404,
      });
    });

    it('GET /api/v1/articles/:slug returns 404 for draft article', async () => {
      const prisma = getTestPrisma();
      await resetTables(prisma);

      const repository = new PrismaArticleRepository(
        prisma as unknown as PrismaService,
      );
      const { author, category, tags } = await seedArticleRefs(prisma);
      const draft = Article.create({
        title: 'Rascunho',
        summary: 'Resumo',
        content: 'Conteúdo',
        author,
        category,
        tags,
        slug: 'rascunho',
      });
      await repository.save(draft);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/articles/rascunho',
      });

      expect(response.statusCode).toBe(404);

      const body = JSON.parse(response.body) as {
        error: { code: string; message: string; statusCode: number };
      };

      expect(body.error.code).toBe('ARTICLE_NOT_FOUND');
    });
  });

  describe('category and tag filters (RF04/RF05)', () => {
    beforeEach(async () => {
      const prisma = getTestPrisma();
      await resetTables(prisma);

      const repository = new PrismaArticleRepository(
        prisma as unknown as PrismaService,
      );
      const author = await seedAuthor(prisma);
      const techCategory = await seedCategory(prisma, {
        name: 'Tecnologia',
        slug: 'tecnologia',
      });
      const sportsCategory = await seedCategory(prisma, {
        name: 'Esportes',
        slug: 'esportes',
      });
      const iaTag = await seedTag(prisma, { name: 'IA', slug: 'ia' });
      const futebolTag = await seedTag(prisma, {
        name: 'Futebol',
        slug: 'futebol',
      });
      const publishedAt = new Date('2026-01-01T00:00:00Z');

      await repository.save(
        Article.create({
          title: 'Tech com IA',
          summary: 'Resumo',
          content: 'Conteúdo',
          author,
          category: techCategory,
          tags: [iaTag],
          publishedAt,
        }),
      );
      await repository.save(
        Article.create({
          title: 'Tech com Futebol',
          summary: 'Resumo',
          content: 'Conteúdo',
          author,
          category: techCategory,
          tags: [futebolTag],
          publishedAt,
        }),
      );
      await repository.save(
        Article.create({
          title: 'Esportes com IA',
          summary: 'Resumo',
          content: 'Conteúdo',
          author,
          category: sportsCategory,
          tags: [iaTag],
          publishedAt,
        }),
      );
    });

    it('GET /api/v1/articles?category=tecnologia returns only matching category', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/articles?category=tecnologia',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body) as {
        data: Array<{ title: string }>;
        meta: { total: number };
      };

      expect(body.meta.total).toBe(2);
      expect(body.data.map((item) => item.title)).toEqual(
        expect.arrayContaining(['Tech com IA', 'Tech com Futebol']),
      );
    });

    it('GET /api/v1/articles?tag=ia returns only matching tag', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/articles?tag=ia',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body) as {
        data: Array<{ title: string }>;
        meta: { total: number };
      };

      expect(body.meta.total).toBe(2);
      expect(body.data.map((item) => item.title)).toEqual(
        expect.arrayContaining(['Tech com IA', 'Esportes com IA']),
      );
    });

    it('GET /api/v1/articles?category=tecnologia&tag=ia returns intersection', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/articles?category=tecnologia&tag=ia',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body) as {
        data: Array<{ title: string }>;
        meta: { total: number };
      };

      expect(body.meta.total).toBe(1);
      expect(body.data[0].title).toBe('Tech com IA');
    });

    it('GET /api/v1/articles?category=inexistente returns empty result', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/articles?category=inexistente',
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
  });

  describe('ingestion (RF08)', () => {
    beforeEach(() => {
      searchMock.index.mockClear();
      searchMock.search.mockClear();
      searchMock.remove.mockClear();
    });

    it('POST /api/v1/articles returns 401 without API key', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/articles',
        payload: ingestPayload,
      });

      expect(response.statusCode).toBe(401);
    });

    it('POST /api/v1/articles returns 401 with invalid API key', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/articles',
        headers: { 'x-api-key': 'wrong-key' },
        payload: ingestPayload,
      });

      expect(response.statusCode).toBe(401);
    });

    it('POST /api/v1/articles returns 400 for invalid body', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/articles',
        headers: { 'x-api-key': INGEST_API_KEY },
        payload: { title: '' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('POST /api/v1/articles creates article, reuses author and indexes', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/articles',
        headers: { 'x-api-key': INGEST_API_KEY },
        payload: ingestPayload,
      });

      expect(response.statusCode).toBe(201);

      const body = JSON.parse(response.body) as {
        id: string;
        slug: string;
        title: string;
        author: string;
        category: string;
        tags: string[];
        publishedAt: string;
        content: string;
      };

      expect(body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          title: ingestPayload.title,
          summary: ingestPayload.summary,
          content: ingestPayload.content,
          author: 'Maria Silva',
          category: 'Economia',
          tags: ['Eleições'],
          publishedAt: '2026-01-15T10:00:00.000Z',
        }),
      );

      const prisma = getTestPrisma();
      const persisted = await prisma.article.findUnique({
        where: { id: body.id },
      });
      const authors = await prisma.author.findMany({
        where: { name: 'Maria Silva' },
      });
      const categories = await prisma.category.findMany({
        where: { name: 'Economia' },
      });

      expect(persisted).not.toBeNull();
      expect(authors).toHaveLength(1);
      expect(categories).toHaveLength(1);
      expect(searchMock.index).toHaveBeenCalledTimes(1);
    });

    it('PUT /api/v1/articles/:id updates article and reindexes', async () => {
      const created = await app.inject({
        method: 'POST',
        url: '/api/v1/articles',
        headers: { 'x-api-key': INGEST_API_KEY },
        payload: ingestPayload,
      });
      const createdBody = JSON.parse(created.body) as { id: string };

      searchMock.index.mockClear();

      const response = await app.inject({
        method: 'PUT',
        url: `/api/v1/articles/${createdBody.id}`,
        headers: { 'x-api-key': INGEST_API_KEY },
        payload: { title: 'Título atualizado' },
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body) as {
        id: string;
        title: string;
        slug: string;
      };

      expect(body.id).toBe(createdBody.id);
      expect(body.title).toBe('Título atualizado');
      expect(searchMock.index).toHaveBeenCalledTimes(1);
    });

    it('PUT /api/v1/articles/:id returns 404 for unknown id', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/articles/00000000-0000-4000-8000-000000000000',
        headers: { 'x-api-key': INGEST_API_KEY },
        payload: { title: 'Título' },
      });

      expect(response.statusCode).toBe(404);

      const body = JSON.parse(response.body) as {
        error: { code: string; statusCode: number };
      };

      expect(body.error.code).toBe('ARTICLE_NOT_FOUND');
    });

    it('PUT /api/v1/articles/:id returns 400 for invalid UUID', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/articles/nao-e-uuid',
        headers: { 'x-api-key': INGEST_API_KEY },
        payload: { title: 'Título' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('PUT /api/v1/articles/:id unpublishes and removes from search index', async () => {
      const created = await app.inject({
        method: 'POST',
        url: '/api/v1/articles',
        headers: { 'x-api-key': INGEST_API_KEY },
        payload: ingestPayload,
      });
      const createdBody = JSON.parse(created.body) as { id: string };

      searchMock.index.mockClear();
      searchMock.remove.mockClear();

      const response = await app.inject({
        method: 'PUT',
        url: `/api/v1/articles/${createdBody.id}`,
        headers: { 'x-api-key': INGEST_API_KEY },
        payload: { publishedAt: null },
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body) as { publishedAt: string | null };
      expect(body.publishedAt).toBeNull();
      expect(searchMock.remove).toHaveBeenCalledWith(createdBody.id);
      expect(searchMock.index).not.toHaveBeenCalled();
    });
  });
});
