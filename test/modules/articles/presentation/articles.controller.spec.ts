import { ArticlesService } from '@/modules/articles/application/articles.service';
import { ArticlesController } from '@/modules/articles/presentation/articles.controller';

describe('ArticlesController', () => {
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
});
