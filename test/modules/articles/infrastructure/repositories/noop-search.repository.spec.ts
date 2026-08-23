import { SearchUnavailableException } from '@/modules/articles/domain/exceptions/search-unavailable.exception';
import { NoOpSearchRepository } from '@/modules/articles/infrastructure/repositories/noop-search.repository';

describe('NoOpSearchRepository', () => {
  const repository = new NoOpSearchRepository();

  it('no-ops index and remove', async () => {
    await expect(
      repository.index({
        id: '1',
        slug: 'slug',
        title: 'title',
        summary: 'summary',
        content: 'content',
        publishedAt: '2026-01-01T00:00:00.000Z',
        author: 'author',
        category: 'category',
        tags: [],
      }),
    ).resolves.toBeUndefined();

    await expect(repository.remove('1')).resolves.toBeUndefined();
  });

  it('throws SearchUnavailableException on search', async () => {
    await expect(
      repository.search({ q: 'test', page: 1, limit: 10 }),
    ).rejects.toThrow(SearchUnavailableException);
  });
});
