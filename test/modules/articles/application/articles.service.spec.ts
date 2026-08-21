import { Article } from '@/modules/articles/domain/entities/article.entity';
import {
  IArticleRepository,
} from '@/modules/articles/domain/repositories/article.repository';
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
  let service: ArticlesService;

  beforeEach(() => {
    articlesRepository = {
      findBySlug: jest.fn(),
      findMany: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      existsBySlug: jest.fn(),
    };

    service = new ArticlesService(articlesRepository);
  });

  describe('list', () => {
    it('delegates findMany with publishedOnly true', async () => {
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
  });
});
