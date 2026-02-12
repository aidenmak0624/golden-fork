/**
 * Single Order API Route
 *
 * GET /api/orders/[id] - Get order by ID
 * PATCH /api/orders/[id] - Update order
 * DELETE /api/orders/[id] - Cancel/delete order
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  updateOrderStripeSession,
} from '../../../../lib/db/orders';
import { OrderStatus } from '../../../../types/orders';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/orders/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error getting order:', error);
    return NextResponse.json(
      { error: 'Failed to get order' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/orders/[id]
 *
 * Update order fields (status, stripeSessionId, etc.)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if order exists
    const existingOrder = await getOrderById(id);
    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    let updatedOrder = existingOrder;

    // Update status if provided
    if (body.status) {
      const result = await updateOrderStatus(id, body.status as OrderStatus);
      if (!result) {
        return NextResponse.json(
          { error: `Invalid status transition from ${existingOrder.status} to ${body.status}` },
          { status: 400 }
        );
      }
      updatedOrder = result;
    }

    // Update Stripe session if provided
    if (body.stripeSessionId) {
      const result = await updateOrderStripeSession(id, body.stripeSessionId);
      if (result) {
        updatedOrder = result;
      }
    }

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/orders/[id]
 *
 * Cancel an order
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Only allow cancellation for certain statuses
    if (['served', 'paid', 'cancelled'].includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot cancel order with status: ${order.status}` },
        { status: 400 }
      );
    }

    const cancelledOrder = await cancelOrder(id);

    return NextResponse.json({
      message: 'Order cancelled',
      order: cancelledOrder,
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}
