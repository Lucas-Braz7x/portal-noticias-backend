import { ApiProperty } from '@nestjs/swagger';

export class ArticleIngestResponseDto {
  @ApiProperty({ example: '3b7d1c2e-4f5a-6b7c-8d9e-0f1a2b3c4d5e' })
  id!: string;

  @ApiProperty({ example: 'titulo-do-artigo' })
  slug!: string;

  @ApiProperty({ example: 'Como a IA está mudando o jornalismo' })
  title!: string;

  @ApiProperty({ example: 'Resumo do artigo' })
  summary!: string;

  @ApiProperty({ example: 'Conteúdo completo do artigo' })
  content!: string;

  @ApiProperty({
    example: '2026-01-15T10:00:00.000Z',
    nullable: true,
  })
  publishedAt!: string | null;

  @ApiProperty({ example: 'Maria Silva' })
  author!: string;

  @ApiProperty({ example: 'Política' })
  category!: string;

  @ApiProperty({
    example: ['Eleições', 'Paraná'],
    type: [String],
  })
  tags!: string[];
}
