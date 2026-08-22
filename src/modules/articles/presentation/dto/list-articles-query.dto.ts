import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function defaultIfMissing<T>(value: unknown, defaultValue: T): T {
  return (value ?? defaultValue) as T;
}

export class ListArticlesQueryDto {
  @ApiPropertyOptional({
    description: 'Termo de busca textual (título, resumo, conteúdo, tags)',
    example: 'tecnologia',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => trimString(value))
  q?: string;

  @ApiPropertyOptional({
    description:
      'Filtro por slug de categoria (RF04). Use o slug URL-friendly, não o nome exibido na resposta (ex.: `politica`, não `Política`).',
    example: 'politica',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => trimString(value))
  category?: string;

  @ApiPropertyOptional({
    description:
      'Filtro por slug de tag (RF05). Use o slug URL-friendly, não o nome exibido na resposta (ex.: `eleicoes`, não `Eleições`).',
    example: 'eleicoes',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => trimString(value))
  tag?: string;

  @ApiPropertyOptional({
    description: 'Número da página',
    default: 1,
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => defaultIfMissing(value, 1))
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
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => defaultIfMissing(value, 10))
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 10;
}
