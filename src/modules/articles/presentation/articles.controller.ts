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
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { ArticlesService } from '../application/articles.service';
import { HttpCache } from '../../../shared/presentation/decorators/http-cache.decorator';
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
  @HttpCache({ profile: 'articles', searchAware: true })
  @ApiOperation({
    summary: 'Listar artigos publicados',
    description:
      'Retorna artigos publicados com paginação. Com `q`, busca textual via OpenSearch (RF03). Sem `q`, lista via PostgreSQL (RF01/RF02). Filtros opcionais `category` e `tag` (RF04/RF05) aceitam **slug** (ex.: `politica`, `eleicoes`).',
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
  @ApiAcceptedResponse({
    type: ArticleIngestResponseDto,
    description: 'Indexação assíncrona enfileirada (INDEXING_MODE=async)',
  })
  @ApiUnauthorizedResponse({ description: 'Chave de API inválida' })
  async create(
    @Body() dto: CreateArticleDto,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const result = await this.articlesService.create(dto);

    if (result.indexingStatus === 'pending') {
      void res.status(HttpStatus.ACCEPTED);
    }

    return result;
  }

  @Put(':id')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('ingest-api-key')
  @ApiOperation({ summary: 'Atualizar artigo (RF08)' })
  @ApiOkResponse({ type: ArticleIngestResponseDto })
  @ApiAcceptedResponse({
    type: ArticleIngestResponseDto,
    description: 'Indexação assíncrona enfileirada (INDEXING_MODE=async)',
  })
  @ApiUnauthorizedResponse({ description: 'Chave de API inválida' })
  @ApiNotFoundResponse({ description: 'Artigo não encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateArticleDto,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const result = await this.articlesService.update(id, dto);

    if (result.indexingStatus === 'pending') {
      void res.status(HttpStatus.ACCEPTED);
    }

    return result;
  }

  @Get(':slug')
  @HttpCache({ profile: 'articles' })
  @ApiOperation({ summary: 'Detalhe de artigo publicado (RF06)' })
  @ApiOkResponse({ type: ArticleDetailDto })
  @ApiNotFoundResponse({ description: 'Artigo não encontrado' })
  getBySlug(@Param('slug') slug: string) {
    return this.articlesService.getBySlug(slug);
  }
}
