import { ConfigService } from '@nestjs/config';

function parsePositiveInt(
  config: ConfigService,
  key: string,
  fallback: number,
): number {
  const raw = config.get<string | number>(key, fallback);
  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

export function getArticlesMaxAge(config: ConfigService): number {
  return parsePositiveInt(config, 'CACHE_ARTICLES_MAX_AGE', 60);
}

export function getSearchMaxAge(config: ConfigService): number {
  return parsePositiveInt(config, 'CACHE_SEARCH_MAX_AGE', 30);
}

export function getCatalogMaxAge(config: ConfigService): number {
  return parsePositiveInt(config, 'CACHE_CATALOG_MAX_AGE', 300);
}
