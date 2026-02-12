/**
 * Feedback API Routes
 *
 * POST /api/feedback - Submit new feedback
 * GET /api/feedback - List feedback with optional filters
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createFeedback,
  listFeedback,
  getFeedbackStats,
  getFeedbackByOrderId,
} from '../../../lib/db/feedback';
import { CreateFeedbackRequest } from '../../../types/feedback';

export async function POST(request: NextRequest) {
  try {
    const body: CreateFeedbackRequest = await request.json();

    // Validate required fields
    if (!body.orderId || !body.tableId) {
      return NextResponse.json(
        { error: 'orderId and tableId are required' },
        { status: 400 }
      );
    }

    if (typeof body.rating !== 'number' || body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: 'rating must be a number between 1 and 5' },
        { status: 400 }
      );
    }

    if (typeof body.wouldRecommend !== 'boolean') {
      return NextResponse.json(
        { error: 'wouldRecommend must be a boolean' },
        { status: 400 }
      );
    }

    // Check if feedback already exists for this order
    const existingFeedback = getFeedbackByOrderId(body.orderId);
    if (existingFeedback) {
      return NextResponse.json(
        { error: 'Feedback already submitted for this order' },
        { status: 409 }
      );
    }

    // Create feedback
    const feedback = createFeedback(body);

    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) {
    console.error('Error creating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to create feedback' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const minRating = searchParams.get('minRating');
    const maxRating = searchParams.get('maxRating');
    const includeStats = searchParams.get('includeStats') === 'true';

    const feedbackList = listFeedback({
      limit: limit ? parseInt(limit) : undefined,
      minRating: minRating ? parseInt(minRating) : undefined,
      maxRating: maxRating ? parseInt(maxRating) : undefined,
    });

    const response: {
      feedback: typeof feedbackList;
      total: number;
      stats?: ReturnType<typeof getFeedbackStats>;
    } = {
      feedback: feedbackList,
      total: feedbackList.length,
    };

    if (includeStats) {
      response.stats = getFeedbackStats();
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error listing feedback:', error);
    return NextResponse.json(
      { error: 'Failed to list feedback' },
      { status: 500 }
    );
  }
}
