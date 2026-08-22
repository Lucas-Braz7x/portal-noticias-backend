import { Inject, Injectable } from '@nestjs/common';
import { Article } from '../domain/entities/article.entity';
import { Author } from '../domain/entities/author.entity';
import { Category } from '../domain/entities/category.entity';
import { Tag } from '../domain/entities/tag.entity';
import { ArticleNotFoundException } from '../domain/exceptions/article-not-found.exception';
import {
  ARTICLE_REPOSITORY,
  IArticleRepository,
} from '../domain/repositories/article.repository';
import {
  AUTHOR_REPOSITORY,
  IAuthorRepository,
} from '../domain/repositories/author.repository';
import {
  CATEGORY_REPOSITORY,
  ICategoryRepository,
} from '../domain/repositories/category.repository';
import {
  SEARCH_REPOSITORY,
  ISearchRepository,
} from '../domain/repositories/search.repository';
import {
  TAG_REPOSITORY,
  ITagRepository,
} from '../domain/repositories/tag.repository';
import { Slug } from '../domain/value-objects/slug.vo';
import { ArticleMapper } from '../infrastructure/mappers/article.mapper';
import { ArticleResponseMapper } from '../presentation/mappers/article-response.mapper';
import { ReferenceResponseMapper } from '../presentation/mappers/reference-response.mapper';

export interface ListArticlesInput {
  q?: string;
  category?: string;
  tag?: string;
  page: number;
  limit: number;
}

export interface CreateArticleInput {
  title: string;
  summary: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  publishedAt?: string;
}

export interface UpdateArticleInput {
  title?: string;
  summary?: string;
  content?: string;
  author?: string;
  category?: string;
  tags?: string[];
  publishedAt?: string | null;
}

@Injectable()
export class ArticlesService {
  constructor(
    @Inject(ARTICLE_REPOSITORY)
    private readonly articles: IArticleRepository,
    @Inject(SEARCH_REPOSITORY)
    private readonly search: ISearchRepository,
    @Inject(AUTHOR_REPOSITORY)
    private readonly authors: IAuthorRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categories: ICategoryRepository,
    @Inject(TAG_REPOSITORY)
    private readonly tags: ITagRepository,
  ) {}

  async list(params: ListArticlesInput) {
    const q = params.q?.trim();
    const category = params.category?.trim() || undefined;
    const tag = params.tag?.trim() || undefined;

    if (q) {
      const { ids, total } = await this.search.search({
        q,
        category,
        tag,
        page: params.page,
        limit: params.limit,
      });

      const articles = await this.articles.findByIds(ids, true);

      return {
        data: articles.map((article) =>
          ArticleResponseMapper.toSummary(article),
        ),
        meta: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages: total === 0 ? 0 : Math.ceil(total / params.limit),
        },
      };
    }

    const result = await this.articles.findMany({
      page: params.page,
      limit: params.limit,
      publishedOnly: true,
      categorySlug: category,
      tagSlug: tag,
    });

    return {
      data: result.data.map((article) =>
        ArticleResponseMapper.toSummary(article),
      ),
      meta: result.meta,
    };
  }

  async getBySlug(slug: string) {
    const normalized = slug.trim();
    const article = await this.articles.findBySlug(normalized);

    if (!article?.isPublished()) {
      throw new ArticleNotFoundException(normalized);
    }

    return ArticleResponseMapper.toDetail(article);
  }

  async create(input: CreateArticleInput) {
    const [author, category, tags] = await Promise.all([
      this.authors.findOrCreateByName(input.author),
      this.categories.findOrCreate({ name: input.category }),
      this.tags.findOrCreateMany(input.tags.map((name) => ({ name }))),
    ]);

    const slug = await this.ensureUniqueSlug(Slug.fromTitle(input.title).value);
    const article = Article.create({
      title: input.title,
      summary: input.summary,
      content: input.content,
      author: this.toAuthorRef(author),
      category: this.toCategoryRef(category),
      tags: tags.map((tag) => this.toTagRef(tag)),
      slug,
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
    });

    const saved = await this.articles.save(article);
    await this.search.index(ArticleMapper.toSearchDocument(saved));

    return ArticleResponseMapper.toIngest(saved);
  }

  async update(id: string, input: UpdateArticleInput) {
    const article = await this.articles.findById(id);

    if (!article) {
      throw new ArticleNotFoundException(id);
    }

    const [author, category, tags] = await Promise.all([
      input.author
        ? this.authors.findOrCreateByName(input.author)
        : Promise.resolve(undefined),
      input.category
        ? this.categories.findOrCreate({ name: input.category })
        : Promise.resolve(undefined),
      input.tags
        ? this.tags.findOrCreateMany(input.tags.map((name) => ({ name })))
        : Promise.resolve(undefined),
    ]);

    article.update({
      title: input.title,
      summary: input.summary,
      content: input.content,
      publishedAt:
        input.publishedAt === undefined
          ? undefined
          : input.publishedAt === null
            ? null
            : new Date(input.publishedAt),
      author: author ? this.toAuthorRef(author) : undefined,
      category: category ? this.toCategoryRef(category) : undefined,
      tags: tags ? tags.map((tag) => this.toTagRef(tag)) : undefined,
    });

    const updated = await this.articles.update(article);

    if (updated.isPublished()) {
      await this.search.index(ArticleMapper.toSearchDocument(updated));
    } else {
      await this.search.remove(updated.id);
    }

    return ArticleResponseMapper.toIngest(updated);
  }

  async listCategories() {
    const categories = await this.categories.findAll();
    return categories.map(ReferenceResponseMapper.toItem);
  }

  async listTags() {
    const tags = await this.tags.findAll();
    return tags.map(ReferenceResponseMapper.toItem);
  }

  private async ensureUniqueSlug(base: string): Promise<string> {
    if (!(await this.articles.existsBySlug(base))) {
      return base;
    }

    let suffix = 2;
    while (await this.articles.existsBySlug(`${base}-${suffix}`)) {
      suffix += 1;
    }

    return `${base}-${suffix}`;
  }

  private toAuthorRef(author: Author) {
    return { id: author.id, name: author.name };
  }

  private toCategoryRef(category: Category) {
    return {
      id: category.id,
      name: category.name,
      slug: category.slugValue,
    };
  }

  private toTagRef(tag: Tag) {
    return { id: tag.id, name: tag.name, slug: tag.slugValue };
  }
}
