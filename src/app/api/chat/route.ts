/**
 * Chat API Route
 *
 * POST /api/chat
 *
 * Handles customer chat requests to the AI menu assistant.
 * This is the main endpoint the frontend calls.
 */

import { NextRequest, NextResponse } from 'next/server';
import { processChat, createAnalyticsRecord } from '../../../services/ragService';
import { ChatRequest, ChatMessage } from '../../../types/menu';
import { logChat } from '../../../lib/db/feedback';
import { checkRateLimit } from '../../../lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // --- Rate Limiting ---
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(ip);

    if (!rateLimit.allowed) {
      const minutes = Math.ceil(rateLimit.resetInSeconds / 60);
      return NextResponse.json(
        {
          error: 'rate_limited',
          message: `You've used all ${rateLimit.limit} messages for this hour. Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
          remaining: 0,
          limit: rateLimit.limit,
          resetInSeconds: rateLimit.resetInSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.resetInSeconds),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimit.resetInSeconds),
          },
        }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Sanitize and limit message length
    const sanitizedMessage = body.message.trim().slice(0, 1000);

    if (sanitizedMessage.length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    // Build chat request
    const chatRequest: ChatRequest = {
      message: sanitizedMessage,
      conversationHistory: validateConversationHistory(body.conversationHistory),
      tableId: body.tableId,
      sessionId: body.sessionId || generateSessionId(),
      dietaryFilters: body.dietaryFilters,
    };

    // Process the chat
    const response = await processChat(chatRequest);

    // Create analytics record (async, don't block response)
    const analytics = createAnalyticsRecord(
      chatRequest,
      response,
      chatRequest.sessionId!
    );

    // Store analytics (fire and forget)
    storeAnalytics(analytics).catch((err) =>
      console.error('Failed to store analytics:', err)
    );

    // Return response with rate limit info
    return NextResponse.json(
      {
        message: response.message,
        suggestedItems: response.suggestedItems?.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          category: item.category,
          description: item.description,
        })),
        processingTimeMs: response.processingTimeMs,
        remaining: rateLimit.remaining,
        limit: rateLimit.limit,
      },
      {
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Chat API error:', errorMessage);
    console.error('Full error:', error);

    return NextResponse.json(
      { 
        error: 'An error occurred while processing your request',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Validate and sanitize conversation history
 */
function validateConversationHistory(
  history: unknown
): ChatMessage[] | undefined {
  if (!Array.isArray(history)) return undefined;

  return history
    .filter(
      (msg): msg is { role: string; content: string } =>
        typeof msg === 'object' &&
        msg !== null &&
        (msg.role === 'user' || msg.role === 'assistant') &&
        typeof msg.content === 'string'
    )
    .slice(-10) // Limit to last 10 messages
    .map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content.slice(0, 1000), // Limit content length
    }));
}

/**
 * Generate a session ID for tracking conversations
 */
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Store analytics record
 * Logs chat interaction to in-memory store for AI insights
 */
async function storeAnalytics(analytics: ReturnType<typeof createAnalyticsRecord>) {
  // Log to our in-memory feedback database for AI insights
  try {
    logChat({
      sessionId: analytics.sessionId,
      tableId: analytics.tableId,
      userMessage: analytics.userMessage,
      assistantResponse: analytics.assistantResponse,
      intent: analytics.detectedIntent,
      dietaryMentions: analytics.mentionedDietaryNeeds,
      menuItemsMentioned: analytics.mentionedMenuItems,
    });
  } catch (err) {
    console.error('Failed to log chat:', err);
  }

  // For now, also console log
  console.log('Analytics:', {
    intent: analytics.detectedIntent,
    dietaryMentions: analytics.mentionedDietaryNeeds,
    responseTime: analytics.responseTimeMs,
  });
}
