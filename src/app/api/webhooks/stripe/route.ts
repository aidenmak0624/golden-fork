/**
 * Stripe Webhook Handler
 *
 * POST /api/webhooks/stripe
 *
 * Handles Stripe webhook events:
 * - checkout.session.completed: Confirms order payment
 * - payment_intent.succeeded: Logs payment success
 * - payment_intent.payment_failed: Handles failures
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_WEBHOOK_SECRET } from '../../../../lib/stripe';
import {
  getOrderById,
  getOrderByStripeSessionId,
  confirmOrderPayment,
} from '../../../../lib/db/orders';
import { emitNewOrder } from '../../../../lib/websocket/emit';
import Stripe from 'stripe';

// Disable body parsing - we need raw body for signature verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    if (!STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', paymentIntent.id);
        await handlePaymentFailed(paymentIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout completion
 */
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  console.log('Checkout completed:', session.id);

  const { orderId, tableId } = session.metadata || {};

  if (!orderId) {
    console.error('No orderId in session metadata');
    return;
  }

  // Get the order from our database
  let order = await getOrderById(orderId);

  if (!order) {
    // Try to find by Stripe session ID
    order = await getOrderByStripeSessionId(session.id);
  }

  if (!order) {
    console.error('Order not found:', orderId);
    return;
  }

  // Confirm the payment
  const confirmedOrder = await confirmOrderPayment(
    order.id,
    session.payment_intent as string,
    session.customer_details?.email || undefined,
    session.customer_details?.phone || undefined
  );

  if (!confirmedOrder) {
    console.error('Failed to confirm order payment:', orderId);
    return;
  }

  console.log('Order payment confirmed:', confirmedOrder.id);

  // Emit WebSocket event to notify kitchen/dashboard
  try {
    // Emit as new order for kitchen display
    await emitNewOrder({
      id: confirmedOrder.id,
      tableId: confirmedOrder.tableId,
      items: confirmedOrder.items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        specialInstructions: item.notes,
      })),
      status: confirmedOrder.status,
      priority: confirmedOrder.priority,
      createdAt: confirmedOrder.createdAt,
      total: confirmedOrder.total,
    });

    console.log('Emitted new order to WebSocket server');
  } catch (e) {
    console.error('Failed to emit new order:', e);
  }

  // Log customer notification info
  if (session.customer_details?.phone) {
    console.log('Would send SMS to:', session.customer_details.phone);
  }

  if (session.customer_details?.email) {
    console.log('Would send email to:', session.customer_details.email);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed for:', paymentIntent.id);

  // Log failure reason
  const failureMessage = paymentIntent.last_payment_error?.message;
  console.log('Failure reason:', failureMessage);

  // In production, you might want to:
  // - Update order status to 'payment_failed'
  // - Send notification to customer
  // - Alert staff if needed
}
