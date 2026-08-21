import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListArticlesQueryDto } from '@/modules/articles/presentation/dto/list-articles-query.dto';

async function validateDto(plain: Record<string, unknown>) {
  const dto = plainToInstance(ListArticlesQueryDto, plain, {
    enableImplicitConversion: true,
  });
  const errors = await validate(dto);
  return { dto, errors };
}

describe('ListArticlesQueryDto', () => {
  it('applies default page and limit when query params are absent', async () => {
    const { dto, errors } = await validateDto({});

    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(10);
  });

  it('accepts explicit page and limit', async () => {
    const { dto, errors } = await validateDto({ page: 2, limit: 5 });

    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(5);
  });

  it('trims q when present', async () => {
    const { dto, errors } = await validateDto({ q: '  teste  ' });

    expect(errors).toHaveLength(0);
    expect(dto.q).toBe('teste');
  });

  it('accepts optional category and tag', async () => {
    const { dto, errors } = await validateDto({
      category: 'tecnologia',
      tag: 'ia',
    });

    expect(errors).toHaveLength(0);
    expect(dto.category).toBe('tecnologia');
    expect(dto.tag).toBe('ia');
  });

  it('trims category and tag when present', async () => {
    const { dto, errors } = await validateDto({
      category: '  tecnologia  ',
      tag: '  ia  ',
    });

    expect(errors).toHaveLength(0);
    expect(dto.category).toBe('tecnologia');
    expect(dto.tag).toBe('ia');
  });

  it('accepts empty strings for category and tag after trim', async () => {
    const { dto, errors } = await validateDto({
      category: '   ',
      tag: '   ',
    });

    expect(errors).toHaveLength(0);
    expect(dto.category).toBe('');
    expect(dto.tag).toBe('');
  });

  it('rejects page below minimum', async () => {
    const { errors } = await validateDto({ page: 0 });

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((error) => error.property === 'page')).toBe(true);
  });

  it('rejects limit above maximum', async () => {
    const { errors } = await validateDto({ limit: 51 });

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((error) => error.property === 'limit')).toBe(true);
  });
});
