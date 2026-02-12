/**
 * Order Status API Route
 *
 * PATCH /api/orders/[id]/status - Update order status
 *
 * Used by KDS to update order status (preparing, ready, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus } from '../../../../../lib/db/orders';
import { OrderStatus, canTransitionTo } from '../../../../../types/orders';
import { emitStatusUpdate } from '../../../../../lib/websocket/emit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/orders/[id]/status
 *
 * Body: { status: OrderStatus }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate status
    if (!body.status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      );
    }

    const validStatuses: OrderStatus[] = [
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'served',
      'paid',
      'cancelled',
    ];

    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if order exists
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // For KDS transitions, we allow more flexible transitions
    // (pending -> preparing, preparing -> ready, etc.)
    const kdsTransitions: Record<string, string[]> = {
      pending: ['preparing', 'confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['served', 'cancelled'],
      served: ['paid'],
    };

    const allowedTransitions = kdsTransitions[order.status] || [];
    if (!allowedTransitions.includes(body.status)) {
      return NextResponse.json(
        {
          error: `Cannot transition from ${order.status} to ${body.status}. Allowed: ${allowedTransitions.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Update the status (bypass strict validation for KDS flexibility)
    const updatedOrder = await updateOrderStatus(id, body.status, false);

    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Failed to update order status' },
        { status: 500 }
      );
    }

    // Emit WebSocket event for real-time updates
    try {
      await emitStatusUpdate(id, body.status, order.tableId);
    } catch (wsError) {
      console.warn('WebSocket emit failed:', wsError);
    }

    return NextResponse.json({
      message: `Order status updated to ${body.status}`,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
