import { PrismaClient } from '@playmorrow/database';
import * as fs from 'node:fs';
import { resolve } from 'path';

// Load .env only as fallback (never override when DATABASE_URL provided by railway / docker test / CI)
if (!process.env.DATABASE_URL) {
  const envPath = resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    process.loadEnvFile(envPath);
  }
}

const prisma = new PrismaClient();

const TAG_SLUGS = ['action', 'rpg', 'puzzle', 'strategy', 'platformer', 'adventure', 'simulation', 'horror', 'retro', 'co-op', 'single-player', 'multiplayer', 'pixel-art', '3d', 'story-rich', 'open-world'];

const GAME_PLACEHOLDER_COVERS = [
  '/cover/placeholder-1.svg',
  '/cover/placeholder-2.svg',
  '/cover/placeholder-3.svg',
  '/cover/placeholder-4.svg',
  '/cover/placeholder-5.svg',
];

const SCREENSHOT_PLACEHOLDERS = [
  '/screenshots/ss-1.svg', '/screenshots/ss-2.svg', '/screenshots/ss-3.svg',
];

interface GameBlueprint {
  studio: { name: string; slug: string; tagline: string; description: string };
  game: {
    title: string; slug: string; tagline: string; description: string;
    status: string; genres: string; isFree: boolean; currency: string;
    expectedReleaseText: string; featured: boolean;
  };
  tags: string[];
  platforms: { kind: string; url: string; label?: string }[];
  devlogs: { title: string; subtitle: string; body: string; category: string; tags: string[]; readingTimeMin: number }[];
  roadmap: { title: string; description: string; status: string; targetDate: string }[];
}

const GAMES: GameBlueprint[] = [
  {
    studio: {
      name: 'Neon Forge',
      slug: 'neon-forge',
      tagline: 'Crafting cyberpunk dreams since 2024.',
      description: 'Neon Forge is a small indie studio based in Berlin, focused on narrative-driven cyberpunk experiences. Our team combines hand-crafted pixel art with deep storytelling.',
    },
    game: {
      title: 'Neon Warden', slug: 'neon-warden',
      tagline: 'Justice is a ghost in the machine.',
      description: 'A cyberpunk noir RPG set in a sprawling neon-lit metropolis. Play as Warden-7, an AI enforcer who discovers a conspiracy that threatens the fabric of reality. Navigate corporate intrigue, hack into secure networks, and make choices that shape the fate of Neo-City.',
      status: 'BETA', genres: 'RPG, Cyberpunk, Noir',
      isFree: false, currency: 'USD',
      expectedReleaseText: 'Q1 2027',
      featured: true,
    },
    tags: ['rpg', 'story-rich', 'cyberpunk'],
    platforms: [
      { kind: 'STEAM', url: 'https://store.steampowered.com/app/neon-warden', label: 'Steam' },
      { kind: 'ITCH', url: 'https://neonforge.itch.io/neon-warden', label: 'itch.io' },
      { kind: 'DISCORD', url: 'https://discord.gg/neonwarden', label: 'Discord' },
    ],
    devlogs: [
      { title: 'Introducing Neo-City', subtitle: 'A first look at our dystopian metropolis', body: '## Welcome to Neo-City\n\nNeo-City is a sprawling metropolis divided into three distinct districts. Each district has its own visual identity, soundscape, and narrative arc.\n\n### The Spires\nHome to the corporate elite. Gleaming towers pierce the smog-filled sky, each one a monument to wealth and power.\n\n### The Warrens\nThe underbelly of Neo-City. Tight corridors, flickering neon signs, and a population fighting for survival.\n\n### The Core\nThe heart of the city\'s AI infrastructure. A sterile, automated zone where humans are rarely seen.\n\nWe\'ve been building these environments for the past 6 months and can\'t wait to show you more!', category: 'DEVELOPMENT', tags: ['world-building', 'environment'], readingTimeMin: 3 },
      { title: 'Combat System Deep Dive', subtitle: 'How hacking meets gunplay', body: '## Combat in Neon Warden\n\nOur combat system blends real-time gunplay with a unique hacking mechanic. Here\'s how it works:\n\n### The Grid\nPress TAB to enter the Grid — a real-time tactical overlay where you can see enemy patrol routes, hackable objects, and security systems.\n\n### Hack Abilities\n- **Override**: Take control of enemy turrets\n- **Disrupt**: Temporarily disable enemy shields\n- **Puppet**: Force an enemy to fight for you\n\n### Synergy System\nChain hacks with gunplay for bonus damage. For example, Disrupt an enemy\'s shield, then follow up with an EMP round for massive damage.', category: 'GAMEPLAY', tags: ['combat', 'mechanics'], readingTimeMin: 5 },
    ],
    roadmap: [
      { title: 'Alpha Demo', description: 'First playable demo for closed testers', status: 'DONE', targetDate: '2026-01-15' },
      { title: 'Beta Launch', description: 'Public beta with first three districts', status: 'IN_PROGRESS', targetDate: '2026-06-01' },
      { title: 'Full Release', description: 'Complete game with all districts and storylines', status: 'PLANNED', targetDate: '2027-01-15' },
    ],
  },
  {
    studio: {
      name: 'Ember Labs',
      slug: 'ember-labs',
      tagline: 'Turn-based tactics with heart.',
      description: 'Ember Labs is a remote-first studio with team members across four continents. We specialize in tactical RPGs with deep strategic mechanics and compelling narratives.',
    },
    game: {
      title: 'Starfall Tactics', slug: 'starfall-tactics',
      tagline: 'Command the void. Shape the stars.',
      description: 'A deep turn-based strategy game set in a crumbling star empire. Command fleets, manage resource colonies, and navigate a branching story where every decision has consequences. Features a unique momentum-based combat system and full mod support.',
      status: 'ALPHA', genres: 'Strategy, Tactical, Sci-Fi',
      isFree: false, currency: 'USD',
      expectedReleaseText: 'Late 2026',
      featured: true,
    },
    tags: ['strategy', 'tactical', 'sci-fi'],
    platforms: [
      { kind: 'STEAM', url: 'https://store.steampowered.com/app/starfall-tactics', label: 'Steam' },
      { kind: 'GOG', url: 'https://www.gog.com/game/starfall_tactics', label: 'GOG' },
    ],
    devlogs: [
      { title: 'Fleet Command 101', subtitle: 'Building your armada from scratch', body: '## Building Your Fleet\n\nIn Starfall Tactics, your fleet is your most important asset. Here\'s what we\'ve been working on:\n\n### Ship Classes\n- **Frigates**: Fast, agile, perfect for scouting\n- **Cruisers**: Balanced all-rounders\n- **Battleships**: Slow but devastating\n- **Carriers**: Deploy fighter squadrons\n\n### Customization\nEach ship can be outfitted with weapons, shields, engines, and special modules. Mix and match to create your ideal fleet composition.', category: 'DEVELOPMENT', tags: ['ships', 'combat'], readingTimeMin: 4 },
      { title: 'The Factions of Starfall', subtitle: 'Three empires, one galaxy', body: '## Meet the Factions\n\n### The Dominion\nA decaying empire clinging to power. Their ships are durable but outdated. They rely on sheer numbers and heavy armor.\n\n### The Collective\nA coalition of rebel systems. Their strength lies in hit-and-run tactics and advanced electronic warfare.\n\n### The Outlanders\nIndependent colonies and pirates. Unpredictable but resourceful, they field a motley collection of salvaged and modified ships.\n\nEach faction has a unique tech tree and campaign, offering dozens of hours of gameplay.', category: 'LORE', tags: ['factions', 'world-building'], readingTimeMin: 3 },
    ],
    roadmap: [
      { title: 'Pre-Alpha Prototype', description: 'Core combat prototype', status: 'DONE', targetDate: '2025-08-01' },
      { title: 'Closed Alpha', description: 'Faction campaigns playable', status: 'IN_PROGRESS', targetDate: '2026-03-01' },
      { title: 'Beta + Mod Support', description: 'Public beta with modding tools', status: 'PLANNED', targetDate: '2026-09-01' },
    ],
  },
  {
    studio: {
      name: 'Wildberry Games',
      slug: 'wildberry-games',
      tagline: 'Charming worlds. Deep stories.',
      description: 'Wildberry Games is a cozy game studio from Kyoto, Japan. We craft beautifully illustrated adventure games with heartwarming stories.',
    },
    game: {
      title: 'Mossbound', slug: 'mossbound',
      tagline: 'A tiny hero. A giant world.',
      description: 'An enchanting adventure game set in a miniature world of moss and mushrooms. Play as Pip, a tiny sprout-keeper on a journey to restore the Great Tree. Explore lush environments, befriend curious insects, and solve puzzles in a hand-painted world that reacts to your every step.',
      status: 'IN_DEVELOPMENT', genres: 'Adventure, Puzzle, Cozy',
      isFree: false, currency: 'USD',
      expectedReleaseText: 'Spring 2027',
      featured: true,
    },
    tags: ['adventure', 'puzzle', 'cozy'],
    platforms: [
      { kind: 'STEAM', url: 'https://store.steampowered.com/app/mossbound', label: 'Steam' },
      { kind: 'NINTENDO', url: 'https://nintendo.com/games/mossbound', label: 'Switch' },
    ],
    devlogs: [
      { title: 'Painting Mossbound', subtitle: 'Our art style and inspiration', body: '## The Art of Mossbound\n\nMossbound is entirely hand-painted using a combination of watercolor textures and digital painting. Every leaf, mushroom, and bug is crafted with care.\n\n### Inspiration\nStudio Ghibli\'s miniature worlds and the detailed ecosystems of games like Hollow Knight inspired our approach.\n\n### Technical Process\n1. Concept sketches on paper\n2. Digital painting in Procreate\n3. Animation and rigging in Spine\n4. Lighting and effects in Unity\n\nThe result is a world that feels alive and organic.', category: 'ART', tags: ['art-style', 'inspiration'], readingTimeMin: 4 },
      { title: 'Meet the Characters', subtitle: 'The inhabitants of Mossbound', body: '## Characters\n\n### Pip\nThe protagonist. A young sprout-keeper with a big heart and an even bigger sense of adventure.\n\n### Mothwick\nA scholarly moth who guides Pip through the early parts of the journey.\n\n### Grumble\nA grumpy but lovable beetle who runs the local ferry service.\n\n### The Lumen\nMysterious light beings that hold the key to restoring the Great Tree.\n\nWe\'ve been voice-casting for the past month and are excited to announce our lead actors soon!', category: 'LORE', tags: ['characters', 'story'], readingTimeMin: 3 },
      { title: 'Puzzle Design Philosophy', subtitle: 'Accessible but challenging', body: '## Our Approach to Puzzles\n\nMossbound\'s puzzles are designed to be intuitive but rewarding. We follow a few key principles:\n\n### Natural Discovery\nPuzzles emerge from the environment, not arbitrary lock-and-key mechanics.\n\n### Multiple Solutions\nMost puzzles can be solved in 2-3 different ways, rewarding creative thinking.\n\n### Optional Challenges\nFor players who want more, we\'ve hidden optional puzzles throughout the world.\n\n### Accessibility\nPlayers can adjust puzzle difficulty at any time without affecting the story.', category: 'DESIGN', tags: ['puzzles', 'design-philosophy'], readingTimeMin: 5 },
    ],
    roadmap: [
      { title: 'Vertical Slice', description: 'Complete demo of first area', status: 'DONE', targetDate: '2026-02-01' },
      { title: 'Full Art Pass', description: 'Complete art for all environments', status: 'IN_PROGRESS', targetDate: '2026-07-01' },
      { title: 'Sound Design', description: 'Full audio and music composition', status: 'PLANNED', targetDate: '2026-10-01' },
      { title: 'Release', description: 'Launch on Steam and Switch', status: 'PLANNED', targetDate: '2027-04-01' },
    ],
  },
  {
    studio: {
      name: 'Clockwork Interactive',
      slug: 'clockwork-interactive',
      tagline: 'Where history meets gameplay.',
      description: 'Clockwork Interactive is an indie studio from Prague, Czech Republic. We create narrative puzzle games that explore forgotten histories and ancient mysteries.',
    },
    game: {
      title: 'Paper Relics', slug: 'paper-relics',
      tagline: 'Unfold the past.',
      description: 'A unique puzzle game where you manipulate papercraft dioramas to uncover hidden stories. Each chapter presents a beautifully crafted paper world that you can fold, tear, and reshape to reveal secrets of a forgotten civilization. Features an original soundtrack and a meditative, tactile gameplay experience.',
      status: 'IN_DEVELOPMENT', genres: 'Puzzle, Narrative, Atmospheric',
      isFree: false, currency: 'USD',
      expectedReleaseText: 'Holiday 2026',
      featured: false,
    },
    tags: ['puzzle', 'narrative', 'atmospheric'],
    platforms: [
      { kind: 'STEAM', url: 'https://store.steampowered.com/app/paper-relics', label: 'Steam' },
      { kind: 'ITCH', url: 'https://clockwork.itch.io/paper-relics', label: 'itch.io Demo' },
    ],
    devlogs: [
      { title: 'Papercraft Technology', subtitle: 'How we fold reality in Unity', body: '## Building with Paper\n\nPaper Relics uses a custom shader system that simulates real paper physics. Here\'s how we do it:\n\n### Folding System\nEach diorama is constructed from layered 2D planes with vertex displacement. When the player folds a section, we calculate the crease dynamically.\n\n### Tearing Mechanics\nUsing a stencil buffer, players can tear away sections of paper to reveal hidden layers beneath. Each tear is unique.\n\n### Lighting\nPaper responds differently to light than solid objects. We developed a subsurface scattering shader that gives our paper worlds a warm, realistic glow.', category: 'TECHNOLOGY', tags: ['shaders', 'physics'], readingTimeMin: 4 },
      { title: 'The Lost Kingdom', subtitle: 'Building the world of Paper Relics', body: '## The World\n\nPaper Relics tells the story of the Sundered Kingdom, a civilization that existed between the cracks of recorded history.\n\n### Chapters\n1. **The Library** — Learn the basics of folding\n2. **The Observatory** — Discover celestial navigation\n3. **The Forge** — Master advanced techniques\n4. **The Archive** — Uncover the truth\n\nEach chapter introduces new mechanics while building on previous ones. The narrative unfolds through environmental storytelling and collectible lore pages.', category: 'DESIGN', tags: ['world-building', 'level-design'], readingTimeMin: 3 },
    ],
    roadmap: [
      { title: 'Prototype', description: 'Core folding mechanics', status: 'DONE', targetDate: '2025-11-01' },
      { title: 'Chapter 1-2', description: 'First two chapters complete', status: 'IN_PROGRESS', targetDate: '2026-05-01' },
      { title: 'Full Game', description: 'All chapters and polish', status: 'PLANNED', targetDate: '2026-12-01' },
    ],
  },
  {
    studio: {
      name: 'Singularity Softworks',
      slug: 'singularity-softworks',
      tagline: 'Push the boundaries of interactive storytelling.',
      description: 'Singularity Softworks is an experimental game studio based in Tokyo. We explore the intersection of AI, procedural generation, and emotional storytelling.',
    },
    game: {
      title: 'Voidrunner', slug: 'voidrunner',
      tagline: 'Every run tells a story.',
      description: 'A procedural roguelike where each run generates not just a new level, but a new story. Play as a courier navigating the edges of known space, delivering mysterious packages to strange worlds. The events of each run are woven into an evolving narrative that adapts to your choices and failures.',
      status: 'PRE_ALPHA', genres: 'Roguelike, Sci-Fi, Procedural',
      isFree: true, currency: 'USD',
      expectedReleaseText: '2027',
      featured: false,
    },
    tags: ['roguelike', 'procedural', 'sci-fi'],
    platforms: [
      { kind: 'STEAM', url: 'https://store.steampowered.com/app/voidrunner', label: 'Steam' },
      { kind: 'DISCORD', url: 'https://discord.gg/voidrunner', label: 'Community' },
    ],
    devlogs: [
      { title: 'Procedural Narrative Engine', subtitle: 'How every run tells a unique story', body: '## The Narrative Engine\n\nVoidrunner\'s most ambitious feature is its procedural narrative engine. Here\'s how it works:\n\n### Story Chunks\nWe\'ve written over 200 narrative fragments — character encounters, world events, discoveries, and consequences. Each run stitches these together based on player actions.\n\n### Memory System\nThe game remembers what happened in previous runs. Characters you helped (or betrayed) will remember. The universe evolves based on your cumulative actions.\n\n### Emotional Arcs\nThe engine tracks emotional beats and ensures each run has a satisfying narrative arc, even when generated procedurally.\n\n### Writer\'s Tool\nWe built a custom tool that lets our writers define narrative rules and branches without touching code.', category: 'TECHNOLOGY', tags: ['procedural', 'narrative'], readingTimeMin: 5 },
      { title: 'Early Prototype Gameplay', subtitle: 'First look at Voidrunner in action', body: '## Gameplay Overview\n\nWe just completed our first playable prototype! Here\'s what it includes:\n\n### Core Loop\n1. Accept a delivery contract\n2. Navigate procedurally generated space sectors\n3. Encounter events, characters, and hazards\n4. Deliver the package (or don\'t)\n5. Return to base and see how the story evolved\n\n### Current Features\n- 5 ship types with unique abilities\n- 40+ event encounters\n- Basic combat system\n- Cargo management\n\n### What\'s Next\nWe\'re now working on expanding the event pool and polishing the narrative engine. The team is small (3 people) but passionate!', category: 'DEVELOPMENT', tags: ['prototype', 'gameplay'], readingTimeMin: 3 },
      { title: 'Art Direction', subtitle: 'The visual language of the void', body: '## Our Visual Style\n\nVoidrunner embraces a minimalist, high-contrast art style inspired by:\n\n### Influences\n- *Blade Runner* — neon on darkness\n- *2001: A Space Odyssey* — vast, empty spaces\n- *Solaris* — the unknown as a character\n- *Hyper Light Drifter* — pixel art elegance\n\n### Color Palette\nDeep space blacks and blues, punctuated by warm neon accents. Each sector has a distinct color identity.\n\n### Technical Approach\nWe\'re using a custom post-processing stack to achieve a film-like look with chromatic aberration, lens flares, and grain.', category: 'ART', tags: ['art-direction', 'visuals'], readingTimeMin: 3 },
    ],
    roadmap: [
      { title: 'Vertical Slice', description: 'Complete gameplay loop prototype', status: 'DONE', targetDate: '2026-03-01' },
      { title: 'Narrative Expansion', description: 'Expand event pool to 100+ encounters', status: 'IN_PROGRESS', targetDate: '2026-08-01' },
      { title: 'Early Access', description: 'Steam Early Access launch', status: 'PLANNED', targetDate: '2027-01-01' },
    ],
  },
];

async function ensureTags() {
  for (const slug of TAG_SLUGS) {
    await prisma.tag.upsert({
      where: { slug },
      create: { slug, name: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) },
      update: {},
    });
  }
}

async function seed() {
  console.log('Seeding model games...\n');
  await ensureTags();
  console.log('Tags ready.\n');

  for (const bp of GAMES) {
    // Create or reuse studio
    let studio = await prisma.studio.findUnique({ where: { slug: bp.studio.slug } });
    if (!studio) {
      studio = await prisma.studio.create({
        data: {
          slug: bp.studio.slug,
          name: bp.studio.name,
          tagline: bp.studio.tagline,
          description: bp.studio.description,
          isVerified: true,
        },
      });
      console.log(`  Created studio: ${bp.studio.name}`);
    } else {
      console.log(`  Studio exists: ${bp.studio.name}`);
    }

    // Setup admin user as studio OWNER
    let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) {
      // Find or create a user to be admin
      admin = await prisma.user.findFirst({ where: { email: 'admin@playmorrow.dev' } });
      if (!admin) {
        console.log('  Creating admin user...');
        admin = await prisma.user.create({
          data: {
            email: 'admin@playmorrow.dev',
            username: `admin-${Date.now()}`,
            usernameLowercase: `admin-${Date.now()}`,
            displayName: 'Playmorrow Admin',
            role: 'ADMIN',
          },
        });
      } else {
        await prisma.user.update({ where: { id: admin.id }, data: { role: 'ADMIN' } });
      }
    }

    // Ensure studio membership
    const existingMember = await prisma.studioMember.findUnique({
      where: { studioId_userId: { studioId: studio.id, userId: admin.id } },
    });
    if (!existingMember) {
      await prisma.studioMember.create({
        data: { studioId: studio.id, userId: admin.id, role: 'OWNER' },
      });
      console.log(`  Added admin as owner of ${bp.studio.name}`);
    }

    // Create or update game
    let game = await prisma.game.findUnique({ where: { slug: bp.game.slug } });
    if (!game) {
      const coverIndex = GAMES.indexOf(bp);
      game = await prisma.game.create({
        data: {
          slug: bp.game.slug,
          studioId: studio.id,
          title: bp.game.title,
          tagline: bp.game.tagline,
          description: bp.game.description,
          status: bp.game.status as any,
          genres: bp.game.genres,
          isFree: bp.game.isFree,
          currency: bp.game.currency,
          expectedReleaseText: bp.game.expectedReleaseText,
          featured: bp.game.featured,
          isPublished: true,
          publishedAt: new Date('2026-01-01'),
          createdBy: admin.id,
          coverUrl: GAME_PLACEHOLDER_COVERS[coverIndex] || GAME_PLACEHOLDER_COVERS[0],
        },
      });
      console.log(`  Created game: ${bp.game.title}`);
    } else {
      console.log(`  Game exists: ${bp.game.title}`);
    }

    // Tags
    for (const tagSlug of bp.tags) {
      const tag = await prisma.tag.findUnique({ where: { slug: tagSlug } });
      if (tag) {
        await prisma.gameTag.upsert({
          where: { gameId_tagId: { gameId: game.id, tagId: tag.id } },
          create: { gameId: game.id, tagId: tag.id },
          update: {},
        });
      }
    }
    console.log(`  Tags linked for ${bp.game.title}`);

    // Platform links (idempotent)
    await prisma.platformLink.deleteMany({ where: { gameId: game.id } });
    for (const pl of bp.platforms) {
      await prisma.platformLink.create({
        data: {
          gameId: game.id,
          kind: pl.kind as any,
          url: pl.url,
          label: pl.label,
          position: bp.platforms.indexOf(pl),
        },
      });
    }
    console.log(`  Platform links for ${bp.game.title}`);

    // Screenshot media (idempotent)
    await prisma.gameMedia.deleteMany({ where: { gameId: game.id } });
    for (let i = 0; i < SCREENSHOT_PLACEHOLDERS.length; i++) {
      await prisma.gameMedia.create({
        data: {
          gameId: game.id,
          type: 'SCREENSHOT',
          url: SCREENSHOT_PLACEHOLDERS[i]!,
          caption: `Screenshot ${i + 1}`,
          position: i,
        },
      });
    }
    console.log(`  Screenshots for ${bp.game.title}`);

    // Devlogs
    for (const dl of bp.devlogs) {
      const slug = dl.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const existing = await prisma.devlog.findFirst({
        where: { gameId: game.id, slug },
      });
      const targetDevlog = existing ?? await prisma.devlog.create({
        data: {
          gameId: game.id,
          authorId: admin.id,
          title: dl.title,
          subtitle: dl.subtitle,
          slug,
          body: dl.body,
          readingTimeMin: dl.readingTimeMin,
          status: 'PUBLISHED',
          isPublished: true,
          publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          category: dl.category,
          tags: dl.tags,
        },
      });
      if (!existing) {
        console.log(`  Devlog: ${dl.title}`);
      }
      // Ensure screenshot for devlog (for polished model data)
      const ssCount = await prisma.devlogScreenshot.count({ where: { devlogId: targetDevlog.id } });
      if (ssCount === 0) {
        const ssIndex = bp.devlogs.indexOf(dl) % SCREENSHOT_PLACEHOLDERS.length;
        await prisma.devlogScreenshot.create({
          data: {
            devlogId: targetDevlog.id,
            url: SCREENSHOT_PLACEHOLDERS[ssIndex]!,
            order: 0,
            caption: dl.title,
          },
        });
        console.log(`  Ensured screenshot for devlog: ${dl.title}`);
      }
    }

    // Roadmap items (idempotent)
    await prisma.roadmapItem.deleteMany({ where: { gameId: game.id } });
    for (const r of bp.roadmap) {
      await prisma.roadmapItem.create({
        data: {
          gameId: game.id,
          title: r.title,
          description: r.description,
          status: r.status as any,
          targetDate: new Date(r.targetDate),
          position: bp.roadmap.indexOf(r),
        },
      });
    }
    console.log(`  Roadmap items for ${bp.game.title}`);

    // Update studio games count
    const gameCount = await prisma.game.count({ where: { studioId: studio.id } });
    await prisma.studio.update({
      where: { id: studio.id },
      data: { gamesCount: gameCount },
    });
    console.log(`  Studio games count: ${gameCount}\n`);
  }

  console.log('\n✅ Seeding complete!');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
