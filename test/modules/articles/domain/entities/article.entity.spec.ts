import { Article } from '@/modules/articles/domain/entities/article.entity';

const author = { id: 'author-1', name: 'Maria Silva' };
const category = { id: 'cat-1', name: 'Tecnologia', slug: 'tecnologia' };
const tags = [
  { id: 'tag-1', name: 'IA', slug: 'ia' },
  { id: 'tag-2', name: 'Next.js', slug: 'nextjs' },
];

describe('Article', () => {
  describe('create', () => {
    it('creates article with generated slug', () => {
      const article = Article.create({
        title: 'Como a IA está mudando o jornalismo',
        summary: 'Resumo do artigo',
        content: 'Conteúdo completo',
        author,
        category,
        tags,
        publishedAt: new Date('2026-01-15T10:00:00Z'),
      });

      expect(article.slug).toBe('como-a-ia-esta-mudando-o-jornalismo');
      expect(article.title).toBe('Como a IA está mudando o jornalismo');
      expect(article.author).toEqual(author);
      expect(article.category).toEqual(category);
      expect(article.tags).toEqual(tags);
      expect(article.id).toBeDefined();
    });

    it('creates article with explicit slug', () => {
      const article = Article.create({
        title: 'Título qualquer',
        summary: 'Resumo',
        content: 'Conteúdo',
        author,
        category,
        tags: [],
        slug: 'slug-customizado',
      });

      expect(article.slug).toBe('slug-customizado');
    });

    it('allows draft without publishedAt', () => {
      const article = Article.create({
        title: 'Rascunho',
        summary: 'Resumo',
        content: 'Conteúdo',
        author,
        category,
        tags: [],
      });

      expect(article.publishedAt).toBeNull();
      expect(article.isPublished()).toBe(false);
    });

    it('throws when title is empty', () => {
      expect(() =>
        Article.create({
          title: '  ',
          summary: 'Resumo',
          content: 'Conteúdo',
          author,
          category,
          tags: [],
        }),
      ).toThrow('Title cannot be empty');
    });

    it('throws when author is missing', () => {
      expect(() =>
        Article.create({
          title: 'Título',
          summary: 'Resumo',
          content: 'Conteúdo',
          author: { id: '', name: '' },
          category,
          tags: [],
        }),
      ).toThrow('Author is required');
    });

    it('throws when category is missing', () => {
      expect(() =>
        Article.create({
          title: 'Título',
          summary: 'Resumo',
          content: 'Conteúdo',
          author,
          category: { id: '', name: 'X', slug: '' },
          tags: [],
        }),
      ).toThrow('Category is required');
    });
  });

  describe('update', () => {
    it('updates mutable fields', () => {
      const article = Article.create({
        title: 'Título original',
        summary: 'Resumo original',
        content: 'Conteúdo original',
        author,
        category,
        tags,
      });

      const beforeUpdate = article.updatedAt;

      article.update({
        title: 'Título atualizado',
        summary: 'Resumo atualizado',
        publishedAt: new Date('2026-02-01T12:00:00Z'),
      });

      expect(article.title).toBe('Título atualizado');
      expect(article.summary).toBe('Resumo atualizado');
      expect(article.publishedAt).toEqual(new Date('2026-02-01T12:00:00Z'));
      expect(article.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
    });

    it('updates content, slug, author, category and tags', () => {
      const article = Article.create({
        title: 'Título original',
        summary: 'Resumo original',
        content: 'Conteúdo original',
        author,
        category,
        tags: [tags[0]],
      });

      const newAuthor = { id: 'author-2', name: 'João Souza' };
      const newCategory = {
        id: 'cat-2',
        name: 'Esportes',
        slug: 'esportes',
      };

      article.update({
        content: 'Conteúdo atualizado',
        slug: 'slug-atualizado',
        author: newAuthor,
        category: newCategory,
        tags: [tags[1]],
      });

      expect(article.content).toBe('Conteúdo atualizado');
      expect(article.slug).toBe('slug-atualizado');
      expect(article.author).toEqual(newAuthor);
      expect(article.category).toEqual(newCategory);
      expect(article.tags).toEqual([tags[1]]);
    });

    it('throws when updated author is invalid', () => {
      const article = Article.create({
        title: 'Título',
        summary: 'Resumo',
        content: 'Conteúdo',
        author,
        category,
        tags: [],
      });

      expect(() =>
        article.update({ author: { id: '', name: '  ' } }),
      ).toThrow('Author is required');
    });

    it('throws when updated category is invalid', () => {
      const article = Article.create({
        title: 'Título',
        summary: 'Resumo',
        content: 'Conteúdo',
        author,
        category,
        tags: [],
      });

      expect(() =>
        article.update({ category: { id: '', name: 'X', slug: '' } }),
      ).toThrow('Category is required');
    });
  });

  describe('isPublished', () => {
    it('returns true when publishedAt is in the past', () => {
      const article = Article.create({
        title: 'Publicado',
        summary: 'Resumo',
        content: 'Conteúdo',
        author,
        category,
        tags: [],
        publishedAt: new Date('2026-01-01T00:00:00Z'),
      });

      expect(article.isPublished(new Date('2026-06-01T00:00:00Z'))).toBe(true);
    });

    it('returns false when publishedAt is in the future', () => {
      const article = Article.create({
        title: 'Agendado',
        summary: 'Resumo',
        content: 'Conteúdo',
        author,
        category,
        tags: [],
        publishedAt: new Date('2026-12-01T00:00:00Z'),
      });

      expect(article.isPublished(new Date('2026-06-01T00:00:00Z'))).toBe(false);
    });

    it('returns false when publishedAt is null', () => {
      const article = Article.create({
        title: 'Rascunho',
        summary: 'Resumo',
        content: 'Conteúdo',
        author,
        category,
        tags: [],
      });

      expect(article.isPublished()).toBe(false);
    });
  });

  describe('reconstitute', () => {
    it('rebuilds article from persistence data', () => {
      const createdAt = new Date('2026-01-01T00:00:00Z');
      const updatedAt = new Date('2026-01-02T00:00:00Z');

      const article = Article.reconstitute({
        id: 'article-1',
        slug: 'artigo-existente',
        title: 'Artigo existente',
        summary: 'Resumo',
        content: 'Conteúdo',
        publishedAt: createdAt,
        author,
        category,
        tags,
        createdAt,
        updatedAt,
      });

      expect(article.id).toBe('article-1');
      expect(article.slug).toBe('artigo-existente');
      expect(article.createdAt).toEqual(createdAt);
      expect(article.updatedAt).toEqual(updatedAt);
    });
  });
});
