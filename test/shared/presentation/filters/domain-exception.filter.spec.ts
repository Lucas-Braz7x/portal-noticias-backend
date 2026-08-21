import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { ArticleNotFoundException } from '@/modules/articles/domain/exceptions/article-not-found.exception';
import { DuplicateSlugException } from '@/modules/articles/domain/exceptions/duplicate-slug.exception';
import { DomainExceptionFilter } from '@/shared/presentation/filters/domain-exception.filter';

function createHost(send: jest.Mock, status: jest.Mock): ArgumentsHost {
  const response = { status } as unknown as FastifyReply;
  return {
    switchToHttp: () => ({
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;
}

describe('DomainExceptionFilter', () => {
  it('maps ArticleNotFoundException to standardized 404 response', () => {
    const filter = new DomainExceptionFilter();
    const send = jest.fn();
    const status = jest.fn().mockReturnValue({ send });

    filter.catch(
      new ArticleNotFoundException('meu-slug'),
      createHost(send, status),
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(send).toHaveBeenCalledWith({
      error: {
        code: 'ARTICLE_NOT_FOUND',
        message: 'Artigo não encontrado',
        statusCode: HttpStatus.NOT_FOUND,
      },
    });
  });

  it('maps DuplicateSlugException to standardized 409 response', () => {
    const filter = new DomainExceptionFilter();
    const send = jest.fn();
    const status = jest.fn().mockReturnValue({ send });

    filter.catch(
      new DuplicateSlugException('meu-slug'),
      createHost(send, status),
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(send).toHaveBeenCalledWith({
      error: {
        code: 'DUPLICATE_SLUG',
        message: 'Já existe um artigo com este slug',
        statusCode: HttpStatus.CONFLICT,
      },
    });
  });
});
