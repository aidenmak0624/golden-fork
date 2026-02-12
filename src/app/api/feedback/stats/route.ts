/**
 * Feedback Stats API Route
 *
 * GET /api/feedback/stats - Get aggregated feedback statistics
 */

import { NextResponse } from 'next/server';
import { getFeedbackStats } from '../../../../lib/db/feedback';

export async function GET() {
  try {
    const stats = getFeedbackStats();
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error getting feedback stats:', error);
    return NextResponse.json(
      { error: 'Failed to get feedback stats' },
      { status: 500 }
    );
  }
}
