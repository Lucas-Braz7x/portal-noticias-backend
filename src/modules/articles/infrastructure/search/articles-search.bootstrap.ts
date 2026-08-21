import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import {
  ARTICLE_REPOSITORY,
  IArticleRepository,
} from '../../domain/repositories/article.repository';
import {
  SEARCH_REPOSITORY,
  ISearchRepository,
} from '../../domain/repositories/search.repository';
import { ArticleMapper } from '../mappers/article.mapper';
import { OpenSearchSearchRepository } from '../repositories/opensearch-search.repository';

@Injectable()
export class ArticlesSearchBootstrap implements OnModuleInit {
  constructor(
    @Inject(ARTICLE_REPOSITORY)
    private readonly articles: IArticleRepository,
    @Inject(SEARCH_REPOSITORY)
    private readonly search: ISearchRepository,
    private readonly openSearchRepository: OpenSearchSearchRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.openSearchRepository.ensureIndex();
    await this.reindexPublishedArticles();
  }

  private async reindexPublishedArticles(): Promise<void> {
    const pageSize = 100;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const result = await this.articles.findMany({
        page,
        limit: pageSize,
        publishedOnly: true,
      });

      for (const article of result.data) {
        await this.search.index(ArticleMapper.toSearchDocument(article));
      }

      hasMore = result.data.length === pageSize;
      page += 1;
    }
  }
}
