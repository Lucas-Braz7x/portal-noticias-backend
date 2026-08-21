export class Slug {
  private constructor(private readonly _value: string) {}

  get value(): string {
    return this._value;
  }

  static create(raw: string): Slug {
    const normalized = Slug.normalize(raw);

    if (!normalized) {
      throw new Error('Slug cannot be empty');
    }

    return new Slug(normalized);
  }

  static fromTitle(title: string): Slug {
    return Slug.create(title);
  }

  equals(other: Slug): boolean {
    return this._value === other._value;
  }

  private static normalize(raw: string): string {
    return raw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
