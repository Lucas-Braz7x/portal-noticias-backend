import { PrismaService } from '@/prisma/prisma.service';
import { PrismaCategoryRepository } from '@/modules/articles/infrastructure/repositories/prisma-category.repository';
import { getTestPrisma } from '../../../../helpers/database.helper';

describe('PrismaCategoryRepository (integration)', () => {
  let repository: PrismaCategoryRepository;

  beforeEach(() => {
    repository = new PrismaCategoryRepository(
      getTestPrisma() as unknown as PrismaService,
    );
  });

  it('findBySlug returns null when category is not found', async () => {
    await expect(repository.findBySlug('tecnologia')).resolves.toBeNull();
  });

  it('findBySlug returns persisted category', async () => {
    const prisma = getTestPrisma();
    await prisma.category.create({
      data: { name: 'Tecnologia', slug: 'tecnologia' },
    });

    const category = await repository.findBySlug('tecnologia');

    expect(category?.slugValue).toBe('tecnologia');
    expect(category?.name).toBe('Tecnologia');
  });

  it('findOrCreate returns existing category by slug', async () => {
    const prisma = getTestPrisma();
    const existing = await prisma.category.create({
      data: { name: 'Tecnologia', slug: 'tecnologia' },
    });

    const category = await repository.findOrCreate({
      name: 'Tecnologia',
      slug: 'tecnologia',
    });

    expect(category.id).toBe(existing.id);
    expect(await prisma.category.count()).toBe(1);
  });

  it('findOrCreate creates category with slug derived from name', async () => {
    const prisma = getTestPrisma();

    const category = await repository.findOrCreate({
      name: '  Tecnologia  ',
    });

    const persisted = await prisma.category.findUnique({
      where: { slug: 'tecnologia' },
    });

    expect(persisted?.name).toBe('Tecnologia');
    expect(category.slugValue).toBe('tecnologia');
  });
});
