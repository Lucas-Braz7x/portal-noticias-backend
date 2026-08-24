import { Article } from '@/modules/articles/domain/entities/article.entity';
import { ArticleResponseMapper } from '@/modules/articles/presentation/mappers/article-response.mapper';

const author = { id: 'author-1', name: 'Maria Silva' };
const category = { id: 'cat-1', name: 'Política', slug: 'politica' };
const tags = [{ id: 'tag-1', name: 'Eleições', slug: 'eleicoes' }];

describe('ArticleResponseMapper', () => {
  it('toIngest includes id and nullable publishedAt for published article', () => {
    const article = Article.create({
      title: 'Como a IA está mudando o jornalismo',
      summary: 'Resumo do artigo',
      content: 'Conteúdo completo',
      author,
      category,
      tags,
      publishedAt: new Date('2026-01-15T10:00:00Z'),
    });

    expect(ArticleResponseMapper.toIngest(article)).toEqual({
      id: article.id,
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      content: article.content,
      publishedAt: '2026-01-15T10:00:00.000Z',
      indexingStatus: 'completed',
      author: 'Maria Silva',
      category: { name: 'Política', slug: 'politica' },
      tags: [{ name: 'Eleições', slug: 'eleicoes' }],
    });
  });

  it('toIngest serializes draft publishedAt as null', () => {
    const article = Article.create({
      title: 'Rascunho',
      summary: 'Resumo',
      content: 'Conteúdo',
      author,
      category,
      tags: [],
    });

    const result = ArticleResponseMapper.toIngest(article);

    expect(result.id).toBe(article.id);
    expect(result.publishedAt).toBeNull();
    expect(result.content).toBe('Conteúdo');
  });
});
