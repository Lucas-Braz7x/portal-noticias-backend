import { Article } from '../../domain/entities/article.entity';

export interface ArticleSummaryResponse {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  author: string;
  category: string;
  tags: string[];
}

export class ArticleResponseMapper {
  static toSummary(article: Article): ArticleSummaryResponse {
    return {
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      publishedAt: article.publishedAt!.toISOString(),
      author: article.author.name,
      category: article.category.name,
      tags: article.tags.map((tag) => tag.name),
    };
  }
}
