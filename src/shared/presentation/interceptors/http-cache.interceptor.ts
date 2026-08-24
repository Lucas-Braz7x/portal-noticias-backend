import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Observable, tap } from 'rxjs';
import {
  getArticlesMaxAge,
  getCatalogMaxAge,
  getSearchMaxAge,
} from '../../config/cache.config';
import {
  HTTP_CACHE_KEY,
  HttpCacheOptions,
} from '../decorators/http-cache.decorator';

@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const metadata = this.reflector.get<HttpCacheOptions | undefined>(
      HTTP_CACHE_KEY,
      context.getHandler(),
    );

    if (!metadata) {
      return next.handle();
    }

    const response = context.switchToHttp().getResponse<FastifyReply>();
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    if (metadata.noStore) {
      return next.handle().pipe(
        tap(() => {
          void response.header('Cache-Control', 'no-store');
        }),
      );
    }

    const maxAge = this.resolveMaxAge(metadata, request);

    return next.handle().pipe(
      tap(() => {
        void response.header('Cache-Control', `public, max-age=${maxAge}`);
      }),
    );
  }

  private resolveMaxAge(
    metadata: HttpCacheOptions,
    request: FastifyRequest,
  ): number {
    if (metadata.searchAware && this.hasSearchQuery(request)) {
      return getSearchMaxAge(this.config);
    }

    if (metadata.profile === 'catalog') {
      return getCatalogMaxAge(this.config);
    }

    return getArticlesMaxAge(this.config);
  }

  private hasSearchQuery(request: FastifyRequest): boolean {
    const query = request.query as Record<string, unknown> | undefined;
    const q = query?.q;

    return typeof q === 'string' && q.trim().length > 0;
  }
}
