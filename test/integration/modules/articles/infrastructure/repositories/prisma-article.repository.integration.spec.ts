import { PrismaService } from '@/prisma/prisma.service';
import { Article } from '@/modules/articles/domain/entities/article.entity';
import { PrismaArticleRepository } from '@/modules/articles/infrastructure/repositories/prisma-article.repository';
import { getTestPrisma } from '../../../../helpers/database.helper';
import {
  seedArticleRefs,
  seedCategory,
  seedTag,
} from '../../../../helpers/fixtures.helper';

describe('PrismaArticleRepository (integration)', () => {
  let repository: PrismaArticleRepository;

  beforeEach(() => {
    repository = new PrismaArticleRepository(
      getTestPrisma() as unknown as PrismaService,
    );
  });

  it('findBySlug returns null when article is not found', async () => {
    await expect(repository.findBySlug('inexistente')).resolves.toBeNull();
  });

  it('findBySlug returns persisted article with relations', async () => {
    const prisma = getTestPrisma();
    const { author, category, tags } = await seedArticleRefs(prisma);

    const article = Article.create({
      title: 'Artigo',
      summary: 'Resumo',
      content: 'Conteúdo',
      author,
      category,
      tags,
      publishedAt: new Date('2026-01-01T00:00:00Z'),
    });

    await repository.save(article);

    const found = await repository.findBySlug(article.slug);

    expect(found?.id).toBe(article.id);
    expect(found?.author).toEqual(author);
    expect(found?.tags).toHaveLength(1);
  });

  it('findMany applies pagination and published filters by default', async () => {
    const prisma = getTestPrisma();
    const { author, category, tags } = await seedArticleRefs(prisma);
    const publishedAt = new Date('2026-01-01T00:00:00Z');

    for (let index = 0; index < 21; index += 1) {
      const article = Article.create({
        title: `Artigo ${index}`,
        summary: 'Resumo',
        content: 'Conteúdo',
        author,
        category,
        tags,
        publishedAt: new Date(publishedAt.getTime() - index * 60_000),
      });
      await repository.save(article);
    }

    const result = await repository.findMany({ page: 2, limit: 10 });

    expect(result.data).toHaveLength(10);
    expect(result.meta).toEqual({
      page: 2,
      limit: 10,
      total: 21,
      totalPages: 3,
    });
  });

  it('findMany returns zero total pages when there are no results', async () => {
    const result = await repository.findMany({ page: 1, limit: 10 });

    expect(result.meta.totalPages).toBe(0);
    expect(result.data).toHaveLength(0);
  });

  it('findMany filters by category and tag slugs', async () => {
    const prisma = getTestPrisma();
    const { author, tags } = await seedArticleRefs(prisma);
    const otherCategory = await seedCategory(prisma, {
      name: 'Esportes',
      slug: 'esportes',
    });
    const otherTag = await seedTag(prisma, { name: 'Futebol', slug: 'futebol' });

    const matching = Article.create({
      title: 'Com IA',
      summary: 'Resumo',
      content: 'Conteúdo',
      author,
      category: otherCategory,
      tags,
      publishedAt: new Date('2026-01-01T00:00:00Z'),
    });

    const nonMatching = Article.create({
      title: 'Sem IA',
      summary: 'Resumo',
      content: 'Conteúdo',
      author,
      category: otherCategory,
      tags: [otherTag],
      publishedAt: new Date('2026-01-01T00:00:00Z'),
    });

    await repository.save(matching);
    await repository.save(nonMatching);

    const result = await repository.findMany({
      page: 1,
      limit: 10,
      categorySlug: 'esportes',
      tagSlug: 'ia',
      publishedOnly: false,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].slug).toBe(matching.slug);
  });

  it('save creates article with nested tags', async () => {
    const prisma = getTestPrisma();
    const { author, category, tags } = await seedArticleRefs(prisma);
    const publishedAt = new Date('2026-01-01T00:00:00Z');

    const article = Article.create({
      title: 'Novo artigo',
      summary: 'Resumo',
      content: 'Conteúdo',
      author,
      category,
      tags,
      publishedAt,
    });

    const saved = await repository.save(article);

    const persisted = await prisma.article.findUnique({
      where: { id: article.id },
      include: { articleTags: true },
    });

    expect(saved.slug).toBe(article.slug);
    expect(persisted?.title).toBe('Novo artigo');
    expect(persisted?.articleTags).toHaveLength(1);
  });

  it('update replaces article tags inside a transaction', async () => {
    const prisma = getTestPrisma();
    const { author, category, tags } = await seedArticleRefs(prisma);
    const newTag = await seedTag(prisma, { name: 'Next.js', slug: 'next-js' });
    const publishedAt = new Date('2026-01-01T00:00:00Z');

    const article = Article.create({
      title: 'Artigo',
      summary: 'Resumo',
      content: 'Conteúdo',
      author,
      category,
      tags,
      publishedAt,
    });

    await repository.save(article);

    article.update({
      title: 'Artigo atualizado',
      tags: [newTag],
    });

    const updated = await repository.update(article);

    const persistedTags = await prisma.articleTag.findMany({
      where: { articleId: article.id },
    });

    expect(updated.title).toBe('Artigo atualizado');
    expect(persistedTags).toHaveLength(1);
    expect(persistedTags[0].tagId).toBe(newTag.id);
  });

  it('existsBySlug returns true when article exists', async () => {
    const prisma = getTestPrisma();
    const { author, category, tags } = await seedArticleRefs(prisma);

    const article = Article.create({
      title: 'Artigo',
      summary: 'Resumo',
      content: 'Conteúdo',
      author,
      category,
      tags,
      publishedAt: new Date('2026-01-01T00:00:00Z'),
    });

    await repository.save(article);

    await expect(repository.existsBySlug(article.slug)).resolves.toBe(true);
  });

  it('existsBySlug returns false when article does not exist', async () => {
    await expect(repository.existsBySlug('inexistente')).resolves.toBe(false);
  });
});
