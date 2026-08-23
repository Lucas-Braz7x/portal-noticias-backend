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

  it('findMany excludes drafts and future articles by default', async () => {
    const prisma = getTestPrisma();
    const { author, category, tags } = await seedArticleRefs(prisma);

    const published = Article.create({
      title: 'Publicado',
      summary: 'Resumo',
      content: 'Conteúdo',
      author,
      category,
      tags,
      publishedAt: new Date('2026-01-01T00:00:00Z'),
    });
    const draft = Article.create({
      title: 'Rascunho',
      summary: 'Resumo',
      content: 'Conteúdo',
      author,
      category,
      tags,
    });
    const scheduled = Article.create({
      title: 'Agendado',
      summary: 'Resumo',
      content: 'Conteúdo',
      author,
      category,
      tags,
      publishedAt: new Date('2099-01-01T00:00:00Z'),
    });

    await repository.save(published);
    await repository.save(draft);
    await repository.save(scheduled);

    const result = await repository.findMany({ page: 1, limit: 10 });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].slug).toBe(published.slug);
    expect(result.meta.total).toBe(1);
  });

  it('findByIds returns articles preserving OpenSearch relevance order', async () => {
    const prisma = getTestPrisma();
    const { author, category, tags } = await seedArticleRefs(prisma);

    const first = Article.create({
      title: 'Primeiro',
      summary: 'Resumo',
      content: 'Conteúdo',
      author,
      category,
      tags,
      publishedAt: new Date('2026-01-01T00:00:00Z'),
    });
    const second = Article.create({
      title: 'Segundo',
      summary: 'Resumo',
      content: 'Conteúdo',
      author,
      category,
      tags,
      publishedAt: new Date('2026-01-02T00:00:00Z'),
    });

    await repository.save(first);
    await repository.save(second);

    const result = await repository.findByIds([second.id, first.id], true);

    expect(result.map((article) => article.id)).toEqual([second.id, first.id]);
  });

  it('findByIds excludes unpublished articles when publishedOnly is true', async () => {
    const prisma = getTestPrisma();
    const { author, category, tags } = await seedArticleRefs(prisma);

    const published = Article.create({
      title: 'Publicado',
      summary: 'Resumo',
      content: 'Conteúdo',
      author,
      category,
      tags,
      publishedAt: new Date('2026-01-01T00:00:00Z'),
    });
    const draft = Article.create({
      title: 'Rascunho',
      summary: 'Resumo',
      content: 'Conteúdo',
      author,
      category,
      tags,
    });

    await repository.save(published);
    await repository.save(draft);

    const result = await repository.findByIds([draft.id, published.id], true);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(published.id);
  });

  it('findByIds returns empty array when ids is empty', async () => {
    await expect(repository.findByIds([])).resolves.toEqual([]);
  });

  it('findMany filters by category and tag slugs', async () => {
    const prisma = getTestPrisma();
    const { author, tags } = await seedArticleRefs(prisma);
    const otherCategory = await seedCategory(prisma, {
      name: 'Esportes',
      slug: 'esportes',
    });
    const otherTag = await seedTag(prisma, {
      name: 'Futebol',
      slug: 'futebol',
    });

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

  it('findMany with q matches title, summary, content or tag name', async () => {
    const prisma = getTestPrisma();
    const { author, category, tags } = await seedArticleRefs(prisma);
    const publishedAt = new Date('2026-01-01T00:00:00Z');

    const byTitle = Article.create({
      title: 'Blockchain no mercado financeiro',
      summary: 'Resumo A',
      content: 'Conteúdo A',
      author,
      category,
      tags,
      publishedAt,
    });
    const bySummary = Article.create({
      title: 'Artigo B',
      summary: 'Economia verde em alta',
      content: 'Conteúdo B',
      author,
      category,
      tags,
      publishedAt,
    });
    const byContent = Article.create({
      title: 'Artigo C',
      summary: 'Resumo C',
      content: 'Detalhes sobre inteligência artificial',
      author,
      category,
      tags,
      publishedAt,
    });
    const byTag = Article.create({
      title: 'Artigo D',
      summary: 'Resumo D',
      content: 'Conteúdo D',
      author,
      category,
      tags: [await seedTag(prisma, { name: 'Fintech', slug: 'fintech' })],
      publishedAt,
    });
    const unrelated = Article.create({
      title: 'Outro assunto',
      summary: 'Resumo',
      content: 'Conteúdo',
      author,
      category,
      tags,
      publishedAt,
    });

    await repository.save(byTitle);
    await repository.save(bySummary);
    await repository.save(byContent);
    await repository.save(byTag);
    await repository.save(unrelated);

    const titleResult = await repository.findMany({
      page: 1,
      limit: 10,
      q: 'blockchain',
      publishedOnly: false,
    });
    expect(titleResult.data.map((article) => article.slug)).toEqual([
      byTitle.slug,
    ]);

    const summaryResult = await repository.findMany({
      page: 1,
      limit: 10,
      q: 'economia verde',
      publishedOnly: false,
    });
    expect(summaryResult.data.map((article) => article.slug)).toEqual([
      bySummary.slug,
    ]);

    const contentResult = await repository.findMany({
      page: 1,
      limit: 10,
      q: 'inteligência artificial',
      publishedOnly: false,
    });
    expect(contentResult.data.map((article) => article.slug)).toEqual([
      byContent.slug,
    ]);

    const tagResult = await repository.findMany({
      page: 1,
      limit: 10,
      q: 'fintech',
      publishedOnly: false,
    });
    expect(tagResult.data.map((article) => article.slug)).toEqual([byTag.slug]);
  });

  it('findMany with q returns empty result when there is no match', async () => {
    const prisma = getTestPrisma();
    const { author, category, tags } = await seedArticleRefs(prisma);

    await repository.save(
      Article.create({
        title: 'Artigo',
        summary: 'Resumo',
        content: 'Conteúdo',
        author,
        category,
        tags,
        publishedAt: new Date('2026-01-01T00:00:00Z'),
      }),
    );

    const result = await repository.findMany({
      page: 1,
      limit: 10,
      q: 'termo-inexistente',
      publishedOnly: false,
    });

    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
    expect(result.meta.totalPages).toBe(0);
  });

  it('findMany with q combines text search with category and tag filters', async () => {
    const prisma = getTestPrisma();
    const { author, tags } = await seedArticleRefs(prisma);
    const sportsCategory = await seedCategory(prisma, {
      name: 'Esportes',
      slug: 'esportes',
    });
    const politicsCategory = await seedCategory(prisma, {
      name: 'Política',
      slug: 'politica',
    });
    const publishedAt = new Date('2026-01-01T00:00:00Z');

    const matching = Article.create({
      title: 'Futebol e tecnologia',
      summary: 'Resumo',
      content: 'Conteúdo',
      author,
      category: sportsCategory,
      tags,
      publishedAt,
    });
    const wrongCategory = Article.create({
      title: 'Futebol na política',
      summary: 'Resumo',
      content: 'Conteúdo',
      author,
      category: politicsCategory,
      tags,
      publishedAt,
    });

    await repository.save(matching);
    await repository.save(wrongCategory);

    const result = await repository.findMany({
      page: 1,
      limit: 10,
      q: 'futebol',
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

  it('findById returns persisted article including drafts', async () => {
    const prisma = getTestPrisma();
    const { author, category, tags } = await seedArticleRefs(prisma);

    const draft = Article.create({
      title: 'Rascunho',
      summary: 'Resumo',
      content: 'Conteúdo',
      author,
      category,
      tags,
    });

    await repository.save(draft);

    const found = await repository.findById(draft.id);

    expect(found?.id).toBe(draft.id);
    expect(found?.publishedAt).toBeNull();
    expect(found?.author).toEqual(author);
  });

  it('findById returns null when article is not found', async () => {
    await expect(
      repository.findById('00000000-0000-4000-8000-000000000000'),
    ).resolves.toBeNull();
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
