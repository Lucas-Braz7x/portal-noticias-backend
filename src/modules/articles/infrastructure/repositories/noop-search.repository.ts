import { Injectable } from '@nestjs/common';
import { SearchUnavailableException } from '../../domain/exceptions/search-unavailable.exception';
import {
  ISearchRepository,
  SearchArticleDocument,
  SearchArticlesParams,
} from '../../domain/repositories/search.repository';

@Injectable()
export class NoOpSearchRepository implements ISearchRepository {
  index(_document: SearchArticleDocument): Promise<void> {
    return Promise.resolve();
  }

  search(_params: SearchArticlesParams): Promise<{
    ids: string[];
    total: number;
  }> {
    return Promise.reject(new SearchUnavailableException());
  }

  remove(_id: string): Promise<void> {
    return Promise.resolve();
  }
}
