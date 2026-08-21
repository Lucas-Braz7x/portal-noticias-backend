import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import { CreateArticleDto } from '@/modules/articles/presentation/dto/create-article.dto';

async function validateDto(plain: Record<string, unknown>): Promise<{
  dto: CreateArticleDto;
  errors: ValidationError[];
}> {
  const dto = plainToInstance(CreateArticleDto, plain, {
    enableImplicitConversion: true,
  });
  const errors = await validate(dto);
  return { dto, errors };
}

const validPayload = {
  title: 'Como a IA está mudando o jornalismo',
  summary: 'Resumo do artigo',
  content: 'Conteúdo completo',
  author: 'Maria Silva',
  category: 'Política',
  tags: ['Eleições', 'Paraná'],
};

describe('CreateArticleDto', () => {
  it('accepts a valid payload', async () => {
    const { dto, errors } = await validateDto(validPayload);

    expect(errors).toHaveLength(0);
    expect(dto.title).toBe(validPayload.title);
    expect(dto.tags).toEqual(validPayload.tags);
  });

  it('trims string fields', async () => {
    const { dto, errors } = await validateDto({
      ...validPayload,
      title: '  Título  ',
      summary: '  Resumo  ',
      content: '  Conteúdo  ',
      author: '  Maria Silva  ',
      category: '  Política  ',
    });

    expect(errors).toHaveLength(0);
    expect(dto.title).toBe('Título');
    expect(dto.summary).toBe('Resumo');
    expect(dto.content).toBe('Conteúdo');
    expect(dto.author).toBe('Maria Silva');
    expect(dto.category).toBe('Política');
  });

  it('accepts optional publishedAt as ISO 8601', async () => {
    const { dto, errors } = await validateDto({
      ...validPayload,
      publishedAt: '2026-01-15T10:00:00Z',
    });

    expect(errors).toHaveLength(0);
    expect(dto.publishedAt).toBe('2026-01-15T10:00:00Z');
  });

  it('accepts empty tags array', async () => {
    const { errors } = await validateDto({
      ...validPayload,
      tags: [],
    });

    expect(errors).toHaveLength(0);
  });

  it('rejects missing required fields', async () => {
    const { errors } = await validateDto({});

    const properties = errors.map((error) => error.property);
    expect(properties).toEqual(
      expect.arrayContaining([
        'title',
        'summary',
        'content',
        'author',
        'category',
        'tags',
      ]),
    );
  });

  it('rejects empty title after trim', async () => {
    const { errors } = await validateDto({
      ...validPayload,
      title: '   ',
    });

    expect(errors.some((error) => error.property === 'title')).toBe(true);
  });

  it('rejects invalid publishedAt', async () => {
    const { errors } = await validateDto({
      ...validPayload,
      publishedAt: 'not-a-date',
    });

    expect(errors.some((error) => error.property === 'publishedAt')).toBe(true);
  });

  it('rejects non-array tags', async () => {
    const { errors } = await validateDto({
      ...validPayload,
      tags: 'eleicoes',
    });

    expect(errors.some((error) => error.property === 'tags')).toBe(true);
  });

  it('rejects empty tag items', async () => {
    const { errors } = await validateDto({
      ...validPayload,
      tags: ['Eleições', '  '],
    });

    expect(errors.some((error) => error.property === 'tags')).toBe(true);
  });
});
