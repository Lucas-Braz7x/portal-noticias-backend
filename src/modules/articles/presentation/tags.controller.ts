import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArticlesService } from '../application/articles.service';
import { ReferenceItemDto } from './dto/reference-item.dto';

@ApiTags('tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar tags editoriais' })
  @ApiOkResponse({ type: [ReferenceItemDto] })
  list() {
    return this.articlesService.listTags();
  }
}
