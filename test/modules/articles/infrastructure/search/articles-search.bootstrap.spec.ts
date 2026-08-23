import { ConfigService } from '@nestjs/config';
import { ArticlesSearchBootstrap } from '@/modules/articles/infrastructure/search/articles-search.bootstrap';
import { IArticleRepository } from '@/modules/articles/domain/repositories/article.repository';
import { ISearchRepository } from '@/modules/articles/domain/repositories/search.repository';
import { OpenSearchSearchRepository } from '@/modules/articles/infrastructure/repositories/opensearch-search.repository';
import { Article } from '@/modules/articles/domain/entities/article.entity';

const author = { id: 'author-1', name: 'Maria Silva' };
const category = { id: 'cat-1', name: 'Política', slug: 'politica' };
const tags = [{ id: 'tag-1', name: 'economia', slug: 'economia' }];

function createPublishedArticle() {
  return Article.create({
    title: 'Artigo publicado',
    summary: 'Resumo',
    content: 'Conteúdo',
    author,
    category,
    tags,
    publishedAt: new Date('2026-01-15T10:00:00Z'),
  });
}

describe('ArticlesSearchBootstrap', () => {
  let articlesRepository: jest.Mocked<IArticleRepository>;
  let searchRepository: jest.Mocked<ISearchRepository>;
  let openSearchRepository: jest.Mocked<OpenSearchSearchRepository>;
  let configService: jest.Mocked<ConfigService>;
  let bootstrap: ArticlesSearchBootstrap;

  beforeEach(() => {
    articlesRepository = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findByIds: jest.fn(),
      findMany: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      existsBySlug: jest.fn(),
    };

    searchRepository = {
      index: jest.fn().mockResolvedValue(undefined),
      search: jest.fn(),
      remove: jest.fn(),
    };

    openSearchRepository = {
      ensureIndex: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<OpenSearchSearchRepository>;

    configService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    bootstrap = new ArticlesSearchBootstrap(
      articlesRepository,
      searchRepository,
      openSearchRepository,
      configService,
    );
  });

  it('ensures index and reindexes published articles when flag is true', async () => {
    configService.get.mockImplementation(
      (key: string, defaultValue?: unknown) => {
        if (key === 'SEARCH_REINDEX_ON_STARTUP') {
          return 'true';
        }

        return defaultValue;
      },
    );
    articlesRepository.findMany.mockResolvedValue({
      data: [createPublishedArticle()],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });

    await bootstrap.onModuleInit();

    expect(openSearchRepository.ensureIndex).toHaveBeenCalledTimes(1);
    expect(articlesRepository.findMany).toHaveBeenCalledWith({
      page: 1,
      limit: 100,
      publishedOnly: true,
    });
    expect(searchRepository.index).toHaveBeenCalledTimes(1);
  });

  it('ensures index only when reindex flag is false', async () => {
    configService.get.mockImplementation(
      (key: string, defaultValue?: unknown) => {
        if (key === 'SEARCH_REINDEX_ON_STARTUP') {
          return 'false';
        }

        return defaultValue;
      },
    );

    await bootstrap.onModuleInit();

    expect(openSearchRepository.ensureIndex).toHaveBeenCalledTimes(1);
    expect(articlesRepository.findMany).not.toHaveBeenCalled();
    expect(searchRepository.index).not.toHaveBeenCalled();
  });

  it('skips bootstrap when OpenSearch is disabled', async () => {
    configService.get.mockImplementation(
      (key: string, defaultValue?: unknown) => {
        if (key === 'OPENSEARCH_ENABLED') {
          return 'false';
        }

        return defaultValue;
      },
    );

    await bootstrap.onModuleInit();

    expect(openSearchRepository.ensureIndex).not.toHaveBeenCalled();
    expect(articlesRepository.findMany).not.toHaveBeenCalled();
    expect(searchRepository.index).not.toHaveBeenCalled();
  });
});
