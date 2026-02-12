/**
 * AI Insights API Route
 *
 * GET /api/insights - Get AI-generated insights from orders, chats, and feedback
 * POST /api/insights/chat-log - Log a chat interaction for analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAIInsights, logChat, seedTestData } from '../../../lib/db/feedback';

// Seed test data on first load (for demo purposes)
let seeded = false;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seed = searchParams.get('seed') === 'true';

    // Optionally seed test data
    if (seed && !seeded) {
      seedTestData();
      seeded = true;
    }

    const insights = getAIInsights();
    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Error getting AI insights:', error);
    return NextResponse.json(
      { error: 'Failed to get AI insights' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.sessionId || !body.userMessage || !body.assistantResponse) {
      return NextResponse.json(
        { error: 'sessionId, userMessage, and assistantResponse are required' },
        { status: 400 }
      );
    }

    // Log the chat
    const chatLog = logChat({
      sessionId: body.sessionId,
      tableId: body.tableId,
      userMessage: body.userMessage,
      assistantResponse: body.assistantResponse,
      intent: body.intent,
      dietaryMentions: body.dietaryMentions || [],
      menuItemsMentioned: body.menuItemsMentioned || [],
    });

    return NextResponse.json({ chatLog }, { status: 201 });
  } catch (error) {
    console.error('Error logging chat:', error);
    return NextResponse.json(
      { error: 'Failed to log chat' },
      { status: 500 }
    );
  }
}
