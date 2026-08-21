export class DuplicateSlugException extends Error {
  constructor(slug: string) {
    super(`Article with slug "${slug}" already exists`);
    this.name = 'DuplicateSlugException';
  }
}
