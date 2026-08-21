import { Article } from '@/modules/articles/domain/entities/article.entity';
import { ArticleMapper } from '@/modules/articles/infrastructure/mappers/article.mapper';

describe('ArticleMapper', () => {
  const author = { id: 'author-1', name: 'Maria Silva' };
  const category = { id: 'cat-1', name: 'Tecnologia', slug: 'tecnologia' };
  const tags = [{ id: 'tag-1', name: 'IA', slug: 'ia' }];

  it('maps domain article to search document', () => {
    const article = Article.create({
      title: 'Título de teste',
      summary: 'Resumo',
      content: 'Conteúdo',
      author,
      category,
      tags,
      publishedAt: new Date('2026-01-15T10:00:00Z'),
    });

    const document = ArticleMapper.toSearchDocument(article);

    expect(document).toEqual({
      id: article.id,
      slug: article.slug,
      title: 'Título de teste',
      summary: 'Resumo',
      content: 'Conteúdo',
      publishedAt: '2026-01-15T10:00:00.000Z',
      author: 'Maria Silva',
      category: 'tecnologia',
      tags: ['ia'],
    });
  });

  it('maps draft article with null publishedAt to search document', () => {
    const article = Article.create({
      title: 'Rascunho',
      summary: 'Resumo',
      content: 'Conteúdo',
      author,
      category,
      tags,
    });

    const document = ArticleMapper.toSearchDocument(article);

    expect(document.publishedAt).toBeNull();
  });

  it('maps prisma model to domain article', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    const updatedAt = new Date('2026-01-02T00:00:00Z');

    const article = ArticleMapper.toDomain({
      id: 'article-1',
      title: 'Artigo',
      slug: 'artigo',
      summary: 'Resumo',
      content: 'Conteúdo',
      publishedAt: createdAt,
      authorId: author.id,
      categoryId: category.id,
      createdAt,
      updatedAt,
      author: {
        id: author.id,
        name: author.name,
        createdAt,
        updatedAt,
      },
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        createdAt,
        updatedAt,
      },
      articleTags: [
        {
          articleId: 'article-1',
          tagId: tags[0].id,
          tag: {
            id: tags[0].id,
            name: tags[0].name,
            slug: tags[0].slug,
            createdAt,
            updatedAt,
          },
        },
      ],
    });

    expect(article.id).toBe('article-1');
    expect(article.author).toEqual(author);
    expect(article.category).toEqual(category);
    expect(article.tags).toEqual(tags);
  });
});
