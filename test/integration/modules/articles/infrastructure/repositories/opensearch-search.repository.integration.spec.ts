import { Client } from '@opensearch-project/opensearch';
import { OpenSearchSearchRepository } from '@/modules/articles/infrastructure/repositories/opensearch-search.repository';
import { ARTICLES_INDEX } from '@/modules/articles/infrastructure/opensearch/articles-index.constants';

async function isOpenSearchAvailable(): Promise<boolean> {
  const node = process.env.OPENSEARCH_NODE ?? 'http://localhost:9200';
  const client = new Client({ node });

  try {
    await client.cluster.health({ timeout: '2s' });
    return true;
  } catch {
    return false;
  }
}

describe('OpenSearchSearchRepository (integration)', () => {
  let client: Client;
  let repository: OpenSearchSearchRepository;
  let openSearchAvailable = false;

  beforeAll(async () => {
    openSearchAvailable = await isOpenSearchAvailable();

    if (!openSearchAvailable) {
      throw new Error(
        'OpenSearch is not available. Start it with: docker compose up -d opensearch',
      );
    }

    const node = process.env.OPENSEARCH_NODE ?? 'http://localhost:9200';
    client = new Client({ node });
    repository = new OpenSearchSearchRepository(client);

    try {
      await client.indices.delete({ index: ARTICLES_INDEX });
    } catch {
      // index may not exist yet
    }

    await repository.ensureIndex();
  });

  afterEach(async () => {
    await client.deleteByQuery({
      index: ARTICLES_INDEX,
      body: { query: { match_all: {} } },
      refresh: true,
      wait_for_completion: true,
    });
  });

  const createDocument = (overrides: Partial<{
    id: string;
    title: string;
    summary: string;
    content: string;
    category: string;
    tags: string[];
    publishedAt: string | null;
  }> = {}) => ({
    id: overrides.id ?? `test-${Date.now()}-${Math.random()}`,
    slug: 'artigo-teste',
    title: overrides.title ?? 'Artigo sobre tecnologia',
    summary: overrides.summary ?? 'Resumo sobre inovação',
    content: overrides.content ?? 'Conteúdo completo do artigo',
    publishedAt:
      'publishedAt' in overrides
        ? overrides.publishedAt ?? null
        : '2026-01-15T10:00:00.000Z',
    author: 'Maria Silva',
    category: overrides.category ?? 'tecnologia',
    tags: overrides.tags ?? ['inteligencia-artificial'],
  });

  it('indexes and searches by title', async () => {
    const document = createDocument({
      id: 'search-title-1',
      title: 'Blockchain revoluciona finanças',
    });
    await repository.index(document);

    const result = await repository.search({
      q: 'blockchain',
      page: 1,
      limit: 10,
    });

    expect(result.ids).toContain('search-title-1');
    expect(result.total).toBeGreaterThanOrEqual(1);
  });

  it('searches by summary and content', async () => {
    await repository.index(
      createDocument({
        id: 'search-content-1',
        title: 'Título genérico',
        summary: 'Economia brasileira em recuperação',
        content: 'Análise detalhada do mercado',
      }),
    );

    const bySummary = await repository.search({
      q: 'recuperação',
      page: 1,
      limit: 10,
    });
    const byContent = await repository.search({
      q: 'mercado',
      page: 1,
      limit: 10,
    });

    expect(bySummary.ids).toContain('search-content-1');
    expect(byContent.ids).toContain('search-content-1');
  });

  it('searches by tags', async () => {
    await repository.index(
      createDocument({
        id: 'search-tags-1',
        tags: ['nextjs', 'react'],
      }),
    );

    const result = await repository.search({
      q: 'nextjs',
      page: 1,
      limit: 10,
    });

    expect(result.ids).toContain('search-tags-1');
  });

  it('excludes unpublished articles from search results', async () => {
    await repository.index(
      createDocument({
        id: 'search-draft-1',
        title: 'Artigo rascunho exclusivo',
        publishedAt: null,
      }),
    );

    const result = await repository.search({
      q: 'rascunho exclusivo',
      page: 1,
      limit: 10,
    });

    expect(result.ids).not.toContain('search-draft-1');
  });

  it('paginates search results', async () => {
    for (let index = 0; index < 3; index += 1) {
      await repository.index(
        createDocument({
          id: `search-page-${index}`,
          title: `Paginação teste artigo ${index}`,
        }),
      );
    }

    const page1 = await repository.search({
      q: 'paginação teste',
      page: 1,
      limit: 2,
    });
    const page2 = await repository.search({
      q: 'paginação teste',
      page: 2,
      limit: 2,
    });

    expect(page1.ids).toHaveLength(2);
    expect(page1.total).toBe(3);
    expect(page2.ids).toHaveLength(1);
  });

  it('removes document by id', async () => {
    const document = createDocument({ id: 'search-remove-1' });
    await repository.index(document);
    await repository.remove('search-remove-1');

    const result = await repository.search({
      q: 'tecnologia',
      page: 1,
      limit: 10,
    });

    expect(result.ids).not.toContain('search-remove-1');
  });

  it('filters by category when q is present', async () => {
    await repository.index(
      createDocument({
        id: 'filter-category-tech',
        title: 'Inovação digital exclusiva',
        category: 'tecnologia',
      }),
    );
    await repository.index(
      createDocument({
        id: 'filter-category-sports',
        title: 'Inovação digital exclusiva',
        category: 'esportes',
      }),
    );

    const result = await repository.search({
      q: 'inovação digital exclusiva',
      category: 'tecnologia',
      page: 1,
      limit: 10,
    });

    expect(result.ids).toEqual(['filter-category-tech']);
    expect(result.total).toBe(1);
  });

  it('filters by tag slug when q is present', async () => {
    await repository.index(
      createDocument({
        id: 'filter-tag-ia',
        title: 'Pesquisa avançada exclusiva',
        tags: ['inteligencia-artificial'],
      }),
    );
    await repository.index(
      createDocument({
        id: 'filter-tag-other',
        title: 'Pesquisa avançada exclusiva',
        tags: ['nextjs'],
      }),
    );

    const result = await repository.search({
      q: 'pesquisa avançada exclusiva',
      tag: 'inteligencia-artificial',
      page: 1,
      limit: 10,
    });

    expect(result.ids).toEqual(['filter-tag-ia']);
    expect(result.total).toBe(1);
  });
});
