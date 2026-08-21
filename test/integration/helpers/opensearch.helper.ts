import { Client } from '@opensearch-project/opensearch';
import { ARTICLES_INDEX } from '@/modules/articles/infrastructure/opensearch/articles-index.constants';

export function getOpenSearchNode(): string {
  return process.env.OPENSEARCH_NODE ?? 'http://localhost:9200';
}

export async function isOpenSearchAvailable(): Promise<boolean> {
  const client = new Client({ node: getOpenSearchNode() });

  try {
    await client.cluster.health({ timeout: '2s' });
    return true;
  } catch {
    return false;
  }
}

export async function clearOpenSearchIndex(client: Client): Promise<void> {
  await client.deleteByQuery({
    index: ARTICLES_INDEX,
    body: { query: { match_all: {} } },
    refresh: true,
    wait_for_completion: true,
  });
}
