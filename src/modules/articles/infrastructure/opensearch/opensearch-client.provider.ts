import { Client } from '@opensearch-project/opensearch';
import { ConfigService } from '@nestjs/config';

export const OPENSEARCH_CLIENT = Symbol('OPENSEARCH_CLIENT');

export const opensearchClientProvider = {
  provide: OPENSEARCH_CLIENT,
  useFactory: (config: ConfigService): Client => {
    const node = config.get<string>('OPENSEARCH_NODE', 'http://localhost:9200');
    return new Client({ node });
  },
  inject: [ConfigService],
};
