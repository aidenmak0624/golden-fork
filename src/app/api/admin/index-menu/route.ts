/**
 * Menu Indexing API Route (Admin Only)
 *
 * POST /api/admin/index-menu
 *
 * Allows managers to upload/update menu data and re-index it
 * for the RAG system. This should be protected by authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { indexMenuItems, clearIndex, getIndexStats } from '../../../../services/embeddingService';
import { MenuItem } from '../../../../types/menu';

// In production, add proper authentication middleware
// import { verifyAdminToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check
    // const isAdmin = await verifyAdminToken(request);
    // if (!isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();

    // Validate menu items
    if (!body.menuItems || !Array.isArray(body.menuItems)) {
      return NextResponse.json(
        { error: 'menuItems array is required' },
        { status: 400 }
      );
    }

    const menuItems: MenuItem[] = body.menuItems;

    // Basic validation of menu items
    const validationErrors: string[] = [];
    menuItems.forEach((item, index) => {
      if (!item.id) validationErrors.push(`Item ${index}: missing id`);
      if (!item.name) validationErrors.push(`Item ${index}: missing name`);
      if (typeof item.price !== 'number') validationErrors.push(`Item ${index}: price must be a number`);
      if (!item.category) validationErrors.push(`Item ${index}: missing category`);
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Option to clear existing index before re-indexing
    if (body.clearExisting === true) {
      console.log('Clearing existing index...');
      await clearIndex();
    }

    // Index the menu items
    console.log(`Indexing ${menuItems.length} menu items...`);
    const result = await indexMenuItems(menuItems);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Indexing failed', details: result.errors },
        { status: 500 }
      );
    }

    // Get updated stats
    const stats = await getIndexStats();

    return NextResponse.json({
      success: true,
      itemsIndexed: result.itemsIndexed,
      totalVectorsInIndex: stats?.totalVectors || 0,
      message: `Successfully indexed ${result.itemsIndexed} menu items`,
    });
  } catch (error) {
    console.error('Menu indexing error:', error);
    return NextResponse.json(
      { error: 'An error occurred while indexing the menu' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/index-menu
 *
 * Returns current index statistics
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check

    const stats = await getIndexStats();

    if (!stats) {
      return NextResponse.json(
        { error: 'Could not retrieve index statistics' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      totalVectors: stats.totalVectors,
      dimension: stats.dimension,
      indexName: process.env.PINECONE_INDEX_NAME || 'restaurant-menu',
    });
  } catch (error) {
    console.error('Index stats error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching index statistics' },
      { status: 500 }
    );
  }
}
