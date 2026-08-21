import { ApiProperty } from '@nestjs/swagger';

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
      'Nome legível da categoria. Para filtrar, use o slug em `?category=` (ex.: `politica`).',
    example: 'Política',
  })
  category!: string;

  @ApiProperty({
    description:
      'Nomes legíveis das tags. Para filtrar, use o slug em `?tag=` (ex.: `eleicoes`).',
    example: ['Eleições', 'Paraná'],
    type: [String],
  })
  tags!: string[];
}
