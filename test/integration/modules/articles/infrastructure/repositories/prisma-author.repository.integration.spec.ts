import { PrismaService } from '@/prisma/prisma.service';
import { PrismaAuthorRepository } from '@/modules/articles/infrastructure/repositories/prisma-author.repository';
import { getTestPrisma } from '../../../../helpers/database.helper';

describe('PrismaAuthorRepository (integration)', () => {
  let repository: PrismaAuthorRepository;

  beforeEach(() => {
    repository = new PrismaAuthorRepository(
      getTestPrisma() as unknown as PrismaService,
    );
  });

  it('findByName returns null when author is not found', async () => {
    await expect(repository.findByName('Maria Silva')).resolves.toBeNull();
  });

  it('findByName trims the name before querying', async () => {
    const prisma = getTestPrisma();
    await prisma.author.create({ data: { name: 'Maria Silva' } });

    const author = await repository.findByName('  Maria Silva  ');

    expect(author?.name).toBe('Maria Silva');
  });

  it('findOrCreateByName returns existing author', async () => {
    const prisma = getTestPrisma();
    const existing = await prisma.author.create({
      data: { name: 'Maria Silva' },
    });

    const author = await repository.findOrCreateByName('Maria Silva');

    expect(author.id).toBe(existing.id);
    expect(await prisma.author.count()).toBe(1);
  });

  it('findOrCreateByName creates author when not found', async () => {
    const prisma = getTestPrisma();

    const author = await repository.findOrCreateByName('  Maria Silva  ');

    const persisted = await prisma.author.findFirst({
      where: { name: 'Maria Silva' },
    });

    expect(persisted?.name).toBe('Maria Silva');
    expect(author.name).toBe('Maria Silva');
  });
});
