import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ArticlesService } from '../application/articles.service';
import { ApiKeyGuard } from '../../../shared/presentation/guards/api-key.guard';
import { ArticleDetailDto } from './dto/article-detail.dto';
import { ArticleIngestResponseDto } from './dto/article-ingest-response.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import { ListArticlesQueryDto } from './dto/list-articles-query.dto';
import { PaginatedArticlesResponseDto } from './dto/paginated-articles-response.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

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

  @Post()
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiSecurity('ingest-api-key')
  @ApiOperation({ summary: 'Criar artigo (RF08)' })
  @ApiCreatedResponse({ type: ArticleIngestResponseDto })
  @ApiUnauthorizedResponse({ description: 'Chave de API inválida' })
  create(@Body() dto: CreateArticleDto) {
    return this.articlesService.create(dto);
  }

  @Put(':id')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('ingest-api-key')
  @ApiOperation({ summary: 'Atualizar artigo (RF08)' })
  @ApiOkResponse({ type: ArticleIngestResponseDto })
  @ApiUnauthorizedResponse({ description: 'Chave de API inválida' })
  @ApiNotFoundResponse({ description: 'Artigo não encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateArticleDto,
  ) {
    return this.articlesService.update(id, dto);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Detalhe de artigo publicado (RF06)' })
  @ApiOkResponse({ type: ArticleDetailDto })
  @ApiNotFoundResponse({ description: 'Artigo não encontrado' })
  getBySlug(@Param('slug') slug: string) {
    return this.articlesService.getBySlug(slug);
  }
}
