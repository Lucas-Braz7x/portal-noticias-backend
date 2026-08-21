import { randomUUID } from 'crypto';
import { Slug } from '../value-objects/slug.vo';

export interface ArticleAuthorRef {
  id: string;
  name: string;
}

export interface ArticleCategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface ArticleTagRef {
  id: string;
  name: string;
  slug: string;
}

export interface CreateArticleProps {
  title: string;
  summary: string;
  content: string;
  author: ArticleAuthorRef;
  category: ArticleCategoryRef;
  tags: ArticleTagRef[];
  slug?: string;
  publishedAt?: Date | null;
}

export interface UpdateArticleProps {
  title?: string;
  summary?: string;
  content?: string;
  author?: ArticleAuthorRef;
  category?: ArticleCategoryRef;
  tags?: ArticleTagRef[];
  slug?: string;
  publishedAt?: Date | null;
}

export interface ReconstituteArticleProps {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  publishedAt: Date | null;
  author: ArticleAuthorRef;
  category: ArticleCategoryRef;
  tags: ArticleTagRef[];
  createdAt: Date;
  updatedAt: Date;
}

export class Article {
  private constructor(
    readonly id: string,
    private _slug: Slug,
    private _title: string,
    private _summary: string,
    private _content: string,
    private _publishedAt: Date | null,
    private _author: ArticleAuthorRef,
    private _category: ArticleCategoryRef,
    private _tags: ArticleTagRef[],
    readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  get slug(): string {
    return this._slug.value;
  }

  get title(): string {
    return this._title;
  }

  get summary(): string {
    return this._summary;
  }

  get content(): string {
    return this._content;
  }

  get publishedAt(): Date | null {
    return this._publishedAt;
  }

  get author(): ArticleAuthorRef {
    return { ...this._author };
  }

  get category(): ArticleCategoryRef {
    return { ...this._category };
  }

  get tags(): ArticleTagRef[] {
    return this._tags.map((tag) => ({ ...tag }));
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  static create(props: CreateArticleProps): Article {
    Article.validateRequiredText(props.title, 'Title');
    Article.validateRequiredText(props.summary, 'Summary');
    Article.validateRequiredText(props.content, 'Content');

    if (!props.author?.id || !props.author.name.trim()) {
      throw new Error('Author is required');
    }

    if (!props.category?.id || !props.category.slug.trim()) {
      throw new Error('Category is required');
    }

    const slug = props.slug
      ? Slug.create(props.slug)
      : Slug.fromTitle(props.title);
    const now = new Date();

    return new Article(
      randomUUID(),
      slug,
      props.title.trim(),
      props.summary.trim(),
      props.content.trim(),
      props.publishedAt ?? null,
      { ...props.author, name: props.author.name.trim() },
      { ...props.category },
      props.tags.map((tag) => ({ ...tag })),
      now,
      now,
    );
  }

  static reconstitute(props: ReconstituteArticleProps): Article {
    return new Article(
      props.id,
      Slug.create(props.slug),
      props.title,
      props.summary,
      props.content,
      props.publishedAt,
      { ...props.author },
      { ...props.category },
      props.tags.map((tag) => ({ ...tag })),
      props.createdAt,
      props.updatedAt,
    );
  }

  update(props: UpdateArticleProps): void {
    if (props.title !== undefined) {
      Article.validateRequiredText(props.title, 'Title');
      this._title = props.title.trim();
    }

    if (props.summary !== undefined) {
      Article.validateRequiredText(props.summary, 'Summary');
      this._summary = props.summary.trim();
    }

    if (props.content !== undefined) {
      Article.validateRequiredText(props.content, 'Content');
      this._content = props.content.trim();
    }

    if (props.slug !== undefined) {
      this._slug = Slug.create(props.slug);
    }

    if (props.publishedAt !== undefined) {
      this._publishedAt = props.publishedAt;
    }

    if (props.author !== undefined) {
      if (!props.author.id || !props.author.name.trim()) {
        throw new Error('Author is required');
      }
      this._author = { ...props.author, name: props.author.name.trim() };
    }

    if (props.category !== undefined) {
      if (!props.category.id || !props.category.slug.trim()) {
        throw new Error('Category is required');
      }
      this._category = { ...props.category };
    }

    if (props.tags !== undefined) {
      this._tags = props.tags.map((tag) => ({ ...tag }));
    }

    this._updatedAt = new Date();
  }

  isPublished(referenceDate: Date = new Date()): boolean {
    return (
      this._publishedAt !== null &&
      this._publishedAt.getTime() <= referenceDate.getTime()
    );
  }

  private static validateRequiredText(value: string, field: string): void {
    if (!value?.trim()) {
      throw new Error(`${field} cannot be empty`);
    }
  }
}
