import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { Article } from '../../domain/entities/article.entity';
import { DuplicateSlugException } from '../../domain/exceptions/duplicate-slug.exception';
import {
  IArticleRepository,
  ListArticlesParams,
  PaginatedResult,
} from '../../domain/repositories/article.repository';
import { ArticleMapper } from '../mappers/article.mapper';

const articleInclude = {
  author: true,
  category: true,
  articleTags: {
    include: {
      tag: true,
    },
  },
} satisfies Prisma.ArticleInclude;

@Injectable()
export class PrismaArticleRepository implements IArticleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Article | null> {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: articleInclude,
    });

    return article ? ArticleMapper.toDomain(article) : null;
  }

  async findBySlug(slug: string): Promise<Article | null> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: articleInclude,
    });

    return article ? ArticleMapper.toDomain(article) : null;
  }

  async findByIds(ids: string[], publishedOnly = true): Promise<Article[]> {
    if (ids.length === 0) {
      return [];
    }

    const where: Prisma.ArticleWhereInput = {
      id: { in: ids },
    };

    if (publishedOnly) {
      where.publishedAt = {
        not: null,
        lte: new Date(),
      };
    }

    const articles = await this.prisma.article.findMany({
      where,
      include: articleInclude,
    });

    const articleMap = new Map(
      articles.map((article) => [article.id, article]),
    );

    return ids
      .filter((id) => articleMap.has(id))
      .map((id) => ArticleMapper.toDomain(articleMap.get(id)!));
  }

  async findMany(
    params: ListArticlesParams,
  ): Promise<PaginatedResult<Article>> {
    const where = this.buildWhereClause(params);
    const skip = (params.page - 1) * params.limit;

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: articleInclude,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: params.limit,
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      data: articles.map((article) => ArticleMapper.toDomain(article)),
      meta: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / params.limit),
      },
    };
  }

  async save(article: Article): Promise<Article> {
    try {
      const created = await this.prisma.article.create({
        data: {
          id: article.id,
          title: article.title,
          slug: article.slug,
          summary: article.summary,
          content: article.content,
          publishedAt: article.publishedAt,
          authorId: article.author.id,
          categoryId: article.category.id,
          articleTags: {
            create: article.tags.map((tag) => ({
              tagId: tag.id,
            })),
          },
        },
        include: articleInclude,
      });

      return ArticleMapper.toDomain(created);
    } catch (error) {
      this.rethrowDuplicateSlug(error, article.slug);
    }
  }

  async update(article: Article): Promise<Article> {
    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        await tx.articleTag.deleteMany({
          where: { articleId: article.id },
        });

        return tx.article.update({
          where: { id: article.id },
          data: {
            title: article.title,
            slug: article.slug,
            summary: article.summary,
            content: article.content,
            publishedAt: article.publishedAt,
            authorId: article.author.id,
            categoryId: article.category.id,
            articleTags: {
              create: article.tags.map((tag) => ({
                tagId: tag.id,
              })),
            },
          },
          include: articleInclude,
        });
      });

      return ArticleMapper.toDomain(updated);
    } catch (error) {
      this.rethrowDuplicateSlug(error, article.slug);
    }
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const count = await this.prisma.article.count({
      where: { slug },
    });

    return count > 0;
  }

  private rethrowDuplicateSlug(error: unknown, slug: string): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new DuplicateSlugException(slug);
    }

    throw error;
  }

  private buildWhereClause(
    params: ListArticlesParams,
  ): Prisma.ArticleWhereInput {
    const where: Prisma.ArticleWhereInput = {};

    if (params.publishedOnly ?? true) {
      where.publishedAt = {
        not: null,
        lte: new Date(),
      };
    }

    if (params.categorySlug) {
      where.category = { slug: params.categorySlug };
    }

    if (params.tagSlug) {
      where.articleTags = {
        some: {
          tag: { slug: params.tagSlug },
        },
      };
    }

    return where;
  }
}
