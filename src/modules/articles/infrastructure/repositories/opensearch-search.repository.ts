import { Inject, Injectable } from '@nestjs/common';
import type { Client } from '@opensearch-project/opensearch';
import {
  ISearchRepository,
  SearchArticleDocument,
  SearchArticlesParams,
} from '../../domain/repositories/search.repository';
import {
  ARTICLES_INDEX,
  ARTICLES_INDEX_MAPPINGS,
} from '../opensearch/articles-index.constants';
import { OPENSEARCH_CLIENT } from '../opensearch/opensearch-client.provider';

@Injectable()
export class OpenSearchSearchRepository implements ISearchRepository {
  constructor(
    @Inject(OPENSEARCH_CLIENT)
    private readonly client: Client,
  ) {}

  async ensureIndex(): Promise<void> {
    const exists = await this.client.indices.exists({ index: ARTICLES_INDEX });

    if (!exists.body) {
      await this.client.indices.create({
        index: ARTICLES_INDEX,
        body: { mappings: ARTICLES_INDEX_MAPPINGS },
      });
    }
  }

  async index(document: SearchArticleDocument): Promise<void> {
    const body =
      document.publishedAt === null
        ? {
            id: document.id,
            slug: document.slug,
            title: document.title,
            summary: document.summary,
            content: document.content,
            author: document.author,
            category: document.category,
            tags: document.tags,
          }
        : document;

    await this.client.index({
      index: ARTICLES_INDEX,
      id: document.id,
      body,
      refresh: true,
    });
  }

  async search(params: SearchArticlesParams): Promise<{
    ids: string[];
    total: number;
  }> {
    const from = (params.page - 1) * params.limit;
    const filters: object[] = [
      { exists: { field: 'publishedAt' } },
      { range: { publishedAt: { lte: 'now' } } },
    ];

    if (params.category) {
      filters.push({ term: { category: params.category } });
    }

    if (params.tag) {
      filters.push({ term: { 'tags.keyword': params.tag } });
    }

    const response = await this.client.search({
      index: ARTICLES_INDEX,
      body: {
        from,
        size: params.limit,
        _source: false,
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: params.q,
                  fields: ['title', 'summary', 'content', 'tags'],
                  type: 'best_fields',
                },
              },
            ],
            filter: filters,
          },
        },
      },
    });

    const hits = response.body.hits;
    const ids = hits.hits
      .map((hit) => (hit as { _id?: string })._id)
      .filter((id): id is string => Boolean(id));
    const total =
      typeof hits.total === 'number' ? hits.total : (hits.total?.value ?? 0);

    return { ids, total };
  }

  async remove(id: string): Promise<void> {
    await this.client.delete({
      index: ARTICLES_INDEX,
      id,
      refresh: true,
    });
  }
}
