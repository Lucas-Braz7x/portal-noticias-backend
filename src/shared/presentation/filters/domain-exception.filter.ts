import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { ArticleNotFoundException } from '../../../modules/articles/domain/exceptions/article-not-found.exception';
import { DuplicateSlugException } from '../../../modules/articles/domain/exceptions/duplicate-slug.exception';
import { SearchUnavailableException } from '../../../modules/articles/domain/exceptions/search-unavailable.exception';

@Catch(
  ArticleNotFoundException,
  DuplicateSlugException,
  SearchUnavailableException,
)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(
    exception:
      | ArticleNotFoundException
      | DuplicateSlugException
      | SearchUnavailableException,
    host: ArgumentsHost,
  ): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const payload = this.toErrorPayload(exception);

    response.status(payload.statusCode).send({
      error: payload,
    });
  }

  private toErrorPayload(
    exception:
      | ArticleNotFoundException
      | DuplicateSlugException
      | SearchUnavailableException,
  ): { code: string; message: string; statusCode: number } {
    if (exception instanceof DuplicateSlugException) {
      return {
        code: 'DUPLICATE_SLUG',
        message: 'Já existe um artigo com este slug',
        statusCode: HttpStatus.CONFLICT,
      };
    }

    if (exception instanceof SearchUnavailableException) {
      return {
        code: 'SEARCH_UNAVAILABLE',
        message: 'Busca textual indisponível neste ambiente',
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      };
    }

    return {
      code: 'ARTICLE_NOT_FOUND',
      message: 'Artigo não encontrado',
      statusCode: HttpStatus.NOT_FOUND,
    };
  }
}
