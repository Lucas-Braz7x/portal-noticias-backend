import { timingSafeEqual } from 'crypto';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expectedKey = this.configService.get<string>('INGEST_API_KEY');
    const providedKey = this.readProvidedKey(context);

    if (!this.keysMatch(expectedKey, providedKey)) {
      throw new UnauthorizedException();
    }

    return true;
  }

  private readProvidedKey(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const header = request.headers['x-api-key'];

    return Array.isArray(header) ? header[0] : header;
  }

  private keysMatch(
    expectedKey: string | undefined,
    providedKey: string | undefined,
  ): boolean {
    if (!expectedKey || !providedKey) {
      return false;
    }

    const expected = Buffer.from(expectedKey);
    const provided = Buffer.from(providedKey);

    if (expected.length !== provided.length) {
      return false;
    }

    return timingSafeEqual(expected, provided);
  }
}
