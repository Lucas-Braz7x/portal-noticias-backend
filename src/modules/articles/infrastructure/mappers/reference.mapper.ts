import { Author } from '../../domain/entities/author.entity';
import { Category } from '../../domain/entities/category.entity';
import { Tag } from '../../domain/entities/tag.entity';
import type { Author as PrismaAuthor } from '@prisma/client';
import type { Category as PrismaCategory } from '@prisma/client';
import type { Tag as PrismaTag } from '@prisma/client';

export class ReferenceMapper {
  static toAuthorDomain(model: PrismaAuthor): Author {
    return Author.reconstitute({
      id: model.id,
      name: model.name,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  static toCategoryDomain(model: PrismaCategory): Category {
    return Category.reconstitute({
      id: model.id,
      name: model.name,
      slug: model.slug,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  static toTagDomain(model: PrismaTag): Tag {
    return Tag.reconstitute({
      id: model.id,
      name: model.name,
      slug: model.slug,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }
}
