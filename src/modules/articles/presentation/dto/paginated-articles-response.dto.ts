import { ApiProperty } from '@nestjs/swagger';
import { ArticleSummaryDto } from './article-summary.dto';
import { PaginationMetaDto } from './pagination-meta.dto';

export class PaginatedArticlesResponseDto {
  @ApiProperty({ type: [ArticleSummaryDto] })
  data!: ArticleSummaryDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
