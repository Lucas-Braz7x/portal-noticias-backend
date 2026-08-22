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
import { getTestPrisma } from '../../../helpers/database.helper';
import { seedCategory, seedTag } from '../../../helpers/fixtures.helper';

const searchMock = {
  index: jest.fn().mockResolvedValue(undefined),
  search: jest.fn(),
  remove: jest.fn(),
};

async function createApp(): Promise<NestFastifyApplication> {
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

  const app = moduleRef.createNestApplication<NestFastifyApplication>(
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

  return app;
}

describe('CategoriesController (integration)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/categories returns categories ordered by name', async () => {
    const prisma = getTestPrisma();
    await seedCategory(prisma, { name: 'Tecnologia', slug: 'tecnologia' });
    await seedCategory(prisma, { name: 'Cultura', slug: 'cultura' });

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/categories',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body) as Array<{
      name: string;
      slug: string;
    }>;

    expect(body).toEqual([
      { name: 'Cultura', slug: 'cultura' },
      { name: 'Tecnologia', slug: 'tecnologia' },
    ]);
  });
});

describe('TagsController (integration)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/tags returns tags ordered by name', async () => {
    const prisma = getTestPrisma();
    await seedTag(prisma, { name: 'Next.js', slug: 'nextjs' });
    await seedTag(prisma, { name: 'AWS', slug: 'aws' });

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/tags',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body) as Array<{
      name: string;
      slug: string;
    }>;

    expect(body).toEqual([
      { name: 'AWS', slug: 'aws' },
      { name: 'Next.js', slug: 'nextjs' },
    ]);
  });
});
