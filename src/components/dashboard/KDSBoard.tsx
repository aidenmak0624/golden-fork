'use client';

/**
 * Kitchen Display System (KDS) - Kanban Board
 *
 * Real-time order management with drag-and-drop columns:
 * - New Orders (To Do)
 * - In Progress (Cooking)
 * - Ready (For Pickup)
 *
 * Features audio alerts for new orders.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  ChefHat,
  CheckCircle2,
  AlertCircle,
  GripVertical,
  User,
  Volume2,
  VolumeX,
  X,
  Loader2,
} from 'lucide-react';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  tableId: string;
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';
  createdAt: Date;
  priority?: 'normal' | 'rush';
  total?: number;
}

// KDS display statuses (subset for display)
type KDSStatus = 'pending' | 'preparing' | 'ready';

// Map full order status to KDS display status
function toKDSStatus(status: Order['status']): KDSStatus | null {
  switch (status) {
    case 'pending':
    case 'confirmed':
      return 'pending'; // Show both pending and confirmed in "New Orders"
    case 'preparing':
      return 'preparing';
    case 'ready':
      return 'ready';
    default:
      return null; // Don't show served, paid, cancelled orders in KDS
  }
}

interface KDSBoardProps {
  orders: Order[];
  onStatusChange: (orderId: string, newStatus: Order['status']) => void | Promise<void>;
  onNewOrderAlert?: () => void;
}

const statusConfig = {
  pending: {
    title: 'New Orders',
    icon: <Clock className="h-4 w-4" />,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    headerBg: 'bg-red-500',
    cardBorder: 'border-l-red-500',
  },
  preparing: {
    title: 'In Progress',
    icon: <ChefHat className="h-4 w-4" />,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    headerBg: 'bg-amber-500',
    cardBorder: 'border-l-amber-500',
  },
  ready: {
    title: 'Ready',
    icon: <CheckCircle2 className="h-4 w-4" />,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    headerBg: 'bg-green-500',
    cardBorder: 'border-l-green-500',
  },
};

export default function KDSBoard({
  orders,
  onStatusChange,
  onNewOrderAlert,
}: KDSBoardProps) {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [draggedOrder, setDraggedOrder] = useState<string | null>(null);
  const [previousOrderCount, setPreviousOrderCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Audio alert for new orders
  useEffect(() => {
    const pendingCount = orders.filter(
      (o) => o.status === 'pending' || o.status === 'confirmed'
    ).length;

    if (pendingCount > previousOrderCount && audioEnabled) {
      playAlertSound();
      onNewOrderAlert?.();
    }

    setPreviousOrderCount(pendingCount);
  }, [orders, previousOrderCount, audioEnabled, onNewOrderAlert]);

  const playAlertSound = () => {
    // Create a simple beep using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log('Audio alert not supported');
    }
  };

  const getOrdersByStatus = useCallback(
    (kdsStatus: KDSStatus) => {
      return orders
        .filter((order) => toKDSStatus(order.status) === kdsStatus)
        .sort((a, b) => {
          // Rush orders first, then by creation time
          if (a.priority === 'rush' && b.priority !== 'rush') return -1;
          if (b.priority === 'rush' && a.priority !== 'rush') return 1;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
    },
    [orders]
  );

  // Valid forward transitions for KDS drag-and-drop
  const kdsForwardTransitions: Record<KDSStatus, KDSStatus | null> = {
    pending: 'preparing',
    preparing: 'ready',
    ready: null, // terminal in KDS
  };

  // Clear error after 3 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleDragStart = (orderId: string) => {
    setDraggedOrder(orderId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetKdsStatus: KDSStatus) => {
    if (!draggedOrder) return;

    const order = orders.find((o) => o.id === draggedOrder);
    if (!order) {
      setDraggedOrder(null);
      return;
    }

    const currentKdsStatus = toKDSStatus(order.status);
    if (!currentKdsStatus) {
      setDraggedOrder(null);
      return;
    }

    // Prevent dropping into the same column
    if (currentKdsStatus === targetKdsStatus) {
      setDraggedOrder(null);
      return;
    }

    // Only allow forward transitions: pending->preparing->ready
    const statusOrder: KDSStatus[] = ['pending', 'preparing', 'ready'];
    const currentIdx = statusOrder.indexOf(currentKdsStatus);
    const targetIdx = statusOrder.indexOf(targetKdsStatus);

    if (targetIdx <= currentIdx) {
      setErrorMessage(`Cannot move order backward. Orders flow: New → In Progress → Ready`);
      setDraggedOrder(null);
      return;
    }

    // Map KDS target status to actual order status for the API
    const actualStatus: Order['status'] = targetKdsStatus;

    setIsUpdating(draggedOrder);
    try {
      await onStatusChange(draggedOrder, actualStatus);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to update order status'
      );
    } finally {
      setIsUpdating(null);
      setDraggedOrder(null);
    }
  };

  const getTimeSince = (date: Date) => {
    const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min';
    return `${minutes} mins`;
  };

  const getTimeColor = (date: Date, status: Order['status']) => {
    const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (status === 'ready') return 'text-green-600';
    if (minutes > 15) return 'text-red-600 font-semibold';
    if (minutes > 10) return 'text-amber-600';
    return 'text-gray-500';
  };

  // Wrap onStatusChange for button clicks too
  const handleStatusButton = async (orderId: string, newStatus: Order['status']) => {
    setIsUpdating(orderId);
    try {
      await onStatusChange(orderId, newStatus);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to update order status'
      );
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="h-full">
      {/* Error Toast */}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 animate-fadeIn">
          <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 shadow-lg max-w-sm">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {orders.filter((o) => toKDSStatus(o.status) !== null).length} active orders
          </span>
          <span className="text-sm text-red-500 font-medium">
            {orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length} pending
          </span>
        </div>
        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
            audioEnabled
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {audioEnabled ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
          Alerts {audioEnabled ? 'On' : 'Off'}
        </button>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 h-[calc(100%-3rem)]">
        {(['pending', 'preparing', 'ready'] as const).map((status) => {
          const config = statusConfig[status];
          const columnOrders = getOrdersByStatus(status);

          return (
            <div
              key={status}
              className={`flex flex-col rounded-xl border-2 ${config.borderColor} ${config.bgColor} overflow-hidden`}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(status)}
            >
              {/* Column Header */}
              <div
                className={`flex items-center gap-2 px-4 py-3 text-white ${config.headerBg}`}
              >
                {config.icon}
                <span className="font-semibold">{config.title}</span>
                <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-sm">
                  {columnOrders.length}
                </span>
              </div>

              {/* Orders */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {columnOrders.length === 0 ? (
                  <div className="flex h-32 items-center justify-center text-gray-400 text-sm">
                    No orders
                  </div>
                ) : (
                  columnOrders.map((order) => (
                    <div
                      key={order.id}
                      draggable
                      onDragStart={() => handleDragStart(order.id)}
                      className={`cursor-grab rounded-lg border-l-4 bg-white p-3 shadow-sm transition-all hover:shadow-md active:cursor-grabbing ${config.cardBorder} ${
                        order.priority === 'rush' ? 'ring-2 ring-red-400' : ''
                      }`}
                    >
                      {/* Order Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-gray-300" />
                          <span className="font-semibold text-gray-900">
                            Table {order.tableId}
                          </span>
                          {order.priority === 'rush' && (
                            <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-600">
                              RUSH
                            </span>
                          )}
                        </div>
                        <span
                          className={`flex items-center gap-1 text-xs ${getTimeColor(
                            order.createdAt,
                            order.status
                          )}`}
                        >
                          <Clock className="h-3 w-3" />
                          {getTimeSince(order.createdAt)}
                        </span>
                      </div>

                      {/* Order Items */}
                      <ul className="space-y-1">
                        {order.items.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-start gap-2 text-sm"
                          >
                            <span className="font-medium text-amber-700">
                              {item.quantity}x
                            </span>
                            <div className="flex-1">
                              <span className="text-gray-800">{item.name}</span>
                              {item.specialInstructions && (
                                <p className="text-xs text-red-500 mt-0.5">
                                  ⚠️ {item.specialInstructions}
                                </p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>

                      {/* Quick Actions */}
                      <div className="mt-3 flex gap-2">
                        {status === 'pending' && (
                          <button
                            onClick={() => handleStatusButton(order.id, 'preparing')}
                            disabled={isUpdating === order.id}
                            className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-amber-500 py-1.5 text-xs font-medium text-white hover:bg-amber-600 transition-colors disabled:bg-amber-300 disabled:cursor-not-allowed"
                          >
                            {isUpdating === order.id ? (
                              <><Loader2 className="h-3 w-3 animate-spin" /> Updating...</>
                            ) : (
                              'Start Cooking'
                            )}
                          </button>
                        )}
                        {status === 'preparing' && (
                          <button
                            onClick={() => handleStatusButton(order.id, 'ready')}
                            disabled={isUpdating === order.id}
                            className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-green-500 py-1.5 text-xs font-medium text-white hover:bg-green-600 transition-colors disabled:bg-green-300 disabled:cursor-not-allowed"
                          >
                            {isUpdating === order.id ? (
                              <><Loader2 className="h-3 w-3 animate-spin" /> Updating...</>
                            ) : (
                              'Mark Ready'
                            )}
                          </button>
                        )}
                        {status === 'ready' && (
                          <button
                            onClick={() => handleStatusButton(order.id, 'served')}
                            disabled={isUpdating === order.id}
                            className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-blue-500 py-1.5 text-xs font-medium text-white hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                          >
                            {isUpdating === order.id ? (
                              <><Loader2 className="h-3 w-3 animate-spin" /> Updating...</>
                            ) : (
                              '✓ Mark Served'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
