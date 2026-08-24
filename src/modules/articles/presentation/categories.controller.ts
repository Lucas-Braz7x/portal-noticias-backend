import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HttpCache } from '../../../shared/presentation/decorators/http-cache.decorator';
import { ArticlesService } from '../application/articles.service';
import { ReferenceItemDto } from './dto/reference-item.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  @HttpCache({ profile: 'catalog' })
  @ApiOperation({ summary: 'Listar categorias editoriais' })
  @ApiOkResponse({ type: [ReferenceItemDto] })
  list() {
    return this.articlesService.listCategories();
  }
}
