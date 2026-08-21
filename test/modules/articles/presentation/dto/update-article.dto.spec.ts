import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateArticleDto } from '@/modules/articles/presentation/dto/update-article.dto';

async function validateDto(plain: Record<string, unknown>) {
  const dto = plainToInstance(UpdateArticleDto, plain);
  const errors = await validate(dto);
  return { dto, errors };
}

describe('UpdateArticleDto', () => {
  it('accepts an empty body', async () => {
    const { errors } = await validateDto({});

    expect(errors).toHaveLength(0);
  });

  it('accepts a partial payload', async () => {
    const { dto, errors } = await validateDto({
      title: 'Título atualizado',
    });

    expect(errors).toHaveLength(0);
    expect(dto.title).toBe('Título atualizado');
  });

  it('accepts publishedAt null to unpublish', async () => {
    const { dto, errors } = await validateDto({
      publishedAt: null,
    });

    expect(errors).toHaveLength(0);
    expect(dto.publishedAt).toBeNull();
  });

  it('rejects empty title when provided', async () => {
    const { errors } = await validateDto({
      title: '   ',
    });

    expect(errors.some((error) => error.property === 'title')).toBe(true);
  });

  it('rejects invalid publishedAt when provided', async () => {
    const { errors } = await validateDto({
      publishedAt: 'ontem',
    });

    expect(errors.some((error) => error.property === 'publishedAt')).toBe(true);
  });
});
