import { Inject, Injectable } from '@nestjs/common';
import {
  ARTICLE_REPOSITORY,
  IArticleRepository,
} from '../domain/repositories/article.repository';
import {
  SEARCH_REPOSITORY,
  ISearchRepository,
} from '../domain/repositories/search.repository';
import { ArticleResponseMapper } from '../presentation/mappers/article-response.mapper';

export interface ListArticlesInput {
  q?: string;
  category?: string;
  tag?: string;
  page: number;
  limit: number;
}

@Injectable()
export class ArticlesService {
  constructor(
    @Inject(ARTICLE_REPOSITORY)
    private readonly articles: IArticleRepository,
    @Inject(SEARCH_REPOSITORY)
    private readonly search: ISearchRepository,
  ) {}

  async list(params: ListArticlesInput) {
    const q = params.q?.trim();
    const category = params.category?.trim() || undefined;
    const tag = params.tag?.trim() || undefined;

    if (q) {
      const { ids, total } = await this.search.search({
        q,
        category,
        tag,
        page: params.page,
        limit: params.limit,
      });

      const articles = await this.articles.findByIds(ids, true);

      return {
        data: articles.map(ArticleResponseMapper.toSummary),
        meta: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages: total === 0 ? 0 : Math.ceil(total / params.limit),
        },
      };
    }

    const result = await this.articles.findMany({
      page: params.page,
      limit: params.limit,
      publishedOnly: true,
      categorySlug: category,
      tagSlug: tag,
    });

    return {
      data: result.data.map(ArticleResponseMapper.toSummary),
      meta: result.meta,
    };
  }
}
