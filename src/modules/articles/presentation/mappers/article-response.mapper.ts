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

export interface ArticleDetailResponse extends ArticleSummaryResponse {
  content: string;
}

export interface ArticleIngestResponse {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  publishedAt: string | null;
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

  static toDetail(article: Article): ArticleDetailResponse {
    return {
      ...ArticleResponseMapper.toSummary(article),
      content: article.content,
    };
  }

  static toIngest(article: Article): ArticleIngestResponse {
    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      content: article.content,
      publishedAt: article.publishedAt?.toISOString() ?? null,
      author: article.author.name,
      category: article.category.name,
      tags: article.tags.map((tag) => tag.name),
    };
  }
}
