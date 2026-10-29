import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/prisma/client.js';
import { seedAdmin } from './seed-admin.js';
import { seedCategories, seedFacets } from './seed-catalog.js';
import { seedMedia } from './seed-media.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL не задан');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

try {
  console.log('Сид:');
  await seedAdmin(prisma);
  const facets = await seedFacets(prisma);
  await seedCategories(prisma, facets);
  await seedMedia(prisma);
  console.log('Готово.');
} finally {
  await prisma.$disconnect();
}
