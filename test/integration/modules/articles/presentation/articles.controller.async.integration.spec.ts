import { ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { PrismaModule } from '@/prisma/prisma.module';
import { ArticlesModule } from '@/modules/articles/articles.module';
import { SEARCH_REPOSITORY } from '@/modules/articles/domain/repositories/search.repository';
import { ArticlesSearchBootstrap } from '@/modules/articles/infrastructure/search/articles-search.bootstrap';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter';
import { getTestPrisma, resetTables } from '../../../helpers/database.helper';

const INGEST_API_KEY = 'test-ingest-key';

const ingestPayload = {
  title: 'Artigo assíncrono',
  summary: 'Resumo assíncrono',
  content: 'Conteúdo assíncrono',
  author: 'Maria Silva',
  category: 'Economia',
  tags: ['Eleições'],
  publishedAt: '2026-01-15T10:00:00Z',
};

const searchMock = {
  index: jest.fn().mockResolvedValue(undefined),
  search: jest.fn(),
  remove: jest.fn().mockResolvedValue(undefined),
};

describe('ArticlesController async ingestion (integration)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    process.env.INGEST_API_KEY = INGEST_API_KEY;
    process.env.INDEXING_MODE = 'async';

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
    delete process.env.INDEXING_MODE;
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    await resetTables(getTestPrisma());
    searchMock.index.mockClear();
    searchMock.remove.mockClear();
  });

  it('POST /api/v1/articles returns 202 and enqueues index job', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/articles',
      headers: { 'x-api-key': INGEST_API_KEY },
      payload: ingestPayload,
    });

    expect(response.statusCode).toBe(202);

    const body = JSON.parse(response.body) as {
      id: string;
      indexingStatus: string;
    };

    expect(body.indexingStatus).toBe('pending');
    expect(searchMock.index).not.toHaveBeenCalled();

    const jobs = await getTestPrisma().indexJob.findMany();
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      articleId: body.id,
      action: 'INDEX',
      status: 'PENDING',
    });
  });

  it('PUT /api/v1/articles/:id unpublish returns 202 and enqueues REMOVE job', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/articles',
      headers: { 'x-api-key': INGEST_API_KEY },
      payload: ingestPayload,
    });
    const createdBody = JSON.parse(created.body) as { id: string };

    searchMock.remove.mockClear();
    await getTestPrisma().indexJob.deleteMany();

    const response = await app.inject({
      method: 'PUT',
      url: `/api/v1/articles/${createdBody.id}`,
      headers: { 'x-api-key': INGEST_API_KEY },
      payload: { publishedAt: null },
    });

    expect(response.statusCode).toBe(202);

    const jobs = await getTestPrisma().indexJob.findMany({
      where: { action: 'REMOVE' },
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0].articleId).toBe(createdBody.id);
    expect(searchMock.remove).not.toHaveBeenCalled();
  });
});
