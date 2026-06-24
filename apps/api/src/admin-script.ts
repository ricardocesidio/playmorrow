import { PrismaClient } from '@playmorrow/database';

async function main() {
  const email = process.env.PLAYMORROW_OWNER_EMAIL;
  if (!email) {
    console.error('PLAYMORROW_OWNER_EMAIL is not set. Set it in .env or environment.');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  if (!user) {
    const username = process.env.PLAYMORROW_OWNER_USERNAME || 'owner';
    console.error(`User with email "${email}" not found. Create the user first via registration, then run this script again.`);
    console.error(`Expected username: ${username}`);
    await prisma.$disconnect();
    process.exit(1);
  }

  if (user.role === 'ADMIN') {
    console.log(`User ${email} is already ADMIN.`);
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
    });
    console.log(`Promoted ${email} to ADMIN.`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
