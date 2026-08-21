import { Module } from '@nestjs/common';
import { ARTICLE_REPOSITORY } from './domain/repositories/article.repository';
import { ArticlesService } from './application/articles.service';
import { PrismaArticleRepository } from './infrastructure/repositories/prisma-article.repository';
import { ArticlesController } from './presentation/articles.controller';

@Module({
  controllers: [ArticlesController],
  providers: [
    ArticlesService,
    {
      provide: ARTICLE_REPOSITORY,
      useClass: PrismaArticleRepository,
    },
  ],
})
export class ArticlesModule {}
