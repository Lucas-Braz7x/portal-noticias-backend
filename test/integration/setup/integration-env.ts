import {
  disconnectTestPrisma,
  getTestPrisma,
  resetTables,
} from '../helpers/database.helper';

beforeEach(async () => {
  const prisma = getTestPrisma();
  await prisma.$connect();
  await resetTables(prisma);
});

afterAll(async () => {
  await disconnectTestPrisma();
});
