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
    console.error('User with configured owner email not found. Create the user first via registration, then run this script again.');
    await prisma.$disconnect();
    process.exit(1);
  }

  if (user.role === 'ADMIN') {
    console.log('Owner user is already ADMIN.');
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
    });
    console.log('Owner user promoted to ADMIN successfully.');
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
