import {
  disconnectTestPrisma,
  dropTestSchema,
  loadTestSchema,
  removeTestSchemaFile,
} from '../helpers/database.helper';

export default async function globalTeardown(): Promise<void> {
  await disconnectTestPrisma();

  const config = loadTestSchema();

  if (config) {
    await dropTestSchema(config.schema);
    removeTestSchemaFile();
  }
}
