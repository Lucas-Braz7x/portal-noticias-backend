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

  @ApiProperty({ example: 'Política' })
  category!: string;

  @ApiProperty({ example: ['economia', 'brasil'], type: [String] })
  tags!: string[];
}
