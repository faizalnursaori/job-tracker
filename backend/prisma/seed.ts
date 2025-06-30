import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed Companies
  const companies = await Promise.all([
    prisma.company.upsert({
      where: { name: 'Google' },
      update: {},
      create: {
        name: 'Google',
        industry: 'Technology',
        website: 'https://google.com',
        location: 'Mountain View, CA',
        description: 'Search engine and technology company',
        size: '10000+'
      }
    }),
    prisma.company.upsert({
      where: { name: 'Microsoft' },
      update: {},
      create: {
        name: 'Microsoft',
        industry: 'Technology',
        website: 'https://microsoft.com',
        location: 'Redmond, WA',
        description: 'Software and cloud services company',
        size: '10000+'
      }
    }),
    prisma.company.upsert({
      where: { name: 'Meta' },
      update: {},
      create: {
        name: 'Meta',
        industry: 'Technology',
        website: 'https://meta.com',
        location: 'Menlo Park, CA',
        description: 'Social media and virtual reality company',
        size: '10000+'
      }
    })
  ]);

  console.log(`✅ Created ${companies.length} companies`);
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