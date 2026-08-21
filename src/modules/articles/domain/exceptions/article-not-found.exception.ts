export class ArticleNotFoundException extends Error {
  constructor(identifier: string) {
    super(`Article not found: ${identifier}`);
    this.name = 'ArticleNotFoundException';
  }
}
