import {
  buildDatabaseUrl,
  buildTestSchemaName,
  createTestSchema,
  persistTestSchema,
  runMigrations,
} from '../helpers/database.helper';

export default async function globalSetup(): Promise<void> {
  const schema = buildTestSchemaName();
  const databaseUrl = buildDatabaseUrl(schema);

  try {
    await createTestSchema(schema);
    runMigrations(databaseUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    throw new Error(
      `Failed to setup integration test database. Is Postgres running? Try: docker compose up -d\n${message}`,
    );
  }

  process.env.DATABASE_URL = databaseUrl;
  persistTestSchema(schema, databaseUrl);
}
