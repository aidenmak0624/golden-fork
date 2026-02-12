/**
 * Service Requests API
 *
 * POST /api/service-requests - Create a new service request (call server, feedback, etc.)
 * GET /api/service-requests - List active service requests (for dashboard)
 * PATCH /api/service-requests - Acknowledge or resolve a request
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createServiceRequest,
  acknowledgeServiceRequest,
  resolveServiceRequest,
  getActiveServiceRequests,
  getAllServiceRequests,
  submitFeedback,
  getRecentFeedback,
  getFeedbackSummary,
  ServiceRequestType,
} from '../../../lib/db/serviceRequests';

/**
 * POST /api/service-requests
 *
 * Body: { tableId, type, message? } for service requests
 *    or { tableId, rating, comment?, orderId? } for feedback
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle feedback submission
    if (body.rating !== undefined) {
      if (!body.tableId) {
        return NextResponse.json({ error: 'tableId is required' }, { status: 400 });
      }
      const feedback = submitFeedback(
        body.tableId,
        body.rating,
        body.comment,
        body.orderId
      );
      return NextResponse.json({ feedback, message: 'Feedback submitted successfully' });
    }

    // Handle service request
    if (!body.tableId || !body.type) {
      return NextResponse.json(
        { error: 'tableId and type are required' },
        { status: 400 }
      );
    }

    const validTypes: ServiceRequestType[] = [
      'call_server',
      'feedback',
      'request_bill',
      'need_help',
    ];

    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const serviceRequest = createServiceRequest(
      body.tableId,
      body.type,
      body.message
    );

    return NextResponse.json({
      serviceRequest,
      message: 'Service request created successfully',
    });
  } catch (error) {
    console.error('Error creating service request:', error);
    return NextResponse.json(
      { error: 'Failed to create service request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/service-requests
 *
 * Query: ?active=true for only active, ?feedback=true for feedback summary
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    const feedbackOnly = searchParams.get('feedback') === 'true';

    if (feedbackOnly) {
      const summary = getFeedbackSummary();
      return NextResponse.json(summary);
    }

    const requests = activeOnly ? getActiveServiceRequests() : getAllServiceRequests();
    return NextResponse.json({ requests, total: requests.length });
  } catch (error) {
    console.error('Error fetching service requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service requests' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/service-requests
 *
 * Body: { id, action: 'acknowledge' | 'resolve' }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id || !body.action) {
      return NextResponse.json(
        { error: 'id and action are required' },
        { status: 400 }
      );
    }

    let result;
    if (body.action === 'acknowledge') {
      result = acknowledgeServiceRequest(body.id);
    } else if (body.action === 'resolve') {
      result = resolveServiceRequest(body.id);
    } else {
      return NextResponse.json(
        { error: 'action must be "acknowledge" or "resolve"' },
        { status: 400 }
      );
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Service request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ serviceRequest: result });
  } catch (error) {
    console.error('Error updating service request:', error);
    return NextResponse.json(
      { error: 'Failed to update service request' },
      { status: 500 }
    );
  }
}
