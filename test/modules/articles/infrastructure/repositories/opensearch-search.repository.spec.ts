import { OpenSearchSearchRepository } from '@/modules/articles/infrastructure/repositories/opensearch-search.repository';
import {
  ARTICLES_INDEX,
  ARTICLES_INDEX_MAPPINGS,
} from '@/modules/articles/infrastructure/opensearch/articles-index.constants';

function createMockClient() {
  return {
    indices: {
      exists: jest.fn(),
      create: jest.fn(),
    },
    index: jest.fn(),
    search: jest.fn(),
    delete: jest.fn(),
  };
}

describe('OpenSearchSearchRepository', () => {
  let client: ReturnType<typeof createMockClient>;
  let repository: OpenSearchSearchRepository;

  beforeEach(() => {
    client = createMockClient();
    repository = new OpenSearchSearchRepository(client as never);
  });

  describe('ensureIndex', () => {
    it('creates index when it does not exist', async () => {
      client.indices.exists.mockResolvedValue({ body: false });
      client.indices.create.mockResolvedValue({});

      await repository.ensureIndex();

      expect(client.indices.create).toHaveBeenCalledWith({
        index: ARTICLES_INDEX,
        body: { mappings: ARTICLES_INDEX_MAPPINGS },
      });
    });

    it('does not create index when it already exists', async () => {
      client.indices.exists.mockResolvedValue({ body: true });

      await repository.ensureIndex();

      expect(client.indices.create).not.toHaveBeenCalled();
    });
  });

  describe('index', () => {
    it('upserts document by id', async () => {
      const document = {
        id: 'article-1',
        slug: 'titulo',
        title: 'Título',
        summary: 'Resumo',
        content: 'Conteúdo',
        publishedAt: '2026-01-15T10:00:00.000Z',
        author: 'Maria Silva',
        category: 'tecnologia',
        tags: ['ia'],
      };

      client.index.mockResolvedValue({});

      await repository.index(document);

      expect(client.index).toHaveBeenCalledWith({
        index: ARTICLES_INDEX,
        id: 'article-1',
        body: document,
        refresh: true,
      });
    });
  });

  describe('search', () => {
    it('queries multi_match on title, summary, content and tags with published filters', async () => {
      client.search.mockResolvedValue({
        body: {
          hits: {
            total: { value: 2 },
            hits: [{ _id: 'id-1' }, { _id: 'id-2' }],
          },
        },
      });

      const result = await repository.search({
        q: 'tecnologia',
        page: 2,
        limit: 10,
      });

      expect(client.search).toHaveBeenCalledWith({
        index: ARTICLES_INDEX,
        body: {
          from: 10,
          size: 10,
          _source: false,
          query: {
            bool: {
              must: [
                {
                  multi_match: {
                    query: 'tecnologia',
                    fields: ['title', 'summary', 'content', 'tags'],
                    type: 'best_fields',
                  },
                },
              ],
              filter: [
                { exists: { field: 'publishedAt' } },
                { range: { publishedAt: { lte: 'now' } } },
              ],
            },
          },
        },
      });
      expect(result).toEqual({ ids: ['id-1', 'id-2'], total: 2 });
    });

    it('applies category and tag filters when provided', async () => {
      client.search.mockResolvedValue({
        body: {
          hits: { total: { value: 0 }, hits: [] },
        },
      });

      await repository.search({
        q: 'economia',
        category: 'politica',
        tag: 'brasil',
        page: 1,
        limit: 10,
      });

      const call = client.search.mock.calls[0][0];
      expect(call.body.query.bool.filter).toEqual([
        { exists: { field: 'publishedAt' } },
        { range: { publishedAt: { lte: 'now' } } },
        { term: { category: 'politica' } },
        { term: { 'tags.keyword': 'brasil' } },
      ]);
    });
  });

  describe('remove', () => {
    it('deletes document by id', async () => {
      client.delete.mockResolvedValue({});

      await repository.remove('article-1');

      expect(client.delete).toHaveBeenCalledWith({
        index: ARTICLES_INDEX,
        id: 'article-1',
        refresh: true,
      });
    });
  });
});
