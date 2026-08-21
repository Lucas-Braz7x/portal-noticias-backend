import { Author } from '../entities/author.entity';

export const AUTHOR_REPOSITORY = Symbol('AUTHOR_REPOSITORY');

export interface IAuthorRepository {
  findByName(name: string): Promise<Author | null>;
  findOrCreateByName(name: string): Promise<Author>;
}
