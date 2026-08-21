import { PrismaClient } from '@prisma/client';
import {
  ArticleAuthorRef,
  ArticleCategoryRef,
  ArticleTagRef,
} from '@/modules/articles/domain/entities/article.entity';

export async function seedAuthor(
  prisma: PrismaClient,
  name = 'Maria Silva',
): Promise<ArticleAuthorRef> {
  const author = await prisma.author.create({ data: { name } });
  return { id: author.id, name: author.name };
}

export async function seedCategory(
  prisma: PrismaClient,
  props: { name?: string; slug?: string } = {},
): Promise<ArticleCategoryRef> {
  const category = await prisma.category.create({
    data: {
      name: props.name ?? 'Tecnologia',
      slug: props.slug ?? 'tecnologia',
    },
  });

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
  };
}

export async function seedTag(
  prisma: PrismaClient,
  props: { name?: string; slug?: string } = {},
): Promise<ArticleTagRef> {
  const tag = await prisma.tag.create({
    data: {
      name: props.name ?? 'IA',
      slug: props.slug ?? 'ia',
    },
  });

  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
  };
}

export async function seedArticleRefs(prisma: PrismaClient): Promise<{
  author: ArticleAuthorRef;
  category: ArticleCategoryRef;
  tags: ArticleTagRef[];
}> {
  const author = await seedAuthor(prisma);
  const category = await seedCategory(prisma);
  const tags = [await seedTag(prisma)];

  return { author, category, tags };
}
