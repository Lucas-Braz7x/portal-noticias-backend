import type {
  Article as PrismaArticle,
  ArticleTag,
  Author,
  Category,
  Tag,
} from '@prisma/client';
import { Article } from '../../domain/entities/article.entity';
import type { SearchArticleDocument } from '../../domain/repositories/search.repository';

export type ArticleWithRelations = PrismaArticle & {
  author: Author;
  category: Category;
  articleTags: Array<ArticleTag & { tag: Tag }>;
};

export class ArticleMapper {
  static toDomain(model: ArticleWithRelations): Article {
    return Article.reconstitute({
      id: model.id,
      slug: model.slug,
      title: model.title,
      summary: model.summary,
      content: model.content,
      publishedAt: model.publishedAt,
      author: {
        id: model.author.id,
        name: model.author.name,
      },
      category: {
        id: model.category.id,
        name: model.category.name,
        slug: model.category.slug,
      },
      tags: model.articleTags.map(({ tag }) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
      })),
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  static toSearchDocument(article: Article): SearchArticleDocument {
    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      content: article.content,
      publishedAt: article.publishedAt?.toISOString() ?? null,
      author: article.author.name,
      category: article.category.slug,
      tags: article.tags.map((tag) => tag.slug),
    };
  }
}
