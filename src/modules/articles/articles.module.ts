import { Module } from '@nestjs/common';
import { ARTICLE_REPOSITORY } from './domain/repositories/article.repository';
import { SEARCH_REPOSITORY } from './domain/repositories/search.repository';
import { ArticlesService } from './application/articles.service';
import { opensearchClientProvider } from './infrastructure/opensearch/opensearch-client.provider';
import { PrismaArticleRepository } from './infrastructure/repositories/prisma-article.repository';
import { OpenSearchSearchRepository } from './infrastructure/repositories/opensearch-search.repository';
import { ArticlesSearchBootstrap } from './infrastructure/search/articles-search.bootstrap';
import { ArticlesController } from './presentation/articles.controller';

@Module({
  controllers: [ArticlesController],
  providers: [
    opensearchClientProvider,
    OpenSearchSearchRepository,
    {
      provide: SEARCH_REPOSITORY,
      useExisting: OpenSearchSearchRepository,
    },
    ArticlesSearchBootstrap,
    ArticlesService,
    {
      provide: ARTICLE_REPOSITORY,
      useClass: PrismaArticleRepository,
    },
  ],
})
export class ArticlesModule {}
