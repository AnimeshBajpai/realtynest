import 'dotenv/config';
import { PrismaClient } from '../node_modules/generated-prisma-client/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const passwordHash = await bcrypt.hash('Secret@123', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'animesh.bajpai12@gmail.com' },
    update: {
      passwordHash,
      firstName: 'Animesh',
      lastName: 'Bajpai',
      phone: '9620115459',
      role: 'SUPER_ADMIN',
      agencyId: null,
      isActive: true,
    },
    create: {
      email: 'animesh.bajpai12@gmail.com',
      passwordHash,
      firstName: 'Animesh',
      lastName: 'Bajpai',
      phone: '9620115459',
      role: 'SUPER_ADMIN',
      agencyId: null,
      isActive: true,
    },
  });

  console.log('Super Admin seeded:', superAdmin.email);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
