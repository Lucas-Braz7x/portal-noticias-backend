import { AppService } from '@/app.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('AppService', () => {
  it('returns ok after database ping', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    } as unknown as PrismaService;

    const service = new AppService(prisma);
    const result = await service.getHealth();

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result.status).toBe('ok');
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
