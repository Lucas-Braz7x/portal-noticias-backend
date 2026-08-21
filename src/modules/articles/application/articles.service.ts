import { Inject, Injectable } from '@nestjs/common';
import {
  ARTICLE_REPOSITORY,
  IArticleRepository,
} from '../domain/repositories/article.repository';
import { ArticleResponseMapper } from '../presentation/mappers/article-response.mapper';

export interface ListArticlesInput {
  page: number;
  limit: number;
}

@Injectable()
export class ArticlesService {
  constructor(
    @Inject(ARTICLE_REPOSITORY)
    private readonly articles: IArticleRepository,
  ) {}

  async list(params: ListArticlesInput) {
    const result = await this.articles.findMany({
      page: params.page,
      limit: params.limit,
      publishedOnly: true,
    });

    return {
      data: result.data.map(ArticleResponseMapper.toSummary),
      meta: result.meta,
    };
  }
}
