import { PrismaClient } from '@playmorrow/database';
import * as readline from 'node:readline/promises';
import * as fs from 'node:fs';
import { resolve } from 'path';

/**
 * Cleanup script for production test artifacts.
 *
 * Identifies and optionally removes data matching test/placeholder patterns
 * (Date.now() suffixed slugs like *-g-1783..., studio-g-..., test users, etc).
 *
 * Dry-run by default — pass --apply to delete.
 * Pass --yes for non-interactive (CI/automation).
 *
 * IMPORTANT: Only loads .env when no DATABASE_URL is already present in env
 * (respects railway run, docker-compose postgres-test, TEST_DATABASE_URL in CI).
 *
 * Usage:
 *   pnpm --filter @playmorrow/api exec tsx apps/api/src/scripts/cleanup-test-artifacts.ts
 *   railway run --service playmorrow-api pnpm --filter @playmorrow/api exec tsx apps/api/src/scripts/cleanup-test-artifacts.ts --apply --yes
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');
  const forceYes = args.includes('--yes');

  // Load .env *only* as fallback. Never override DATABASE_URL when running
  // under railway (prod DB injected), docker test service, or CI with TEST_DATABASE_URL.
  if (!process.env.DATABASE_URL) {
    const envPath = resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      process.loadEnvFile(envPath);
    }
  }

  const prisma = new PrismaClient();
  await prisma.$connect();

  console.log(`🧹 Test Artifact Cleanup (${dryRun ? 'DRY RUN' : 'APPLY'}${forceYes ? ' --yes' : ''})\n`);

  const dryRunNotice = dryRun ? '\n⚠️  DRY RUN — no changes made. Re-run with --apply [--yes] to delete.' : '';

  // ── Users with placeholder patterns (protect known demo account) ──
  const DEMO_EMAIL = 'dev@playmorrow.example';
  const testUsersRaw = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: 'test' } },
        { email: { contains: 'example.com' } },
        { email: { contains: '@github.oauth' } },
        { username: { startsWith: 'pending_' } },
      ],
    },
    select: { id: true, email: true, username: true, displayName: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  const testUsers = testUsersRaw.filter(u => u.email !== DEMO_EMAIL);

  if (testUsers.length > 0) {
    console.log(`\nUsers matching test patterns (${testUsers.length}):`);
    for (const u of testUsers) {
      const studioCount = await prisma.studioMember.count({ where: { userId: u.id } });
      const gameCount = await prisma.devlog.count({ where: { authorId: u.id } });
      console.log(`  [${u.id.slice(0, 8)}…] ${u.email} / @${u.username} (${u.displayName}) — ${studioCount} studios, ${gameCount} devlogs — created ${u.createdAt.toISOString().slice(0, 10)}`);
    }
  } else if (testUsersRaw.length > 0) {
    console.log(`\nUsers matching patterns: ${testUsersRaw.length} (all protected — e.g. demo user preserved)`);
  }

  // ── Studios matching test patterns (Date.now() suffixed + obvious test names) ──
  const testStudios = await prisma.studio.findMany({
    where: {
      OR: [
        { slug: { contains: 'test' } },
        { slug: { contains: '-g-' } },
        { slug: { contains: '-dl-' } },
        { slug: { contains: '-nt' } },
        { slug: { contains: '-rp' } },
        { slug: { contains: '-fw-' } },
        { slug: { contains: '-del-' } },
        { name: { contains: 'test', mode: 'insensitive' } },
        { name: { contains: 'Game Test', mode: 'insensitive' } },
        { name: { contains: 'Devlog Test', mode: 'insensitive' } },
        { name: { equals: '' } },
      ],
    },
    select: { id: true, slug: true, name: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  if (testStudios.length > 0) {
    console.log(`\nStudios matching test patterns (${testStudios.length}):`);
    for (const s of testStudios) {
      const gameCount = await prisma.game.count({ where: { studioId: s.id } });
      const memberCount = await prisma.studioMember.count({ where: { studioId: s.id } });
      console.log(`  ${s.slug} — "${s.name}" (${gameCount} games, ${memberCount} members) — created ${s.createdAt.toISOString().slice(0, 10)}`);
    }
  }

  // ── Games matching test patterns (Date.now() suffixed like game-g-1783... + test titles) ──
  const testGamesRaw = await prisma.game.findMany({
    where: {
      OR: [
        { slug: { contains: 'test' } },
        { slug: { contains: '-g-' } },
        { slug: { contains: '-test-' } },
        { title: { contains: 'test', mode: 'insensitive' } },
        { title: { equals: 'Final Title' } },
        { title: { equals: '' } },
      ],
    },
    select: { id: true, slug: true, title: true, studioId: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  // Never touch the canonical 5 demo games even if they somehow matched
  const GOOD_GAME_SLUGS = ['neon-warden', 'starfall-tactics', 'mossbound', 'paper-relics', 'voidrunner'];
  const testGames = testGamesRaw.filter(g => !GOOD_GAME_SLUGS.includes(g.slug));

  if (testGames.length > 0) {
    console.log(`\nGames matching test patterns (${testGames.length}):`);
    for (const g of testGames) {
      const studio = await prisma.studio.findUnique({ where: { id: g.studioId }, select: { slug: true } });
      const devlogCount = await prisma.devlog.count({ where: { gameId: g.id } });
      const commentCount = await prisma.comment.count({ where: { gameId: g.id } });
      console.log(`  ${g.slug} — "${g.title}" (studio: ${studio?.slug ?? '?'}, ${devlogCount} devlogs, ${commentCount} comments) — created ${g.createdAt.toISOString().slice(0, 10)}`);
    }
  }

  // ── Summary ──
  const totalGames = await prisma.game.count();
  const totalStudios = await prisma.studio.count();
  const totalUsers = await prisma.user.count();
  const totalDevlogs = await prisma.devlog.count();

  console.log(`\n─── Summary ───`);
  console.log(`  Users:   ${totalUsers} total, ${testUsers.length} matching test pattern (raw match before demo protect: ${testUsersRaw.length})`);
  console.log(`  Studios: ${totalStudios} total, ${testStudios.length} matching test pattern`);
  console.log(`  Games:   ${totalGames} total, ${testGames.length} matching test pattern (raw: ${testGamesRaw.length})`);
  console.log(`  Devlogs: ${totalDevlogs} total`);

  if (dryRun) {
    console.log(dryRunNotice);
    await prisma.$disconnect();
    return;
  }

  const totalToDelete = testUsers.length + testStudios.length + testGames.length;
  if (totalToDelete === 0) {
    console.log('\nNothing to delete.');
    await prisma.$disconnect();
    return;
  }

  if (!forceYes) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(`\n⚠️  Delete ${testUsers.length} user(s), ${testStudios.length} studio(s), ${testGames.length} game(s)? (type "yes" to confirm): `);
    rl.close();

    if (answer !== 'yes') {
      console.log('Skipped.');
      await prisma.$disconnect();
      return;
    }
  } else {
    console.log(`\n--yes: proceeding to delete ${testUsers.length} users + ${testStudios.length} studios + ${testGames.length} games (non-interactive).`);
  }

  // Delete in dependency order — handle non-cascade relations, then let cascade handle the rest
  for (const user of testUsers) {
    await prisma.$transaction([
      // Non-cascade: Notification.actor has onDelete: SetNull
      prisma.notification.updateMany({ where: { actorId: user.id }, data: { actorId: null } }),
      // Non-cascade: ModerationReport.resolvedBy has onDelete: SetNull
      prisma.moderationReport.updateMany({ where: { resolvedById: user.id }, data: { resolvedById: null } }),
      // Non-cascade: AuditLog.actorId — no cascade, must delete
      prisma.auditLog.deleteMany({ where: { actorId: user.id } }),
      // Non-cascade: StudioInvitation.invitedById — no cascade, must delete
      prisma.studioInvitation.deleteMany({ where: { invitedById: user.id } }),
      // Non-cascade: StudioInvitation.userId — optional, SetNull behavior
      prisma.studioInvitation.deleteMany({ where: { userId: user.id } }),
      // Non-cascade: StudioChatMessage.authorId — no cascade in schema
      prisma.studioChatMessage.deleteMany({ where: { authorId: user.id } }),
      // Cascade-safe: the rest use onDelete: Cascade
      prisma.user.delete({ where: { id: user.id } }),
    ]);
    console.log(`  ✅ Deleted user ${user.email}`);
  }

  for (const studio of testStudios) {
    // Games under studio will cascade via Prisma relations
    await prisma.studio.delete({ where: { id: studio.id } });
    console.log(`  ✅ Deleted studio ${studio.slug} (and its games, devlogs, etc.)`);
  }

  for (const game of testGames) {
    // Cascade handled by Prisma (Game -> devlogs, comments, etc.)
    await prisma.game.delete({ where: { id: game.id } });
    console.log(`  ✅ Deleted game ${game.slug}`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});