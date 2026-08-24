import { CallHandler, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { HTTP_CACHE_KEY } from '@/shared/presentation/decorators/http-cache.decorator';
import { HttpCacheInterceptor } from '@/shared/presentation/interceptors/http-cache.interceptor';

function createContext(query: Record<string, string> = {}): {
  context: ExecutionContext;
  setHeader: jest.Mock;
} {
  const setHeader = jest.fn();

  const context = {
    switchToHttp: () => ({
      getRequest: () => ({ query }),
      getResponse: () => ({ header: setHeader }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;

  return { context, setHeader };
}

describe('HttpCacheInterceptor', () => {
  function createInterceptor(
    metadata: unknown,
    config: Record<string, string | number> = {},
  ): HttpCacheInterceptor {
    const reflector = {
      get: jest.fn().mockReturnValue(metadata),
    } as unknown as Reflector;

    const configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        if (key in config) {
          return config[key];
        }

        return defaultValue;
      }),
    } as unknown as ConfigService;

    return new HttpCacheInterceptor(reflector, configService);
  }

  it('sets articles Cache-Control from env default', (done) => {
    const interceptor = createInterceptor({ profile: 'articles' });
    const { context, setHeader } = createContext();
    const next: CallHandler = { handle: () => of({ ok: true }) };

    interceptor.intercept(context, next).subscribe({
      complete: () => {
        expect(setHeader).toHaveBeenCalledWith(
          'Cache-Control',
          'public, max-age=60',
        );
        done();
      },
    });
  });

  it('sets catalog Cache-Control from env', (done) => {
    const interceptor = createInterceptor(
      { profile: 'catalog' },
      { CACHE_CATALOG_MAX_AGE: 300 },
    );
    const { context, setHeader } = createContext();
    const next: CallHandler = { handle: () => of({ ok: true }) };

    interceptor.intercept(context, next).subscribe({
      complete: () => {
        expect(setHeader).toHaveBeenCalledWith(
          'Cache-Control',
          'public, max-age=300',
        );
        done();
      },
    });
  });

  it('sets no-store when handler metadata requests it', (done) => {
    const interceptor = createInterceptor({ noStore: true });
    const { context, setHeader } = createContext();
    const next: CallHandler = { handle: () => of({ ok: true }) };

    interceptor.intercept(context, next).subscribe({
      complete: () => {
        expect(setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
        done();
      },
    });
  });

  it('uses search max age when searchAware and q query param is present', (done) => {
    const interceptor = createInterceptor(
      { profile: 'articles', searchAware: true },
      { CACHE_SEARCH_MAX_AGE: 30 },
    );
    const { context, setHeader } = createContext({ q: 'politica' });
    const next: CallHandler = { handle: () => of({ ok: true }) };

    interceptor.intercept(context, next).subscribe({
      complete: () => {
        expect(setHeader).toHaveBeenCalledWith(
          'Cache-Control',
          'public, max-age=30',
        );
        done();
      },
    });
  });

  it('does not set Cache-Control when handler has no metadata', (done) => {
    const interceptor = createInterceptor(undefined);
    const { context, setHeader } = createContext();
    const next: CallHandler = { handle: () => of({ ok: true }) };

    interceptor.intercept(context, next).subscribe({
      complete: () => {
        expect(setHeader).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('reads metadata from reflector using HTTP_CACHE_KEY', (done) => {
    const reflector = {
      get: jest.fn().mockReturnValue({ profile: 'catalog' }),
    } as unknown as Reflector;
    const configService = {
      get: jest.fn((_key: string, defaultValue?: unknown) => defaultValue),
    } as unknown as ConfigService;
    const interceptor = new HttpCacheInterceptor(reflector, configService);
    const { context } = createContext();
    const next: CallHandler = { handle: () => of({ ok: true }) };

    interceptor.intercept(context, next).subscribe({
      complete: () => {
        expect(reflector.get).toHaveBeenCalledWith(
          HTTP_CACHE_KEY,
          context.getHandler(),
        );
        done();
      },
    });
  });
});
