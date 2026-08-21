import { ArticleNotFoundException } from '@/modules/articles/domain/exceptions/article-not-found.exception';
import { DuplicateSlugException } from '@/modules/articles/domain/exceptions/duplicate-slug.exception';

describe('ArticleNotFoundException', () => {
  it('sets message and name', () => {
    const error = new ArticleNotFoundException('meu-slug');

    expect(error.message).toBe('Article not found: meu-slug');
    expect(error.name).toBe('ArticleNotFoundException');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('DuplicateSlugException', () => {
  it('sets message and name', () => {
    const error = new DuplicateSlugException('meu-slug');

    expect(error.message).toBe('Article with slug "meu-slug" already exists');
    expect(error.name).toBe('DuplicateSlugException');
    expect(error).toBeInstanceOf(Error);
  });
});
