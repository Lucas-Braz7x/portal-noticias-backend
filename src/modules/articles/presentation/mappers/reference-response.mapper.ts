import { Category } from '../../domain/entities/category.entity';
import { Tag } from '../../domain/entities/tag.entity';
import { ReferenceItemDto } from '../dto/reference-item.dto';

export class ReferenceResponseMapper {
  static toItem(entity: Category | Tag): ReferenceItemDto {
    return {
      name: entity.name,
      slug: entity.slugValue,
    };
  }
}
