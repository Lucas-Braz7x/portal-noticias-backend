import { ApiProperty } from '@nestjs/swagger';

import { ReferenceItemDto } from './reference-item.dto';

export class ArticleSummaryDto {
  @ApiProperty({ example: 'titulo-do-artigo' })
  slug!: string;

  @ApiProperty({ example: 'Como a IA está mudando o jornalismo' })
  title!: string;

  @ApiProperty({ example: 'Resumo do artigo' })
  summary!: string;

  @ApiProperty({ example: '2026-01-15T10:00:00.000Z' })
  publishedAt!: string;

  @ApiProperty({ example: 'Maria Silva' })
  author!: string;

  @ApiProperty({
    description:
      'Categoria do artigo. Para filtrar, use o slug em `?category=` (ex.: `politica`).',
    type: () => ReferenceItemDto,
    example: { name: 'Política', slug: 'politica' },
  })
  category!: ReferenceItemDto;

  @ApiProperty({
    description:
      'Tags do artigo. Para filtrar, use o slug em `?tag=` (ex.: `eleicoes`).',
    type: [ReferenceItemDto],
    example: [
      { name: 'Eleições', slug: 'eleicoes' },
      { name: 'Paraná', slug: 'parana' },
    ],
  })
  tags!: ReferenceItemDto[];
}
