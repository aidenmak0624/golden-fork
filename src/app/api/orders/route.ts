/**
 * Orders API Route
 *
 * GET /api/orders - List orders with optional filters
 * POST /api/orders - Create a new order
 */

import { NextRequest, NextResponse } from 'next/server';
import { createOrder, listOrders, getActiveOrders } from '../../../lib/db/orders';
import { CreateOrderRequest, OrderStatus } from '../../../types/orders';
import { emitNewOrder } from '../../../lib/websocket/emit';

/**
 * GET /api/orders
 *
 * Query parameters:
 * - status: Filter by status (comma-separated for multiple)
 * - tableId: Filter by table ID
 * - active: If "true", returns only active orders (for KDS)
 * - limit: Max number of results
 * - offset: Pagination offset
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const tableId = searchParams.get('tableId');
    const active = searchParams.get('active');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    // If requesting active orders (for KDS)
    if (active === 'true') {
      const orders = await getActiveOrders();
      return NextResponse.json({ orders, total: orders.length });
    }

    // Parse status filter
    let status: OrderStatus | OrderStatus[] | undefined;
    if (statusParam) {
      const statuses = statusParam.split(',') as OrderStatus[];
      status = statuses.length === 1 ? statuses[0] : statuses;
    }

    const result = await listOrders({
      status,
      tableId: tableId || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing orders:', error);
    return NextResponse.json(
      { error: 'Failed to list orders' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 *
 * Create a new order
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();

    // Validate request
    if (!body.tableId) {
      return NextResponse.json(
        { error: 'tableId is required' },
        { status: 400 }
      );
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of body.items) {
      if (!item.id || !item.name || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
        return NextResponse.json(
          { error: 'Each item must have id, name, price, and quantity' },
          { status: 400 }
        );
      }
    }

    // Create the order
    const order = await createOrder(body);

    // Emit WebSocket event for real-time updates
    try {
      await emitNewOrder({
        id: order.id,
        tableId: order.tableId,
        items: order.items.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          specialInstructions: item.notes,
        })),
        status: order.status,
        priority: order.priority,
        createdAt: order.createdAt,
      });
    } catch (wsError) {
      console.warn('WebSocket emit failed (server may not be running):', wsError);
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
