import { Slug } from '../value-objects/slug.vo';

export class Category {
  private constructor(
    readonly id: string,
    readonly name: string,
    readonly slug: Slug,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  get slugValue(): string {
    return this.slug.value;
  }

  static create(props: {
    id: string;
    name: string;
    slug?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): Category {
    const name = props.name.trim();

    if (!name) {
      throw new Error('Category name cannot be empty');
    }

    const slug = props.slug ? Slug.create(props.slug) : Slug.fromTitle(name);
    const now = new Date();

    return new Category(
      props.id,
      name,
      slug,
      props.createdAt ?? now,
      props.updatedAt ?? now,
    );
  }

  static reconstitute(props: {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
  }): Category {
    return new Category(
      props.id,
      props.name,
      Slug.create(props.slug),
      props.createdAt,
      props.updatedAt,
    );
  }
}
