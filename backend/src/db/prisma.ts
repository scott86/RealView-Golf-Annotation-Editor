import pkg from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { PrismaClient } = pkg;
const { Pool } = pg;

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Create a single Prisma Client instance with adapter
export const prisma = new PrismaClient({
  adapter,
  log: ['query', 'info', 'warn', 'error'],
});

// Handle cleanup on app shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  await pool.end();
});

