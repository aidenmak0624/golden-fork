'use client';

/**
 * Order Confirmation Page
 *
 * Displays after successful Stripe checkout.
 * Shows order status with real-time updates.
 */

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  ChefHat,
  Bell,
  Loader2,
  ArrowLeft,
  Receipt,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import { useOrderTracking, statusDisplayConfig, OrderStatus } from '../../../hooks/useOrderTracking';
import FeedbackForm from '../../../components/feedback/FeedbackForm';

const statusSteps: { status: OrderStatus; label: string; icon: any; description: string }[] = [
  {
    status: 'confirmed',
    label: 'Order Confirmed',
    icon: Receipt,
    description: 'Payment received, sent to kitchen',
  },
  {
    status: 'preparing',
    label: 'Preparing',
    icon: ChefHat,
    description: 'Your food is being prepared',
  },
  {
    status: 'ready',
    label: 'Ready',
    icon: Bell,
    description: 'Your order is ready for pickup',
  },
];

function ConfirmationPageContent() {
  const searchParams = useSearchParams();
  const tableId = searchParams.get('table');
  const orderId = searchParams.get('order');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Always fetch order from API — checkout creates it in-memory before redirecting here
  const { order, status, isLoading, error, estimatedTime } = useOrderTracking(orderId);

  const getCurrentStepIndex = () => {
    if (!status) return -1;
    // Map pending/confirmed to step 0, preparing to step 1, ready+ to step 2
    if (status === 'pending' || status === 'confirmed') return 0;
    if (status === 'preparing') return 1;
    if (status === 'ready' || status === 'served' || status === 'paid') return 2;
    return -1;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href={`/order${tableId ? `?table=${tableId}` : ''}`}
            className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to menu
          </Link>
        </div>
      </div>
    );
  }

  // Fallback display if no order but no error either
  const displayOrder = order || {
    id: orderId || `ORD-${Date.now().toString(36).toUpperCase()}`,
    tableId: tableId || '?',
    items: [],
    total: 0,
    status: 'confirmed' as OrderStatus,
  };

  const displayStatus = status || 'confirmed';
  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">The Golden Fork</h1>
            <p className="text-sm text-gray-500">Table {displayOrder.tableId}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-6">
        {/* Success Banner */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-green-800 mb-1">
            Order Confirmed!
          </h2>
          <p className="text-sm text-green-600">
            Thank you for your order. We'll have it ready soon.
          </p>
        </div>

        {/* Order ID */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Order Number</p>
              <p className="text-lg font-bold text-gray-900 font-mono">
                {displayOrder.id}
              </p>
            </div>
            <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
              <Receipt className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Order Status</h3>
            {estimatedTime && displayStatus !== 'ready' && displayStatus !== 'served' && (
              <div className="flex items-center gap-1 text-amber-600 text-sm">
                <Clock className="h-4 w-4" />
                <span>{estimatedTime}</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {statusSteps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isPending = index > currentStepIndex;

              return (
                <div key={step.status} className="flex gap-3">
                  {/* Icon */}
                  <div className="relative">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                          ? 'bg-amber-500 text-white animate-pulse'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      <step.icon className="h-5 w-5" />
                    </div>
                    {/* Connector line */}
                    {index < statusSteps.length - 1 && (
                      <div
                        className={`absolute top-10 left-1/2 w-0.5 h-6 -translate-x-1/2 ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <p
                      className={`font-medium ${
                        isCurrent ? 'text-amber-600' : isCompleted ? 'text-green-600' : 'text-gray-900'
                      }`}
                    >
                      {step.label}
                      {isCurrent && (
                        <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary */}
        {order && order.items.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-gray-500">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 mt-3 pt-3">
              <div className="flex justify-between font-semibold">
                <span>Total Paid</span>
                <span className="text-amber-600">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Ready Notification */}
        {(displayStatus === 'ready' || displayStatus === 'served') && (
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 text-center animate-pulse">
            <Bell className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-green-800">
              {displayStatus === 'ready' ? 'Your order is ready!' : 'Enjoy your meal!'}
            </h3>
            <p className="text-sm text-green-600">
              {displayStatus === 'ready'
                ? 'Please pick up at the counter or wait for your server.'
                : 'Thank you for dining with us.'}
            </p>
          </div>
        )}

        {/* Feedback Section */}
        {(displayStatus === 'served' || displayStatus === 'ready' || displayStatus === 'paid') && !feedbackSubmitted && (
          <div className="space-y-4">
            {!showFeedback ? (
              <button
                onClick={() => setShowFeedback(true)}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 text-amber-700 font-medium hover:bg-amber-100 hover:border-amber-400 transition-colors"
              >
                <MessageSquare className="h-5 w-5" />
                Rate Your Experience
              </button>
            ) : (
              <FeedbackForm
                orderId={displayOrder.id}
                tableId={displayOrder.tableId}
                menuItems={order?.items.map((item) => ({
                  id: item.menuItemId || item.id || String(Math.random()),
                  name: item.name,
                })) || []}
                onSubmitSuccess={() => setFeedbackSubmitted(true)}
              />
            )}
          </div>
        )}

        {/* Feedback Thank You */}
        {feedbackSubmitted && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 text-center border border-amber-200">
            <p className="text-amber-800 font-medium">
              🎉 Thanks for your feedback! It helps us improve.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href={`/order${tableId ? `?table=${tableId}` : ''}`}
            className="flex-1 py-3 rounded-lg border border-gray-300 text-center text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Order More
          </Link>
          <button className="flex-1 py-3 rounded-lg bg-amber-600 text-center text-white font-medium hover:bg-amber-700 transition-colors">
            Call Server
          </button>
        </div>

        {/* Help text */}
        <p className="text-center text-sm text-gray-500">
          Questions about your order? Ask your server or use the chat assistant.
        </p>
      </main>
    </div>
  );
}

// Loading fallback component
function ConfirmationLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading order details...</p>
      </div>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function ConfirmationPage() {
  return (
    <Suspense fallback={<ConfirmationLoading />}>
      <ConfirmationPageContent />
    </Suspense>
  );
}
