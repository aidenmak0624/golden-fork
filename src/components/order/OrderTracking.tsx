'use client';

/**
 * Order Tracking Component
 *
 * Displays order status progress for customers.
 * Shows real-time updates and estimated time.
 */

import React from 'react';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Utensils,
  Receipt,
  XCircle,
  Loader2,
} from 'lucide-react';
import { useOrderTracking, statusDisplayConfig, OrderStatus } from '../../hooks/useOrderTracking';
import { cn } from '../../lib/utils';

interface OrderTrackingProps {
  orderId: string | null;
  onClose?: () => void;
}

const statusIcons: Record<OrderStatus, React.ReactNode> = {
  pending: <Clock className="h-5 w-5" />,
  confirmed: <Receipt className="h-5 w-5" />,
  preparing: <ChefHat className="h-5 w-5" />,
  ready: <Utensils className="h-5 w-5" />,
  served: <CheckCircle2 className="h-5 w-5" />,
  paid: <CheckCircle2 className="h-5 w-5" />,
  cancelled: <XCircle className="h-5 w-5" />,
};

export default function OrderTracking({ orderId, onClose }: OrderTrackingProps) {
  const { order, status, isLoading, error, estimatedTime } = useOrderTracking(orderId);

  if (!orderId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!order || !status) {
    return (
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-center">
        <p className="text-gray-600">Order not found</p>
      </div>
    );
  }

  const currentConfig = statusDisplayConfig[status];
  const steps: OrderStatus[] = ['confirmed', 'preparing', 'ready'];
  const currentStepIndex = steps.indexOf(status as any);

  return (
    <div className="rounded-2xl bg-white shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-amber-100">Order #{order.id.slice(-8)}</p>
            <h3 className="text-lg font-bold">Table {order.tableId}</h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-white/20 transition-colors"
            >
              <XCircle className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Status Display */}
      <div className="p-5">
        {/* Current Status */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className={cn(
              'flex items-center justify-center h-12 w-12 rounded-full',
              status === 'cancelled'
                ? 'bg-red-100 text-red-600'
                : status === 'ready'
                ? 'bg-green-100 text-green-600'
                : 'bg-amber-100 text-amber-600'
            )}
          >
            {statusIcons[status]}
          </div>
          <div>
            <h4 className={cn('font-bold text-lg', currentConfig.color)}>
              {currentConfig.label}
            </h4>
            <p className="text-sm text-gray-500">{currentConfig.description}</p>
          </div>
        </div>

        {/* Progress Steps */}
        {status !== 'cancelled' && (
          <div className="mb-6">
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute left-0 right-0 top-5 h-1 bg-gray-200 -z-10" />
              <div
                className="absolute left-0 top-5 h-1 bg-green-500 -z-10 transition-all duration-500"
                style={{
                  width: `${
                    currentStepIndex >= 0
                      ? ((currentStepIndex + 1) / steps.length) * 100
                      : 0
                  }%`,
                }}
              />

              {/* Steps */}
              {steps.map((step, index) => {
                const isComplete = currentStepIndex >= index;
                const isCurrent = currentStepIndex === index;
                const stepConfig = statusDisplayConfig[step];

                return (
                  <div key={step} className="flex flex-col items-center">
                    <div
                      className={cn(
                        'flex items-center justify-center h-10 w-10 rounded-full border-2 transition-all',
                        isComplete
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'bg-white border-gray-300 text-gray-400'
                      )}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        statusIcons[step]
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-xs mt-2 font-medium',
                        isCurrent ? 'text-amber-600' : isComplete ? 'text-green-600' : 'text-gray-400'
                      )}
                    >
                      {stepConfig.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Estimated Time */}
        {estimatedTime && status !== 'cancelled' && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 text-amber-700 mb-4">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">
              Estimated time: {estimatedTime}
            </span>
          </div>
        )}

        {/* Order Items */}
        <div className="border-t border-gray-100 pt-4">
          <h5 className="text-sm font-semibold text-gray-700 mb-3">Your Order</h5>
          <ul className="space-y-2">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  <span className="font-medium text-gray-900">{item.quantity}x</span>{' '}
                  {item.name}
                </span>
                <span className="text-gray-500">${(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between mt-3 pt-3 border-t border-gray-100">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-amber-600">${order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
