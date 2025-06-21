import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed Statuses
  const statuses = await Promise.all([
    prisma.status.upsert({
      where: { name: 'Applied' },
      update: {},
      create: { name: 'Applied', color: '#3B82F6', sortOrder: 1 }
    }),
    prisma.status.upsert({
      where: { name: 'Phone Screen' },
      update: {},
      create: { name: 'Phone Screen', color: '#F59E0B', sortOrder: 2 }
    }),
    prisma.status.upsert({
      where: { name: 'Offer' },
      update: {},
      create: { name: 'Offer', color: '#10B981', sortOrder: 5 }
    }),
    prisma.status.upsert({
      where: { name: 'Rejected' },
      update: {},
      create: { name: 'Rejected', color: '#EF4444', sortOrder: 6 }
    })
  ]);

  console.log(`✅ Created ${statuses.length} statuses`);


  console.log('🎉 Seeding completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });