import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ARTICLE_REPOSITORY,
  IArticleRepository,
} from '../../domain/repositories/article.repository';
import {
  SEARCH_REPOSITORY,
  ISearchRepository,
} from '../../domain/repositories/search.repository';
import { ArticleMapper } from '../mappers/article.mapper';
import { isOpenSearchEnabled } from '../opensearch/opensearch.config';
import { OpenSearchSearchRepository } from '../repositories/opensearch-search.repository';

@Injectable()
export class ArticlesSearchBootstrap implements OnModuleInit {
  constructor(
    @Inject(ARTICLE_REPOSITORY)
    private readonly articles: IArticleRepository,
    @Inject(SEARCH_REPOSITORY)
    private readonly search: ISearchRepository,
    private readonly openSearchRepository: OpenSearchSearchRepository,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!isOpenSearchEnabled(this.config)) {
      return;
    }

    await this.openSearchRepository.ensureIndex();

    const reindexOnStartup =
      this.config.get<string>('SEARCH_REINDEX_ON_STARTUP', 'true') === 'true';

    if (reindexOnStartup) {
      await this.reindexPublishedArticles();
    }
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
