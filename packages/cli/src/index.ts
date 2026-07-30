#!/usr/bin/env node
import { Command } from 'commander';
import { PlaymorrowClient } from '@playmorrow/sdk';

const program = new Command();
let client = new PlaymorrowClient({ apiKey: process.env.PLAYMOORROW_API_KEY });

program
  .name('playmorrow')
  .description('Playmorrow CLI — interact with the Playmorrow API')
  .version('0.1.0')
  .option('--api-key <key>', 'API key (or set PLAYMOORROW_API_KEY env var)')
  .hook('preAction', (cmd) => {
    const key = cmd.opts().apiKey || process.env.PLAYMOORROW_API_KEY;
    if (key) client = new PlaymorrowClient({ apiKey: key });
  });

program
  .command('search <query>')
  .description('Search games, studios, and devlogs')
  .option('-g, --genre <genre>', 'Filter by genre')
  .option('-s, --status <status>', 'Filter by status')
  .action(async (query, opts) => {
    const result = await client.search(query, { genre: opts.genre, status: opts.status });
    console.log(`Games: ${result.games.total}`);
    result.games.items.forEach(g => console.log(`  ${g.title} (${g.slug})`));
    console.log(`Studios: ${result.studios.total}`);
    console.log(`Devlogs: ${result.devlogs.total}`);
  });

program
  .command('games')
  .description('List games')
  .option('-p, --page <n>', 'Page number')
  .option('-s, --status <status>', 'Filter by status')
  .action(async (opts) => {
    const result = await client.getGames({ page: Number(opts.page) || 1, status: opts.status });
    console.log(`\nGames (${result.total} total):`);
    result.items.forEach(g => console.log(`  ${g.title} — ${g.studio.name} [${g.status}]`));
  });

program
  .command('trending')
  .description('Show trending games')
  .option('-l, --limit <n>', 'Number of items', '6')
  .action(async (opts) => {
    const result = await client.getTrending(Number(opts.limit));
    console.log(`\nTrending: ${result.items.length} items`);
    console.log('Game IDs:', result.items.map(i => i.gameId).join(', '));
  });

program
  .command('collections')
  .description('List available collections')
  .action(async () => {
    const collections = await client.getCollections();
    console.log('\nCollections:');
    collections.forEach(c => console.log(`  ${c.slug} — ${c.label}`));
  });

program.parse(process.argv);
