/**
 * Stripe Configuration
 *
 * Initializes Stripe client for server-side operations.
 * Gracefully handles missing keys for demo/development mode.
 */

import Stripe from 'stripe';

const hasStripeKey = !!process.env.STRIPE_SECRET_KEY;

if (!hasStripeKey) {
  console.warn(
    '⚠️  STRIPE_SECRET_KEY is not set. Stripe payments will run in demo mode.'
  );
}

export const stripe: Stripe | null = hasStripeKey
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
      typescript: true,
    })
  : null;

export const isStripeEnabled = hasStripeKey;

// Public key for client-side
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Webhook secret for verifying Stripe events
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
