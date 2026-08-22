import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { Tag } from '../../domain/entities/tag.entity';
import { Slug } from '../../domain/value-objects/slug.vo';
import { ITagRepository } from '../../domain/repositories/tag.repository';
import { ReferenceMapper } from '../mappers/reference.mapper';

@Injectable()
export class PrismaTagRepository implements ITagRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Tag[]> {
    const tags = await this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });

    return tags.map(ReferenceMapper.toTagDomain);
  }

  async findBySlug(slug: string): Promise<Tag | null> {
    const tag = await this.prisma.tag.findUnique({
      where: { slug },
    });

    return tag ? ReferenceMapper.toTagDomain(tag) : null;
  }

  async findOrCreateMany(
    items: Array<{ name: string; slug?: string }>,
  ): Promise<Tag[]> {
    const tags: Tag[] = [];

    for (const item of items) {
      const slug = item.slug
        ? Slug.create(item.slug).value
        : Slug.fromTitle(item.name).value;

      const existing = await this.findBySlug(slug);

      if (existing) {
        tags.push(existing);
        continue;
      }

      const created = await this.prisma.tag.create({
        data: {
          name: item.name.trim(),
          slug,
        },
      });

      tags.push(ReferenceMapper.toTagDomain(created));
    }

    return tags;
  }
}
