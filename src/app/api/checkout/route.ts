/**
 * Checkout API Route
 *
 * POST /api/checkout
 *
 * Creates a Stripe Checkout Session for the customer's order.
 * If orderId is provided, links to existing order; otherwise creates new order.
 * Returns the session URL for redirecting to Stripe's hosted checkout.
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe, isStripeEnabled } from '../../../lib/stripe';
import { createOrder, updateOrderStripeSession, getOrderById } from '../../../lib/db/orders';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
  notes?: string;
}

interface CheckoutRequest {
  items: CartItem[];
  tableId: string;
  orderId?: string; // Optional: existing order ID
  customerEmail?: string;
  specialInstructions?: string;
  chatSessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();

    // Validate request
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    if (!body.tableId) {
      return NextResponse.json(
        { error: 'Table ID is required' },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = body.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const taxRate = 0.0875; // 8.75% tax
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // Get or create order
    let orderId = body.orderId;

    if (!orderId) {
      // Create order in database
      const order = await createOrder({
        tableId: body.tableId,
        items: body.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: item.notes,
        })),
        specialInstructions: body.specialInstructions,
        chatSessionId: body.chatSessionId,
      });
      orderId = order.id;
      console.log('Order created:', orderId);
    } else {
      // Verify order exists
      const existingOrder = await getOrderById(orderId);
      if (!existingOrder) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
    }

    // Create line items for Stripe
    const lineItems = body.items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: item.description || undefined,
          metadata: {
            menuItemId: item.id,
          },
        },
        unit_amount: Math.round(item.price * 100), // Stripe uses cents
      },
      quantity: item.quantity,
    }));

    // Add tax as a line item
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Tax',
          description: 'Sales tax (8.75%)',
          metadata: {
            menuItemId: 'tax',
          },
        },
        unit_amount: Math.round(tax * 100),
      },
      quantity: 1,
    });

    // Get the base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // Demo mode: skip Stripe if not configured
    if (!isStripeEnabled || !stripe) {
      console.log('Stripe not configured — running in demo mode, skipping payment.');
      return NextResponse.json({
        sessionId: `demo_${orderId}`,
        orderId,
        url: `${baseUrl}/order/confirmation?session_id=demo_${orderId}&table=${body.tableId}&order=${orderId}`,
        total: total.toFixed(2),
        demo: true,
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/order/confirmation?session_id={CHECKOUT_SESSION_ID}&table=${body.tableId}&order=${orderId}`,
      cancel_url: `${baseUrl}/order?table=${body.tableId}&canceled=true`,
      customer_email: body.customerEmail || undefined,
      metadata: {
        orderId, // Link to our order
        tableId: body.tableId,
        specialInstructions: body.specialInstructions || '',
        itemCount: String(body.items.length),
        orderItems: JSON.stringify(
          body.items.map((i) => ({ id: i.id, name: i.name, qty: i.quantity }))
        ),
      },
      // Collect phone number for order updates
      phone_number_collection: {
        enabled: true,
      },
      // Allow promo codes
      allow_promotion_codes: true,
      // Set expiration (30 minutes)
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    // Update order with Stripe session ID
    await updateOrderStripeSession(orderId, session.id);
    console.log('Order linked to Stripe session:', orderId, session.id);

    return NextResponse.json({
      sessionId: session.id,
      orderId,
      url: session.url,
      total: total.toFixed(2),
    });
  } catch (error) {
    console.error('Checkout error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
