import { Slug } from '../value-objects/slug.vo';

export class Tag {
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
  }): Tag {
    const name = props.name.trim();

    if (!name) {
      throw new Error('Tag name cannot be empty');
    }

    const slug = props.slug ? Slug.create(props.slug) : Slug.fromTitle(name);
    const now = new Date();

    return new Tag(
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
  }): Tag {
    return new Tag(
      props.id,
      props.name,
      Slug.create(props.slug),
      props.createdAt,
      props.updatedAt,
    );
  }
}
