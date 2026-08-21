import { Article } from '@/modules/articles/domain/entities/article.entity';
import {
  IArticleRepository,
} from '@/modules/articles/domain/repositories/article.repository';
import {
  ISearchRepository,
} from '@/modules/articles/domain/repositories/search.repository';
import { ArticlesService } from '@/modules/articles/application/articles.service';

const author = { id: 'author-1', name: 'Maria Silva' };
const category = { id: 'cat-1', name: 'Política', slug: 'politica' };
const tags = [
  { id: 'tag-1', name: 'economia', slug: 'economia' },
  { id: 'tag-2', name: 'brasil', slug: 'brasil' },
];

function createPublishedArticle(overrides: Partial<Parameters<typeof Article.create>[0]> = {}) {
  return Article.create({
    title: 'Como a IA está mudando o jornalismo',
    summary: 'Resumo do artigo',
    content: 'Conteúdo completo',
    author,
    category,
    tags,
    publishedAt: new Date('2026-01-15T10:00:00Z'),
    ...overrides,
  });
}

describe('ArticlesService', () => {
  let articlesRepository: jest.Mocked<IArticleRepository>;
  let searchRepository: jest.Mocked<ISearchRepository>;
  let service: ArticlesService;

  beforeEach(() => {
    articlesRepository = {
      findBySlug: jest.fn(),
      findByIds: jest.fn(),
      findMany: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      existsBySlug: jest.fn(),
    };

    searchRepository = {
      index: jest.fn(),
      search: jest.fn(),
      remove: jest.fn(),
    };

    service = new ArticlesService(articlesRepository, searchRepository);
  });

  describe('list', () => {
    it('delegates findMany with publishedOnly true when q is absent', async () => {
      articlesRepository.findMany.mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await service.list({ page: 1, limit: 10 });

      expect(articlesRepository.findMany).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        publishedOnly: true,
      });
      expect(searchRepository.search).not.toHaveBeenCalled();
    });

    it('falls back to PostgreSQL when q is empty or whitespace', async () => {
      articlesRepository.findMany.mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await service.list({ q: '   ', page: 1, limit: 10 });

      expect(articlesRepository.findMany).toHaveBeenCalled();
      expect(searchRepository.search).not.toHaveBeenCalled();
    });

    it('maps articles to API summary shape', async () => {
      const article = createPublishedArticle();
      articlesRepository.findMany.mockResolvedValue({
        data: [article],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      const result = await service.list({ page: 1, limit: 10 });

      expect(result.data).toEqual([
        {
          slug: article.slug,
          title: article.title,
          summary: article.summary,
          publishedAt: '2026-01-15T10:00:00.000Z',
          author: 'Maria Silva',
          category: 'Política',
          tags: ['economia', 'brasil'],
        },
      ]);
    });

    it('passes through pagination meta from repository', async () => {
      const meta = { page: 2, limit: 10, total: 21, totalPages: 3 };
      articlesRepository.findMany.mockResolvedValue({
        data: [],
        meta,
      });

      const result = await service.list({ page: 2, limit: 10 });

      expect(result.meta).toEqual(meta);
    });

    it('returns empty data and zero totalPages when there are no results', async () => {
      articlesRepository.findMany.mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      const result = await service.list({ page: 1, limit: 10 });

      expect(result.data).toEqual([]);
      expect(result.meta.totalPages).toBe(0);
    });

    it('searches via OpenSearch and hydrates from PostgreSQL when q is present', async () => {
      const article = createPublishedArticle();
      searchRepository.search.mockResolvedValue({
        ids: [article.id],
        total: 1,
      });
      articlesRepository.findByIds.mockResolvedValue([article]);

      const result = await service.list({ q: 'jornalismo', page: 1, limit: 10 });

      expect(searchRepository.search).toHaveBeenCalledWith({
        q: 'jornalismo',
        page: 1,
        limit: 10,
      });
      expect(articlesRepository.findByIds).toHaveBeenCalledWith([article.id], true);
      expect(articlesRepository.findMany).not.toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it('returns correct totalPages from OpenSearch total', async () => {
      searchRepository.search.mockResolvedValue({
        ids: [],
        total: 25,
      });
      articlesRepository.findByIds.mockResolvedValue([]);

      const result = await service.list({ q: 'teste', page: 2, limit: 10 });

      expect(result.meta).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });

    it('passes categorySlug and tagSlug to findMany when q is absent', async () => {
      articlesRepository.findMany.mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await service.list({
        category: 'tecnologia',
        tag: 'ia',
        page: 1,
        limit: 10,
      });

      expect(articlesRepository.findMany).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        publishedOnly: true,
        categorySlug: 'tecnologia',
        tagSlug: 'ia',
      });
    });

    it('passes category and tag to OpenSearch when q is present', async () => {
      searchRepository.search.mockResolvedValue({ ids: [], total: 0 });
      articlesRepository.findByIds.mockResolvedValue([]);

      await service.list({
        q: 'blockchain',
        category: 'tecnologia',
        tag: 'ia',
        page: 2,
        limit: 5,
      });

      expect(searchRepository.search).toHaveBeenCalledWith({
        q: 'blockchain',
        category: 'tecnologia',
        tag: 'ia',
        page: 2,
        limit: 5,
      });
    });

    it('ignores empty or whitespace category and tag filters', async () => {
      articlesRepository.findMany.mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await service.list({
        category: '   ',
        tag: '   ',
        page: 1,
        limit: 10,
      });

      expect(articlesRepository.findMany).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        publishedOnly: true,
      });
    });
  });
});
