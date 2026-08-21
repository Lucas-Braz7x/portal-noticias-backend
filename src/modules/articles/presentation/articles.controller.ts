import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArticlesService } from '../application/articles.service';
import { ListArticlesQueryDto } from './dto/list-articles-query.dto';
import { PaginatedArticlesResponseDto } from './dto/paginated-articles-response.dto';

@ApiTags('articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar artigos publicados',
    description:
      'Retorna artigos publicados com paginação. Atende RF01 (listagem) e RF02 (paginação).',
  })
  @ApiOkResponse({ type: PaginatedArticlesResponseDto })
  list(@Query() query: ListArticlesQueryDto) {
    return this.articlesService.list(query);
  }
}
