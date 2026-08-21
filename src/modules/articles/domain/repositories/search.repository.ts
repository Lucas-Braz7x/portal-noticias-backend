export interface SearchArticleDocument {
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

export interface SearchArticlesParams {
  q: string;
  category?: string;
  tag?: string;
  page: number;
  limit: number;
}

export const SEARCH_REPOSITORY = Symbol('SEARCH_REPOSITORY');

export interface ISearchRepository {
  index(document: SearchArticleDocument): Promise<void>;
  search(params: SearchArticlesParams): Promise<{
    ids: string[];
    total: number;
  }>;
  remove(id: string): Promise<void>;
}
