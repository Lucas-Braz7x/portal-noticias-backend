import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { Category } from '../../domain/entities/category.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { ICategoryRepository } from '../../domain/repositories/category.repository';
import { ReferenceMapper } from '../mappers/reference.mapper';

@Injectable()
export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Category[]> {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    return categories.map((category) =>
      ReferenceMapper.toCategoryDomain(category),
    );
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
    });

    return category ? ReferenceMapper.toCategoryDomain(category) : null;
  }

  async findOrCreate(props: {
    name: string;
    slug?: string;
  }): Promise<Category> {
    const slug = props.slug
      ? Slug.create(props.slug).value
      : Slug.fromTitle(props.name).value;

    const existing = await this.findBySlug(slug);

    if (existing) {
      return existing;
    }

    const created = await this.prisma.category.create({
      data: {
        name: props.name.trim(),
        slug,
      },
    });

    return ReferenceMapper.toCategoryDomain(created);
  }
}
