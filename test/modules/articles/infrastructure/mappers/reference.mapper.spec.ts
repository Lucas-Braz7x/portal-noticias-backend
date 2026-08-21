import { ReferenceMapper } from '@/modules/articles/infrastructure/mappers/reference.mapper';

describe('ReferenceMapper', () => {
  const createdAt = new Date('2026-01-01T00:00:00Z');
  const updatedAt = new Date('2026-01-02T00:00:00Z');

  it('maps prisma author to domain author', () => {
    const author = ReferenceMapper.toAuthorDomain({
      id: 'author-1',
      name: 'Maria Silva',
      createdAt,
      updatedAt,
    });

    expect(author.id).toBe('author-1');
    expect(author.name).toBe('Maria Silva');
  });

  it('maps prisma category to domain category', () => {
    const category = ReferenceMapper.toCategoryDomain({
      id: 'cat-1',
      name: 'Tecnologia',
      slug: 'tecnologia',
      createdAt,
      updatedAt,
    });

    expect(category.id).toBe('cat-1');
    expect(category.name).toBe('Tecnologia');
    expect(category.slugValue).toBe('tecnologia');
  });

  it('maps prisma tag to domain tag', () => {
    const tag = ReferenceMapper.toTagDomain({
      id: 'tag-1',
      name: 'IA',
      slug: 'ia',
      createdAt,
      updatedAt,
    });

    expect(tag.id).toBe('tag-1');
    expect(tag.name).toBe('IA');
    expect(tag.slugValue).toBe('ia');
  });
});
