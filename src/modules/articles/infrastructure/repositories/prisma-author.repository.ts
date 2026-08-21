import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { Author } from '../../domain/entities/author.entity';
import { IAuthorRepository } from '../../domain/repositories/author.repository';
import { ReferenceMapper } from '../mappers/reference.mapper';

@Injectable()
export class PrismaAuthorRepository implements IAuthorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByName(name: string): Promise<Author | null> {
    const author = await this.prisma.author.findFirst({
      where: { name: name.trim() },
    });

    return author ? ReferenceMapper.toAuthorDomain(author) : null;
  }

  async findOrCreateByName(name: string): Promise<Author> {
    const trimmedName = name.trim();
    const existing = await this.findByName(trimmedName);

    if (existing) {
      return existing;
    }

    const created = await this.prisma.author.create({
      data: { name: trimmedName },
    });

    return ReferenceMapper.toAuthorDomain(created);
  }
}
