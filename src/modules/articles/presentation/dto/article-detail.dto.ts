import { ApiProperty } from '@nestjs/swagger';

import { ReferenceItemDto } from './reference-item.dto';

export class ArticleDetailDto {
  @ApiProperty({ example: 'titulo-do-artigo' })
  slug!: string;

  @ApiProperty({ example: 'Como a IA está mudando o jornalismo' })
  title!: string;

  @ApiProperty({ example: 'Resumo do artigo' })
  summary!: string;

  @ApiProperty({ example: 'Conteúdo completo do artigo' })
  content!: string;

  @ApiProperty({ example: '2026-01-15T10:00:00.000Z' })
  publishedAt!: string;

  @ApiProperty({ example: 'Maria Silva' })
  author!: string;

  @ApiProperty({
    type: () => ReferenceItemDto,
    example: { name: 'Política', slug: 'politica' },
  })
  category!: ReferenceItemDto;

  @ApiProperty({
    type: [ReferenceItemDto],
    example: [
      { name: 'Eleições', slug: 'eleicoes' },
      { name: 'Paraná', slug: 'parana' },
    ],
  })
  tags!: ReferenceItemDto[];
}
