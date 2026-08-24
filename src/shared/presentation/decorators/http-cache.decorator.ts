import { SetMetadata } from '@nestjs/common';

export const HTTP_CACHE_KEY = 'http_cache';

export type HttpCacheProfile = 'articles' | 'catalog';

export interface HttpCacheOptions {
  profile?: HttpCacheProfile;
  noStore?: boolean;
  searchAware?: boolean;
}

export const HttpCache = (options: HttpCacheOptions) =>
  SetMetadata(HTTP_CACHE_KEY, options);
