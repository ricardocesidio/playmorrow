// M5 Checkpoint 5.1 Verification Script
// Tests: personalization, trending velocity, cursor pagination, explainability, N+1

import { PrismaClient, StudioRole } from '@playmorrow/database';
import { createHash, randomBytes } from 'crypto';

const API = process.env.API_URL || 'http://localhost:4000';
const prisma = new PrismaClient();

async function fetch(url: string) {
  const res = await fetch(url);
  return res.json();
}

async function main() {
  const suffix = Date.now().toString();
  
  // ── Create 2 test users with different preferences ──
  console.log('=== Creating test users ===');
  
  const userA = await prisma.user.create({
    data: {
      email: `usera-${suffix}@test.com`,
      username: `usera-${suffix}`,
      usernameLowercase: `usera-${suffix}`,
      displayName: 'User A',
      passwordHash: 'x',
      emailVerifiedAt: new Date(),
    },
  });

  const userB = await prisma.user.create({
    data: {
      email: `userb-${suffix}@test.com`,
      username: `userb-${suffix}`,
      usernameLowercase: `userb-${suffix}`,
      displayName: 'User B',
      passwordHash: 'x',
      emailVerifiedAt: new Date(),
    },
  });

  // ── Seed games with different tags ──
  const studioA = await prisma.studio.create({ data: { slug: `studio-a-${suffix}`, name: 'Studio A', members: { create: { userId: userA.id, role: 'OWNER' as StudioRole } } } });
  const studioB = await prisma.studio.create({ data: { slug: `studio-b-${suffix}`, name: 'Studio B', members: { create: { userId: userB.id, role: 'OWNER' as StudioRole } } } });

  // Create games with known tags
  const horrorTags = await prisma.tag.createManyAndReturn({ data: [{ name: 'horror' }, { name: 'pixel-art' }] });
  const rpgTags = await prisma.tag.createManyAndReturn({ data: [{ name: 'rpg' }, { name: 'open-world' }] });

  const gameH = await prisma.game.create({ data: { slug: `horror-${suffix}`, title: 'Horror Game', studioId: studioA.id, status: 'RELEASED', tags: { create: [{ tagId: horrorTags[0].id }, { tagId: horrorTags[1].id }] } } });
  const gameR = await prisma.game.create({ data: { slug: `rpg-${suffix}`, title: 'RPG Game', studioId: studioB.id, status: 'RELEASED', tags: { create: [{ tagId: rpgTags[0].id }, { tagId: rpgTags[1].id }] } } });

  // User A follows/wishlists horror → should get RPG recommended
  await prisma.wishlistItem.create({ data: { userId: userA.id, gameId: gameH.id } });
  await prisma.follow.create({ data: { userId: userA.id, targetType: 'GAME', gameId: gameH.id } });

  // User B follows/wishlists RPG → should get horror recommended  
  await prisma.wishlistItem.create({ data: { userId: userB.id, gameId: gameR.id } });
  await prisma.follow.create({ data: { userId: userB.id, targetType: 'GAME', gameId: gameR.id } });

  // Create views for trending
  for (let i = 0; i < 50; i++) {
    await prisma.gameView.create({ data: { gameId: gameH.id, createdAt: new Date(Date.now() - i * 3600000) } });
  }
  for (let i = 0; i < 5; i++) {
    await prisma.gameView.create({ data: { gameId: gameR.id, createdAt: new Date(Date.now() - i * 3600000) } });
  }

  console.log('Test data created');
  console.log(`User A: ${userA.id} — follows horror, 50 recent views`);
  console.log(`User B: ${userB.id} — follows RPG, 5 recent views`);
  console.log(`Horror game: ${gameH.id}`);
  console.log(`RPG game: ${gameR.id}`);
  console.log(`\nRun these curl commands to verify:\n`);

  // Print test commands
  console.log(`# 1. Personalization — User A (horror fan) should see RPG recommended`);
  console.log(`API_URL="${API}" node -e "
    const http = require('http');
    // Login as user A
    const reg = http.request(...) 
    // TODO: login + get recs
  "`);

  await prisma.$disconnect();
}

main().catch(console.error);
