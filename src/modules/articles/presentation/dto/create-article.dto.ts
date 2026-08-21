import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

function trimString({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateArticleDto {
  @ApiProperty({ example: 'Como a IA está mudando o jornalismo' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Resumo do artigo' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  summary!: string;

  @ApiProperty({ example: 'Conteúdo completo do artigo' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty({ example: 'Maria Silva' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  author!: string;

  @ApiProperty({ example: 'Política' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({
    example: ['Eleições', 'Paraná'],
    type: [String],
  })
  @Transform(({ value }: { value: unknown }) => {
    if (!Array.isArray(value)) {
      return value;
    }

    return value.map((item: unknown) =>
      typeof item === 'string' ? item.trim() : item,
    );
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  tags!: string[];

  @ApiPropertyOptional({ example: '2026-01-15T10:00:00Z' })
  @IsOptional()
  @IsISO8601()
  publishedAt?: string;
}
