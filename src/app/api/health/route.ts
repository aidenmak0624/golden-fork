/**
 * Health Check API Route
 *
 * GET /api/health
 *
 * Returns the status of all RAG system components.
 * Useful for monitoring and debugging.
 */

import { NextResponse } from 'next/server';
import { healthCheck } from '../../../services/ragService';

export async function GET() {
  try {
    const health = await healthCheck();

    const allHealthy = health.openai && health.pinecone;

    return NextResponse.json(
      {
        status: allHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        services: {
          openai: {
            status: health.openai ? 'connected' : 'error',
          },
          pinecone: {
            status: health.pinecone ? 'connected' : 'error',
            totalVectors: health.indexStats?.totalVectors || 0,
          },
        },
      },
      { status: allHealthy ? 200 : 503 }
    );
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 500 }
    );
  }
}
