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
import { PrismaArticleRepository } from '@/modules/articles/infrastructure/repositories/prisma-article.repository';
import { ArticlesSearchBootstrap } from '@/modules/articles/infrastructure/search/articles-search.bootstrap';
import { getTestPrisma, resetTables } from '../../../helpers/database.helper';
import {
  seedArticleRefs,
  seedAuthor,
  seedCategory,
  seedTag,
} from '../../../helpers/fixtures.helper';

describe('ArticlesController (integration)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
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
});
