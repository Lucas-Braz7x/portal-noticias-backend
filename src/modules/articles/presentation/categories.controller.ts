import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArticlesService } from '../application/articles.service';
import { ReferenceItemDto } from './dto/reference-item.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar categorias editoriais' })
  @ApiOkResponse({ type: [ReferenceItemDto] })
  list() {
    return this.articlesService.listCategories();
  }
}
