/**
 * Menu Embedding Pipeline
 *
 * This service handles:
 * 1. Processing menu data into chunks
 * 2. Creating vector embeddings via OpenAI
 * 3. Storing/updating vectors in Pinecone
 *
 * Run this whenever the menu is updated.
 */

import { OpenAI } from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { MenuItem, MenuChunk } from '../types/menu';

// Validate environment variables
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

if (!process.env.PINECONE_API_KEY) {
  throw new Error('PINECONE_API_KEY environment variable is not set');
}

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'restaurant-menu';
const EMBEDDING_MODEL = 'text-embedding-3-small'; // Cost-effective, good quality

/**
 * Converts a menu item into a rich text chunk optimized for semantic search
 */
function menuItemToChunk(item: MenuItem): MenuChunk {
  // Build dietary tags string - with explicit keywords for better search
  const dietaryKeywords: string[] = [];
  if (item.isGlutenFree) dietaryKeywords.push('GLUTEN-FREE', 'gluten-free', 'GF', 'no gluten');
  if (item.isVegetarian) dietaryKeywords.push('VEGETARIAN', 'vegetarian', 'V', 'no meat');
  if (item.isVegan) dietaryKeywords.push('VEGAN', 'vegan', 'VG', 'plant-based');
  if (item.isDairyFree) dietaryKeywords.push('DAIRY-FREE', 'dairy-free', 'DF', 'no dairy');
  if (item.isSpicy) dietaryKeywords.push('SPICY', 'spicy', 'hot', 'heat', 'kick');
  if (item.containsNuts) dietaryKeywords.push('CONTAINS NUTS', 'nuts', 'nut-containing');

  // Build searchable text with HEAVY dietary emphasis for vector matching
  // Repeat dietary keywords multiple times to boost signal strength
  const dietarySection = dietaryKeywords.length > 0 
    ? `${dietaryKeywords.join(' ')} ${dietaryKeywords.join(' ')}` 
    : 'No special dietary restrictions';

  const searchableText = `
    ${item.name}
    DIETARY: ${dietarySection}
    Category: ${item.category}
    ${item.description}
    Ingredients: ${item.ingredients.join(', ')}
    Price: $${item.price.toFixed(2)}
    ${item.allergens.length > 0 ? `Allergens: ${item.allergens.join(', ')}` : 'No common allergens'}
    ${item.pairings ? `Pairs well with: ${item.pairings.join(', ')}` : ''}
    ${item.chefNote ? `Chef's note: ${item.chefNote}` : ''}
  `.trim().replace(/\s+/g, ' ');

  return {
    id: `menu-item-${item.id}`,
    text: searchableText,
    metadata: {
      itemId: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      isGlutenFree: item.isGlutenFree === true,
      isVegetarian: item.isVegetarian === true,
      isVegan: item.isVegan === true,
      isDairyFree: item.isDairyFree === true,
      isSpicy: item.isSpicy === true,
      containsNuts: item.containsNuts === true,
      allergens: item.allergens || [],
      // Store the full item for retrieval
      fullItem: JSON.stringify(item),
    },
  };
}

/**
 * Creates embeddings for an array of text chunks
 */
async function createEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });

  return response.data.map((item) => item.embedding);
}

/**
 * Main function: Process and index all menu items
 */
export async function indexMenuItems(menuItems: MenuItem[]): Promise<{
  success: boolean;
  itemsIndexed: number;
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    // Get or create the index
    const index = pinecone.index(INDEX_NAME);

    // Convert menu items to chunks
    const chunks = menuItems.map(menuItemToChunk);
    console.log(`Processing ${chunks.length} menu items...`);

    // Process in batches of 100 (Pinecone's recommended batch size)
    const BATCH_SIZE = 100;
    let indexedCount = 0;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);

      // Create embeddings for this batch
      const texts = batch.map((chunk) => chunk.text);
      const embeddings = await createEmbeddings(texts);

      // Prepare vectors for Pinecone
      const vectors = batch.map((chunk, idx) => ({
        id: chunk.id,
        values: embeddings[idx],
        metadata: chunk.metadata,
      }));

      // Upsert to Pinecone (insert or update)
      await index.upsert(vectors);
      indexedCount += batch.length;

      console.log(`Indexed ${indexedCount}/${chunks.length} items`);
    }

    return {
      success: true,
      itemsIndexed: indexedCount,
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);
    console.error('Indexing failed:', errorMessage);

    return {
      success: false,
      itemsIndexed: 0,
      errors,
    };
  }
}

/**
 * Delete all vectors for a specific menu item (use when removing items)
 */
export async function deleteMenuItem(itemId: string): Promise<boolean> {
  try {
    const index = pinecone.index(INDEX_NAME);
    await index.deleteOne(`menu-item-${itemId}`);
    return true;
  } catch (error) {
    console.error('Failed to delete menu item:', error);
    return false;
  }
}

/**
 * Clear entire index (use with caution - for full menu rebuilds)
 */
export async function clearIndex(): Promise<boolean> {
  try {
    const index = pinecone.index(INDEX_NAME);
    await index.deleteAll();
    console.log('Index cleared successfully');
    return true;
  } catch (error) {
    console.error('Failed to clear index:', error);
    return false;
  }
}

/**
 * Get index statistics
 */
export async function getIndexStats(): Promise<{
  totalVectors: number;
  dimension: number;
} | null> {
  try {
    const index = pinecone.index(INDEX_NAME);
    const stats = await index.describeIndexStats();
    return {
      totalVectors: stats.totalRecordCount || 0,
      dimension: stats.dimension || 0,
    };
  } catch (error) {
    console.error('Failed to get index stats:', error);
    return null;
  }
}
