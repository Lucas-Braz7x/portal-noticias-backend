import { Article } from '@/modules/articles/domain/entities/article.entity';
import { Author } from '@/modules/articles/domain/entities/author.entity';
import { Category } from '@/modules/articles/domain/entities/category.entity';
import { Tag } from '@/modules/articles/domain/entities/tag.entity';
import { ArticleNotFoundException } from '@/modules/articles/domain/exceptions/article-not-found.exception';
import { IArticleRepository } from '@/modules/articles/domain/repositories/article.repository';
import { IAuthorRepository } from '@/modules/articles/domain/repositories/author.repository';
import { ICategoryRepository } from '@/modules/articles/domain/repositories/category.repository';
import { ITagRepository } from '@/modules/articles/domain/repositories/tag.repository';
import { ISearchRepository } from '@/modules/articles/domain/repositories/search.repository';
import { ArticlesService } from '@/modules/articles/application/articles.service';
import { ArticleMapper } from '@/modules/articles/infrastructure/mappers/article.mapper';

const author = { id: 'author-1', name: 'Maria Silva' };
const category = { id: 'cat-1', name: 'Política', slug: 'politica' };
const tags = [
  { id: 'tag-1', name: 'economia', slug: 'economia' },
  { id: 'tag-2', name: 'brasil', slug: 'brasil' },
];

const authorEntity = Author.create({ id: author.id, name: author.name });
const categoryEntity = Category.create({
  id: category.id,
  name: category.name,
  slug: category.slug,
});
const tagEntities = tags.map((tag) =>
  Tag.create({ id: tag.id, name: tag.name, slug: tag.slug }),
);

function createPublishedArticle(
  overrides: Partial<Parameters<typeof Article.create>[0]> = {},
) {
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

const createInput = {
  title: 'Como a IA está mudando o jornalismo',
  summary: 'Resumo do artigo',
  content: 'Conteúdo completo',
  author: 'Maria Silva',
  category: 'Política',
  tags: ['economia', 'brasil'],
  publishedAt: '2026-01-15T10:00:00Z',
};

describe('ArticlesService', () => {
  let articlesRepository: jest.Mocked<IArticleRepository>;
  let searchRepository: jest.Mocked<ISearchRepository>;
  let authorsRepository: jest.Mocked<IAuthorRepository>;
  let categoriesRepository: jest.Mocked<ICategoryRepository>;
  let tagsRepository: jest.Mocked<ITagRepository>;
  let service: ArticlesService;

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
      index: jest.fn(),
      search: jest.fn(),
      remove: jest.fn(),
    };

    authorsRepository = {
      findByName: jest.fn(),
      findOrCreateByName: jest.fn(),
    };

    categoriesRepository = {
      findAll: jest.fn(),
      findBySlug: jest.fn(),
      findOrCreate: jest.fn(),
    };

    tagsRepository = {
      findAll: jest.fn(),
      findBySlug: jest.fn(),
      findOrCreateMany: jest.fn(),
    };

    service = new ArticlesService(
      articlesRepository,
      searchRepository,
      authorsRepository,
      categoriesRepository,
      tagsRepository,
    );
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
          category: { name: 'Política', slug: 'politica' },
          tags: [
            { name: 'economia', slug: 'economia' },
            { name: 'brasil', slug: 'brasil' },
          ],
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

      const result = await service.list({
        q: 'jornalismo',
        page: 1,
        limit: 10,
      });

      expect(searchRepository.search).toHaveBeenCalledWith({
        q: 'jornalismo',
        page: 1,
        limit: 10,
      });
      expect(articlesRepository.findByIds).toHaveBeenCalledWith(
        [article.id],
        true,
      );
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

  describe('getBySlug', () => {
    it('returns article detail with RF06 fields for published article', async () => {
      const article = createPublishedArticle();
      articlesRepository.findBySlug.mockResolvedValue(article);

      const result = await service.getBySlug(article.slug);

      expect(articlesRepository.findBySlug).toHaveBeenCalledWith(article.slug);
      expect(result).toEqual({
        slug: article.slug,
        title: article.title,
        summary: article.summary,
        content: 'Conteúdo completo',
        publishedAt: '2026-01-15T10:00:00.000Z',
        author: 'Maria Silva',
        category: { name: 'Política', slug: 'politica' },
        tags: [
          { name: 'economia', slug: 'economia' },
          { name: 'brasil', slug: 'brasil' },
        ],
      });
    });

    it('throws ArticleNotFoundException when slug is not found', async () => {
      articlesRepository.findBySlug.mockResolvedValue(null);

      await expect(service.getBySlug('inexistente')).rejects.toThrow(
        ArticleNotFoundException,
      );
      await expect(service.getBySlug('inexistente')).rejects.toThrow(
        'Article not found: inexistente',
      );
    });

    it('throws ArticleNotFoundException for draft article', async () => {
      const draft = createPublishedArticle({ publishedAt: null });
      articlesRepository.findBySlug.mockResolvedValue(draft);

      await expect(service.getBySlug(draft.slug)).rejects.toThrow(
        ArticleNotFoundException,
      );
    });

    it('throws ArticleNotFoundException for scheduled article', async () => {
      const scheduled = createPublishedArticle({
        publishedAt: new Date('2099-01-01T00:00:00Z'),
      });
      articlesRepository.findBySlug.mockResolvedValue(scheduled);

      await expect(service.getBySlug(scheduled.slug)).rejects.toThrow(
        ArticleNotFoundException,
      );
    });

    it('trims slug before lookup', async () => {
      const article = createPublishedArticle();
      articlesRepository.findBySlug.mockResolvedValue(article);

      await service.getBySlug(`  ${article.slug}  `);

      expect(articlesRepository.findBySlug).toHaveBeenCalledWith(article.slug);
    });
  });

  describe('create', () => {
    function mockSuccessfulRefs() {
      authorsRepository.findOrCreateByName.mockResolvedValue(authorEntity);
      categoriesRepository.findOrCreate.mockResolvedValue(categoryEntity);
      tagsRepository.findOrCreateMany.mockResolvedValue(tagEntities);
      articlesRepository.existsBySlug.mockResolvedValue(false);
      articlesRepository.save.mockImplementation((article) =>
        Promise.resolve(article),
      );
      searchRepository.index.mockResolvedValue(undefined);
    }

    it('finds or creates refs, persists, indexes and returns ingest payload', async () => {
      mockSuccessfulRefs();

      const result = await service.create(createInput);

      expect(authorsRepository.findOrCreateByName).toHaveBeenCalledWith(
        'Maria Silva',
      );
      expect(categoriesRepository.findOrCreate).toHaveBeenCalledWith({
        name: 'Política',
      });
      expect(tagsRepository.findOrCreateMany).toHaveBeenCalledWith([
        { name: 'economia' },
        { name: 'brasil' },
      ]);
      expect(articlesRepository.save).toHaveBeenCalledTimes(1);
      expect(searchRepository.index).toHaveBeenCalledWith(
        expect.objectContaining({
          title: createInput.title,
          author: 'Maria Silva',
          category: 'politica',
          tags: ['economia', 'brasil'],
        }),
      );
      expect(result.id).toEqual(expect.any(String));
      expect(result).toEqual(
        expect.objectContaining({
          title: createInput.title,
          author: 'Maria Silva',
          category: { name: 'Política', slug: 'politica' },
          tags: [
            { name: 'economia', slug: 'economia' },
            { name: 'brasil', slug: 'brasil' },
          ],
          publishedAt: '2026-01-15T10:00:00.000Z',
        }),
      );
    });

    it('indexes the saved article search document', async () => {
      mockSuccessfulRefs();
      let savedArticle: Article | undefined;
      articlesRepository.save.mockImplementation((article) => {
        savedArticle = article;
        return Promise.resolve(article);
      });

      await service.create(createInput);

      expect(searchRepository.index).toHaveBeenCalledWith(
        ArticleMapper.toSearchDocument(savedArticle!),
      );
    });

    it('appends numeric suffix when generated slug already exists', async () => {
      mockSuccessfulRefs();
      articlesRepository.existsBySlug
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      await service.create(createInput);

      const saved = articlesRepository.save.mock.calls[0]?.[0];
      expect(saved?.slug).toBe('como-a-ia-esta-mudando-o-jornalismo-3');
      expect(articlesRepository.existsBySlug).toHaveBeenCalledTimes(3);
    });

    it('creates a draft when publishedAt is omitted', async () => {
      mockSuccessfulRefs();

      const result = await service.create({
        title: createInput.title,
        summary: createInput.summary,
        content: createInput.content,
        author: createInput.author,
        category: createInput.category,
        tags: createInput.tags,
      });

      const saved = articlesRepository.save.mock.calls[0]?.[0];
      expect(saved?.publishedAt).toBeNull();
      expect(result.publishedAt).toBeNull();
    });
  });

  describe('update', () => {
    it('updates article, reindexes and returns ingest payload', async () => {
      const article = createPublishedArticle();
      articlesRepository.findById.mockResolvedValue(article);
      articlesRepository.update.mockImplementation((updated) =>
        Promise.resolve(updated),
      );
      searchRepository.index.mockResolvedValue(undefined);

      const result = await service.update(article.id, {
        title: 'Título atualizado',
      });

      expect(articlesRepository.findById).toHaveBeenCalledWith(article.id);
      expect(article.title).toBe('Título atualizado');
      expect(articlesRepository.update).toHaveBeenCalledWith(article);
      expect(searchRepository.index).toHaveBeenCalledWith(
        ArticleMapper.toSearchDocument(article),
      );
      expect(result.title).toBe('Título atualizado');
      expect(result.slug).toBe('como-a-ia-esta-mudando-o-jornalismo');
    });

    it('resolves only provided refs on partial update', async () => {
      const article = createPublishedArticle();
      const newAuthor = Author.create({ id: 'author-2', name: 'João Souza' });
      articlesRepository.findById.mockResolvedValue(article);
      articlesRepository.update.mockImplementation((updated) =>
        Promise.resolve(updated),
      );
      authorsRepository.findOrCreateByName.mockResolvedValue(newAuthor);
      searchRepository.index.mockResolvedValue(undefined);

      await service.update(article.id, { author: 'João Souza' });

      expect(authorsRepository.findOrCreateByName).toHaveBeenCalledWith(
        'João Souza',
      );
      expect(categoriesRepository.findOrCreate).not.toHaveBeenCalled();
      expect(tagsRepository.findOrCreateMany).not.toHaveBeenCalled();
      expect(article.author).toEqual({ id: 'author-2', name: 'João Souza' });
    });

    it('unpublishes when publishedAt is null', async () => {
      const article = createPublishedArticle();
      articlesRepository.findById.mockResolvedValue(article);
      articlesRepository.update.mockImplementation((updated) =>
        Promise.resolve(updated),
      );
      searchRepository.remove.mockResolvedValue(undefined);

      const result = await service.update(article.id, { publishedAt: null });

      expect(article.publishedAt).toBeNull();
      expect(result.publishedAt).toBeNull();
      expect(searchRepository.remove).toHaveBeenCalledWith(article.id);
      expect(searchRepository.index).not.toHaveBeenCalled();
    });

    it('throws ArticleNotFoundException when id does not exist', async () => {
      articlesRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('00000000-0000-4000-8000-000000000000', {
          title: 'X',
        }),
      ).rejects.toThrow(ArticleNotFoundException);
      expect(articlesRepository.update).not.toHaveBeenCalled();
      expect(searchRepository.index).not.toHaveBeenCalled();
    });
  });

  describe('listCategories', () => {
    it('returns categories mapped to reference items', async () => {
      categoriesRepository.findAll.mockResolvedValue([
        categoryEntity,
        Category.create({
          id: 'cat-2',
          name: 'Economia',
          slug: 'economia',
        }),
      ]);

      const result = await service.listCategories();

      expect(categoriesRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual([
        { name: 'Política', slug: 'politica' },
        { name: 'Economia', slug: 'economia' },
      ]);
    });
  });

  describe('listTags', () => {
    it('returns tags mapped to reference items', async () => {
      tagsRepository.findAll.mockResolvedValue(tagEntities);

      const result = await service.listTags();

      expect(tagsRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual([
        { name: 'economia', slug: 'economia' },
        { name: 'brasil', slug: 'brasil' },
      ]);
    });
  });
});
