import { randomUUID } from 'crypto';
import { execSync } from 'child_process';
import {
  existsSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';

export const TEST_SCHEMA_FILE = join(process.cwd(), '.test-schema');

const DEFAULT_BASE_URL =
  'postgresql://portal:portal@localhost:5432/portal_noticias';

export function getBaseDatabaseUrl(): string {
  const raw =
    process.env.TEST_DATABASE_BASE_URL ??
    process.env.DATABASE_URL ??
    DEFAULT_BASE_URL;

  return raw.replace(/[?&]schema=[^&]*/g, '').replace(/\?$/, '');
}

export function buildTestSchemaName(): string {
  return `test_${randomUUID().replace(/-/g, '')}`;
}

export function buildDatabaseUrl(schema: string): string {
  const base = getBaseDatabaseUrl();
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}schema=${schema}`;
}

export async function createTestSchema(schema: string): Promise<void> {
  const prisma = new PrismaClient({
    datasources: { db: { url: buildDatabaseUrl('public') } },
  });

  try {
    await prisma.$connect();
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
  } finally {
    await prisma.$disconnect();
  }
}

export async function dropTestSchema(schema: string): Promise<void> {
  const prisma = new PrismaClient({
    datasources: { db: { url: buildDatabaseUrl('public') } },
  });

  try {
    await prisma.$connect();
    await prisma.$executeRawUnsafe(
      `DROP SCHEMA IF EXISTS "${schema}" CASCADE`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

export function runMigrations(databaseUrl: string): void {
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    cwd: process.cwd(),
    stdio: 'pipe',
  });
}

export function persistTestSchema(
  schema: string,
  databaseUrl: string,
): void {
  writeFileSync(
    TEST_SCHEMA_FILE,
    JSON.stringify({ schema, databaseUrl }),
    'utf8',
  );
}

export function loadTestSchema(): {
  schema: string;
  databaseUrl: string;
} | null {
  if (!existsSync(TEST_SCHEMA_FILE)) {
    return null;
  }

  return JSON.parse(readFileSync(TEST_SCHEMA_FILE, 'utf8')) as {
    schema: string;
    databaseUrl: string;
  };
}

export function removeTestSchemaFile(): void {
  if (existsSync(TEST_SCHEMA_FILE)) {
    unlinkSync(TEST_SCHEMA_FILE);
  }
}

let testPrisma: PrismaClient | undefined;

export function getTestPrisma(): PrismaClient {
  if (!testPrisma) {
    const url = process.env.DATABASE_URL;

    if (!url) {
      throw new Error(
        'DATABASE_URL not set. Run integration tests via yarn test:integration.',
      );
    }

    testPrisma = new PrismaClient({
      datasources: { db: { url } },
    });
  }

  return testPrisma;
}

export async function disconnectTestPrisma(): Promise<void> {
  if (testPrisma) {
    await testPrisma.$disconnect();
    testPrisma = undefined;
  }
}

export async function resetTables(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      article_tags,
      articles,
      tags,
      categories,
      authors
    RESTART IDENTITY CASCADE
  `);
}
