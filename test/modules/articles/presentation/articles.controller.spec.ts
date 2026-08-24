import { HttpStatus } from '@nestjs/common';
import { ArticlesService } from '@/modules/articles/application/articles.service';
import { ArticlesController } from '@/modules/articles/presentation/articles.controller';
import { CreateArticleDto } from '@/modules/articles/presentation/dto/create-article.dto';
import { UpdateArticleDto } from '@/modules/articles/presentation/dto/update-article.dto';
import { FastifyReply } from 'fastify';

describe('ArticlesController', () => {
  const ingestResponse = {
    id: 'article-1',
    slug: 'titulo',
    title: 'Título',
    summary: 'Resumo',
    content: 'Conteúdo',
    publishedAt: '2026-01-15T10:00:00.000Z',
    author: 'Maria Silva',
    category: { name: 'Política', slug: 'politica' },
    tags: [{ name: 'Eleições', slug: 'eleicoes' }],
    indexingStatus: 'completed' as const,
  };

  const createMockReply = (): FastifyReply => {
    const reply = {
      status: jest.fn().mockReturnThis(),
    };

    return reply as unknown as FastifyReply;
  };

  it('delegates list to ArticlesService', async () => {
    const response = {
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
    const articlesService = {
      list: jest.fn().mockResolvedValue(response),
    } as unknown as ArticlesService;

    const controller = new ArticlesController(articlesService);
    const query = { page: 1, limit: 10 };
    const result = await controller.list(query);

    expect(articlesService.list).toHaveBeenCalledWith(query);
    expect(result).toEqual(response);
  });

  it('delegates create to ArticlesService', async () => {
    const articlesService = {
      create: jest.fn().mockResolvedValue(ingestResponse),
    } as unknown as ArticlesService;
    const controller = new ArticlesController(articlesService);
    const dto = {
      title: 'Título',
      summary: 'Resumo',
      content: 'Conteúdo',
      author: 'Maria Silva',
      category: 'Política',
      tags: ['Eleições'],
    } as CreateArticleDto;
    const res = createMockReply();

    const result = await controller.create(dto, res);

    expect(articlesService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(ingestResponse);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 202 when indexing is pending on create', async () => {
    const pendingResponse = { ...ingestResponse, indexingStatus: 'pending' as const };
    const articlesService = {
      create: jest.fn().mockResolvedValue(pendingResponse),
    } as unknown as ArticlesService;
    const controller = new ArticlesController(articlesService);
    const dto = {
      title: 'Título',
      summary: 'Resumo',
      content: 'Conteúdo',
      author: 'Maria Silva',
      category: 'Política',
      tags: ['Eleições'],
    } as CreateArticleDto;
    const res = createMockReply();

    const result = await controller.create(dto, res);

    expect(result).toEqual(pendingResponse);
    expect(res.status).toHaveBeenCalledWith(HttpStatus.ACCEPTED);
  });

  it('delegates update to ArticlesService', async () => {
    const articlesService = {
      update: jest.fn().mockResolvedValue(ingestResponse),
    } as unknown as ArticlesService;
    const controller = new ArticlesController(articlesService);
    const dto = { title: 'Título atualizado' } as UpdateArticleDto;
    const res = createMockReply();

    const result = await controller.update('article-1', dto, res);

    expect(articlesService.update).toHaveBeenCalledWith('article-1', dto);
    expect(result).toEqual(ingestResponse);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 202 when indexing is pending on update', async () => {
    const pendingResponse = { ...ingestResponse, indexingStatus: 'pending' as const };
    const articlesService = {
      update: jest.fn().mockResolvedValue(pendingResponse),
    } as unknown as ArticlesService;
    const controller = new ArticlesController(articlesService);
    const dto = { title: 'Título atualizado' } as UpdateArticleDto;
    const res = createMockReply();

    const result = await controller.update('article-1', dto, res);

    expect(result).toEqual(pendingResponse);
    expect(res.status).toHaveBeenCalledWith(HttpStatus.ACCEPTED);
  });
});
