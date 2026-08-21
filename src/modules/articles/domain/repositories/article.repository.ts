import { Article } from '../entities/article.entity';

export interface ListArticlesParams {
  categorySlug?: string;
  tagSlug?: string;
  page: number;
  limit: number;
  publishedOnly?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const ARTICLE_REPOSITORY = Symbol('ARTICLE_REPOSITORY');

export interface IArticleRepository {
  findBySlug(slug: string): Promise<Article | null>;
  findByIds(ids: string[], publishedOnly?: boolean): Promise<Article[]>;
  findMany(params: ListArticlesParams): Promise<PaginatedResult<Article>>;
  save(article: Article): Promise<Article>;
  update(article: Article): Promise<Article>;
  existsBySlug(slug: string): Promise<boolean>;
}
