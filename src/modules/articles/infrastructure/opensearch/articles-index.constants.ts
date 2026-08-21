export const ARTICLES_INDEX = 'articles';

export const ARTICLES_INDEX_MAPPINGS = {
  properties: {
    id: { type: 'keyword' },
    slug: { type: 'keyword' },
    title: { type: 'text' },
    summary: { type: 'text' },
    content: { type: 'text' },
    publishedAt: { type: 'date' },
    author: { type: 'keyword' },
    category: { type: 'keyword' },
    tags: {
      type: 'text',
      fields: {
        keyword: { type: 'keyword' },
      },
    },
  },
} as const;
