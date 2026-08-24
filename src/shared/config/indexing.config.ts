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

export function isAsyncIndexing(config: ConfigService): boolean {
  return config.get<string>('INDEXING_MODE', 'sync') === 'async';
}

export function getWorkerPollMs(config: ConfigService): number {
  return parsePositiveInt(config, 'INDEX_WORKER_POLL_MS', 2000);
}

export function getWorkerBatchSize(config: ConfigService): number {
  return parsePositiveInt(config, 'INDEX_WORKER_BATCH_SIZE', 5);
}

export function getWorkerMaxAttempts(config: ConfigService): number {
  return parsePositiveInt(config, 'INDEX_WORKER_MAX_ATTEMPTS', 5);
}
