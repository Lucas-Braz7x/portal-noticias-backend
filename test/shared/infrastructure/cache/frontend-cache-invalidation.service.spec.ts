import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { FrontendCacheInvalidationService } from '@/shared/infrastructure/cache/frontend-cache-invalidation.service';

describe('FrontendCacheInvalidationService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  function createService(config: Record<string, string | undefined>) {
    const configService = {
      get: jest.fn((key: string) => config[key]),
    } as unknown as ConfigService;

    return new FrontendCacheInvalidationService(configService);
  }

  it('isConfigured returns false when env vars are missing', () => {
    const service = createService({});

    expect(service.isConfigured()).toBe(false);
  });

  it('isConfigured returns true when url and secret are set', () => {
    const service = createService({
      FRONTEND_REVALIDATE_URL: 'http://frontend/api/revalidate',
      REVALIDATE_SECRET: 'secret',
    });

    expect(service.isConfigured()).toBe(true);
  });

  it('does not call fetch when not configured', () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock;

    const service = createService({});
    service.invalidate();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts tags to frontend revalidate endpoint when configured', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;

    const service = createService({
      FRONTEND_REVALIDATE_URL: 'http://frontend/api/revalidate',
      REVALIDATE_SECRET: 'secret',
    });

    service.invalidate(['articles', 'tags']);

    await new Promise((resolve) => setImmediate(resolve));

    expect(fetchMock).toHaveBeenCalledWith(
      'http://frontend/api/revalidate',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Revalidate-Secret': 'secret',
        }),
        body: JSON.stringify({ tags: ['articles', 'tags'] }),
      }),
    );
  });

  it('logs warning and does not throw when fetch fails', async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error('network'));
    global.fetch = fetchMock;
    const warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    const service = createService({
      FRONTEND_REVALIDATE_URL: 'http://frontend/api/revalidate',
      REVALIDATE_SECRET: 'secret',
    });

    service.invalidate();

    await new Promise((resolve) => setImmediate(resolve));

    expect(warnSpy).toHaveBeenCalled();
  });
});
