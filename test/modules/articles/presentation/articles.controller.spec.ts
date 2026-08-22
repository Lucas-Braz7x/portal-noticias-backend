import { ArticlesService } from '@/modules/articles/application/articles.service';
import { ArticlesController } from '@/modules/articles/presentation/articles.controller';
import { CreateArticleDto } from '@/modules/articles/presentation/dto/create-article.dto';
import { UpdateArticleDto } from '@/modules/articles/presentation/dto/update-article.dto';

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

    const result = await controller.create(dto);

    expect(articlesService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(ingestResponse);
  });

  it('delegates update to ArticlesService', async () => {
    const articlesService = {
      update: jest.fn().mockResolvedValue(ingestResponse),
    } as unknown as ArticlesService;
    const controller = new ArticlesController(articlesService);
    const dto = { title: 'Título atualizado' } as UpdateArticleDto;

    const result = await controller.update('article-1', dto);

    expect(articlesService.update).toHaveBeenCalledWith('article-1', dto);
    expect(result).toEqual(ingestResponse);
  });
});
