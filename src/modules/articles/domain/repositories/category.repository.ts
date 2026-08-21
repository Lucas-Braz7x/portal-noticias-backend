import { Category } from '../entities/category.entity';

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');

export interface ICategoryRepository {
  findBySlug(slug: string): Promise<Category | null>;
  findOrCreate(props: { name: string; slug?: string }): Promise<Category>;
}
