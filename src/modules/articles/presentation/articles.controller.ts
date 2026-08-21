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
      'Retorna artigos publicados com paginação. Com `q`, busca textual via OpenSearch (RF03). Sem `q`, lista via PostgreSQL (RF01/RF02). Filtros opcionais `category` e `tag` (RF04/RF05) aceitam **slug** (ex.: `politica`, `eleicoes`), não o nome legível retornado em `data[].category` / `data[].tags`.',
  })
  @ApiOkResponse({ type: PaginatedArticlesResponseDto })
  list(@Query() query: ListArticlesQueryDto) {
    return this.articlesService.list(query);
  }
}
