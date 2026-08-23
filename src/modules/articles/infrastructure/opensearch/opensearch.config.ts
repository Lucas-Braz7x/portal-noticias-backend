import { ConfigService } from '@nestjs/config';

export function isOpenSearchEnabled(config: ConfigService): boolean {
  return config.get<string>('OPENSEARCH_ENABLED', 'true') === 'true';
}
