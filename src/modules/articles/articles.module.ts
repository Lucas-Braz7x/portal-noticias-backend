import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ARTICLE_REPOSITORY } from './domain/repositories/article.repository';
import { AUTHOR_REPOSITORY } from './domain/repositories/author.repository';
import { CATEGORY_REPOSITORY } from './domain/repositories/category.repository';
import { SEARCH_REPOSITORY } from './domain/repositories/search.repository';
import { TAG_REPOSITORY } from './domain/repositories/tag.repository';
import { ArticlesService } from './application/articles.service';
import { opensearchClientProvider } from './infrastructure/opensearch/opensearch-client.provider';
import { isOpenSearchEnabled } from './infrastructure/opensearch/opensearch.config';
import { PrismaArticleRepository } from './infrastructure/repositories/prisma-article.repository';
import { PrismaAuthorRepository } from './infrastructure/repositories/prisma-author.repository';
import { PrismaCategoryRepository } from './infrastructure/repositories/prisma-category.repository';
import { PrismaTagRepository } from './infrastructure/repositories/prisma-tag.repository';
import { OpenSearchSearchRepository } from './infrastructure/repositories/opensearch-search.repository';
import { NoOpSearchRepository } from './infrastructure/repositories/noop-search.repository';
import { ArticlesSearchBootstrap } from './infrastructure/search/articles-search.bootstrap';
import { ArticlesController } from './presentation/articles.controller';
import { CategoriesController } from './presentation/categories.controller';
import { TagsController } from './presentation/tags.controller';

@Module({
  controllers: [ArticlesController, CategoriesController, TagsController],
  providers: [
    opensearchClientProvider,
    NoOpSearchRepository,
    OpenSearchSearchRepository,
    {
      provide: SEARCH_REPOSITORY,
      useFactory: (
        config: ConfigService,
        openSearchRepository: OpenSearchSearchRepository,
        noOpSearchRepository: NoOpSearchRepository,
      ) =>
        isOpenSearchEnabled(config)
          ? openSearchRepository
          : noOpSearchRepository,
      inject: [ConfigService, OpenSearchSearchRepository, NoOpSearchRepository],
    },
    ArticlesSearchBootstrap,
    ArticlesService,
    {
      provide: ARTICLE_REPOSITORY,
      useClass: PrismaArticleRepository,
    },
    {
      provide: AUTHOR_REPOSITORY,
      useClass: PrismaAuthorRepository,
    },
    {
      provide: CATEGORY_REPOSITORY,
      useClass: PrismaCategoryRepository,
    },
    {
      provide: TAG_REPOSITORY,
      useClass: PrismaTagRepository,
    },
  ],
})
export class ArticlesModule {}
