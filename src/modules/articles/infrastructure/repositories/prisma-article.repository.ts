import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { Article } from '../../domain/entities/article.entity';
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

  async findBySlug(slug: string): Promise<Article | null> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: articleInclude,
    });

    return article ? ArticleMapper.toDomain(article) : null;
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
  }

  async update(article: Article): Promise<Article> {
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
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const count = await this.prisma.article.count({
      where: { slug },
    });

    return count > 0;
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
