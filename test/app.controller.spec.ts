import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';

describe('AppController', () => {
  it('delegates health check to AppService', async () => {
    const health = {
      status: 'ok',
      timestamp: '2026-01-01T00:00:00.000Z',
    };
    const appService = {
      getHealth: jest.fn().mockResolvedValue(health),
    } as unknown as AppService;

    const controller = new AppController(appService);
    const result = await controller.health();

    expect(appService.getHealth).toHaveBeenCalled();
    expect(result).toEqual(health);
  });
});
