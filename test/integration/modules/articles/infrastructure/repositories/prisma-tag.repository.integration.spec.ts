import { PrismaService } from '@/prisma/prisma.service';
import { PrismaTagRepository } from '@/modules/articles/infrastructure/repositories/prisma-tag.repository';
import { getTestPrisma } from '../../../../helpers/database.helper';

describe('PrismaTagRepository (integration)', () => {
  let repository: PrismaTagRepository;

  beforeEach(() => {
    repository = new PrismaTagRepository(
      getTestPrisma() as unknown as PrismaService,
    );
  });

  it('findBySlug returns null when tag is not found', async () => {
    await expect(repository.findBySlug('ia')).resolves.toBeNull();
  });

  it('findBySlug returns persisted tag', async () => {
    const prisma = getTestPrisma();
    await prisma.tag.create({ data: { name: 'IA', slug: 'ia' } });

    const tag = await repository.findBySlug('ia');

    expect(tag?.slugValue).toBe('ia');
    expect(tag?.name).toBe('IA');
  });

  it('findOrCreateMany reuses existing tags and creates missing ones', async () => {
    const prisma = getTestPrisma();
    const existing = await prisma.tag.create({
      data: { name: 'IA', slug: 'ia' },
    });

    const tags = await repository.findOrCreateMany([
      { name: 'IA', slug: 'ia' },
      { name: 'Next.js' },
    ]);

    expect(await prisma.tag.count()).toBe(2);
    expect(tags).toHaveLength(2);
    expect(tags[0].id).toBe(existing.id);
    expect(tags[0].slugValue).toBe('ia');
    expect(tags[1].slugValue).toBe('next-js');
  });

  it('findAll returns tags ordered by name', async () => {
    const prisma = getTestPrisma();
    await prisma.tag.createMany({
      data: [
        { name: 'Next.js', slug: 'nextjs' },
        { name: 'AWS', slug: 'aws' },
        { name: 'JavaScript', slug: 'javascript' },
      ],
    });

    const tags = await repository.findAll();

    expect(tags.map((tag) => tag.name)).toEqual([
      'AWS',
      'JavaScript',
      'Next.js',
    ]);
  });
});
