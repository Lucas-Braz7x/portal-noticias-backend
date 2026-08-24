import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const DEFAULT_TAGS = ['articles', 'categories', 'tags'] as const;

@Injectable()
export class FrontendCacheInvalidationService {
  private readonly logger = new Logger(FrontendCacheInvalidationService.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(
      this.config.get<string>('FRONTEND_REVALIDATE_URL') &&
        this.config.get<string>('REVALIDATE_SECRET'),
    );
  }

  invalidate(tags: readonly string[] = DEFAULT_TAGS): void {
    const url = this.config.get<string>('FRONTEND_REVALIDATE_URL');
    const secret = this.config.get<string>('REVALIDATE_SECRET');

    if (!url || !secret) {
      return;
    }

    void this.send(url, secret, tags);
  }

  private async send(
    url: string,
    secret: string,
    tags: readonly string[],
  ): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Revalidate-Secret': secret,
        },
        body: JSON.stringify({ tags }),
      });

      if (!response.ok) {
        this.logger.warn(
          `Frontend cache revalidation failed with status ${response.status}`,
        );
      }
    } catch (error: unknown) {
      this.logger.warn('Frontend cache revalidation failed', error);
    }
  }
}
