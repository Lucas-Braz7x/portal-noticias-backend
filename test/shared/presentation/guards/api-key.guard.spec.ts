import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiKeyGuard } from '@/shared/presentation/guards/api-key.guard';

function createContext(
  headers: Record<string, string | undefined>,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as unknown as ExecutionContext;
}

describe('ApiKeyGuard', () => {
  const expectedKey = 'test-ingest-key';

  function createGuard(configuredKey: string | undefined): ApiKeyGuard {
    const configService = {
      get: jest.fn().mockReturnValue(configuredKey),
    } as unknown as ConfigService;

    return new ApiKeyGuard(configService);
  }

  it('allows request when X-API-Key matches INGEST_API_KEY', () => {
    const guard = createGuard(expectedKey);
    const context = createContext({ 'x-api-key': expectedKey });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws UnauthorizedException when header is missing', () => {
    const guard = createGuard(expectedKey);
    const context = createContext({});

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when header is empty', () => {
    const guard = createGuard(expectedKey);
    const context = createContext({ 'x-api-key': '' });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when header does not match', () => {
    const guard = createGuard(expectedKey);
    const context = createContext({ 'x-api-key': 'wrong-key' });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when INGEST_API_KEY is not configured', () => {
    const guard = createGuard(undefined);
    const context = createContext({ 'x-api-key': expectedKey });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when INGEST_API_KEY is empty', () => {
    const guard = createGuard('');
    const context = createContext({ 'x-api-key': expectedKey });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
