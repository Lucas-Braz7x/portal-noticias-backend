export class Author {
  private constructor(
    readonly id: string,
    readonly name: string,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  static create(props: {
    id: string;
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): Author {
    const name = props.name.trim();

    if (!name) {
      throw new Error('Author name cannot be empty');
    }

    const now = new Date();

    return new Author(
      props.id,
      name,
      props.createdAt ?? now,
      props.updatedAt ?? now,
    );
  }

  static reconstitute(props: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }): Author {
    return new Author(props.id, props.name, props.createdAt, props.updatedAt);
  }
}
