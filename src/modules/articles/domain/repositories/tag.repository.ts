import { Tag } from '../entities/tag.entity';

export const TAG_REPOSITORY = Symbol('TAG_REPOSITORY');

export interface ITagRepository {
  findBySlug(slug: string): Promise<Tag | null>;
  findOrCreateMany(
    items: Array<{ name: string; slug?: string }>,
  ): Promise<Tag[]>;
}
