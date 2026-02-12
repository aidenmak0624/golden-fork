/**
 * Menu Seeding Script
 *
 * Run this script to index the sample menu data into Pinecone.
 *
 * Usage:
 *   npx ts-node scripts/seed-menu.ts
 *
 * Or with environment variables:
 *   OPENAI_API_KEY=sk-... PINECONE_API_KEY=... npx ts-node scripts/seed-menu.ts
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Import after dotenv is loaded
import { indexMenuItems, clearIndex, getIndexStats } from '../src/services/embeddingService';
import { MenuItem } from '../src/types/menu';

async function main() {
  console.log('='.repeat(50));
  console.log('Restaurant Menu RAG - Seeding Script');
  console.log('='.repeat(50));
  console.log();

  // Validate environment variables
  const requiredEnvVars = ['OPENAI_API_KEY', 'PINECONE_API_KEY', 'PINECONE_INDEX_NAME'];
  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:');
    missingVars.forEach((v) => console.error(`  - ${v}`));
    console.error('\nPlease set these in your .env file or environment.');
    process.exit(1);
  }

  // Load sample menu data
  const menuPath = path.join(__dirname, '../data/sample-menu.json');

  if (!fs.existsSync(menuPath)) {
    console.error(`Menu file not found: ${menuPath}`);
    process.exit(1);
  }

  const menuData = JSON.parse(fs.readFileSync(menuPath, 'utf-8'));
  const menuItems: MenuItem[] = menuData.menuItems;

  console.log(`Loaded ${menuItems.length} menu items from sample data.`);
  console.log();

  // Show what we're about to index
  console.log('Menu breakdown by category:');
  const categories = menuItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} items`);
    });
  console.log();

  // Check for command line flags
  const shouldClear = process.argv.includes('--clear');

  if (shouldClear) {
    console.log('Clearing existing index...');
    await clearIndex();
    console.log('Index cleared.\n');
  }

  // Index the menu items
  console.log('Indexing menu items...');
  console.log('(This may take a minute for embedding generation)\n');

  const startTime = Date.now();
  const result = await indexMenuItems(menuItems);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  if (result.success) {
    console.log(`✅ Successfully indexed ${result.itemsIndexed} items in ${duration}s`);
  } else {
    console.error('❌ Indexing failed:');
    result.errors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  }

  // Show final stats
  console.log();
  const stats = await getIndexStats();
  if (stats) {
    console.log('Index Statistics:');
    console.log(`  Total vectors: ${stats.totalVectors}`);
    console.log(`  Embedding dimension: ${stats.dimension}`);
  }

  console.log();
  console.log('='.repeat(50));
  console.log('Seeding complete! Your menu is ready for RAG queries.');
  console.log('='.repeat(50));
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
