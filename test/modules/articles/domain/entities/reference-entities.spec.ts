import { Author } from '@/modules/articles/domain/entities/author.entity';
import { Category } from '@/modules/articles/domain/entities/category.entity';
import { Tag } from '@/modules/articles/domain/entities/tag.entity';

describe('Author', () => {
  it('creates author with trimmed name', () => {
    const author = Author.create({ id: 'author-1', name: '  Maria Silva  ' });

    expect(author.name).toBe('Maria Silva');
  });

  it('throws when name is empty', () => {
    expect(() => Author.create({ id: 'author-1', name: '  ' })).toThrow(
      'Author name cannot be empty',
    );
  });
});

describe('Category', () => {
  it('creates category with slug from name', () => {
    const category = Category.create({ id: 'cat-1', name: 'Tecnologia' });

    expect(category.name).toBe('Tecnologia');
    expect(category.slugValue).toBe('tecnologia');
  });

  it('creates category with explicit slug', () => {
    const category = Category.create({
      id: 'cat-1',
      name: 'Next.js',
      slug: 'nextjs',
    });

    expect(category.slugValue).toBe('nextjs');
  });
});

describe('Tag', () => {
  it('creates tag with slug from name', () => {
    const tag = Tag.create({
      id: 'tag-1',
      name: 'Inteligência Artificial',
    });

    expect(tag.slugValue).toBe('inteligencia-artificial');
  });
});
