import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { ArticleNotFoundException } from '../../../modules/articles/domain/exceptions/article-not-found.exception';
import { DuplicateSlugException } from '../../../modules/articles/domain/exceptions/duplicate-slug.exception';

@Catch(ArticleNotFoundException, DuplicateSlugException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(
    exception: ArticleNotFoundException | DuplicateSlugException,
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
    exception: ArticleNotFoundException | DuplicateSlugException,
  ): { code: string; message: string; statusCode: number } {
    if (exception instanceof DuplicateSlugException) {
      return {
        code: 'DUPLICATE_SLUG',
        message: 'Já existe um artigo com este slug',
        statusCode: HttpStatus.CONFLICT,
      };
    }

    return {
      code: 'ARTICLE_NOT_FOUND',
      message: 'Artigo não encontrado',
      statusCode: HttpStatus.NOT_FOUND,
    };
  }
}
