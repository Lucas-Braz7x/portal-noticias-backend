import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class ListArticlesQueryDto {
  @ApiPropertyOptional({
    description: 'Número da página',
    default: 1,
    minimum: 1,
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Quantidade de itens por página',
    default: 10,
    minimum: 1,
    maximum: 50,
    example: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 10;
}
