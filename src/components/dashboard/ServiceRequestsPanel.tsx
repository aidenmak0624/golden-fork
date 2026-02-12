'use client';

/**
 * Service Requests Panel
 *
 * Shows real-time "Call Server" alerts and customer feedback
 * on the owner dashboard. Polls the API for updates.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Clock,
  Star,
  MessageCircle,
  RefreshCw,
  User,
  AlertTriangle,
  HelpCircle,
  Receipt,
  Loader2,
} from 'lucide-react';

interface ServiceRequest {
  id: string;
  tableId: string;
  type: 'call_server' | 'feedback' | 'request_bill' | 'need_help';
  message?: string;
  status: 'pending' | 'acknowledged' | 'resolved';
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

interface CustomerFeedback {
  id: string;
  tableId: string;
  orderId?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

interface FeedbackSummary {
  totalCount: number;
  averageRating: number;
  recentFeedback: CustomerFeedback[];
}

const typeConfig: Record<
  ServiceRequest['type'],
  { label: string; icon: React.ReactNode; color: string; bgColor: string; borderColor: string }
> = {
  call_server: {
    label: 'Calling Server',
    icon: <BellRing className="h-5 w-5" />,
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  need_help: {
    label: 'Needs Help',
    icon: <HelpCircle className="h-5 w-5" />,
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  request_bill: {
    label: 'Bill Requested',
    icon: <Receipt className="h-5 w-5" />,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  feedback: {
    label: 'Feedback',
    icon: <Star className="h-5 w-5" />,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

export default function ServiceRequestsPanel() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [feedbackSummary, setFeedbackSummary] = useState<FeedbackSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const activeParam = showResolved ? '' : '?active=true';
      const [reqRes, fbRes] = await Promise.all([
        fetch(`/api/service-requests${activeParam}`),
        fetch('/api/service-requests?feedback=true'),
      ]);

      if (reqRes.ok) {
        const data = await reqRes.json();
        setRequests(data.requests || []);
      }
      if (fbRes.ok) {
        const data = await fbRes.json();
        setFeedbackSummary(data);
      }
    } catch (err) {
      console.error('Failed to fetch service requests:', err);
    } finally {
      setIsLoading(false);
    }
  }, [showResolved]);

  // Poll every 5 seconds
  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const handleAction = async (id: string, action: 'acknowledge' | 'resolve') => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/service-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        await fetchRequests();
      }
    } catch (err) {
      console.error('Failed to update service request:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const acknowledgedCount = requests.filter((r) => r.status === 'acknowledged').length;

  if (isLoading) {
    return (
      <div className="rounded-xl bg-white shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center gap-3 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading notifications...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending Alerts */}
        <div className={`rounded-xl p-4 border ${pendingCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${pendingCount > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <BellRing className={`h-5 w-5 ${pendingCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${pendingCount > 0 ? 'text-red-700' : 'text-gray-900'}`}>{pendingCount}</p>
              <p className="text-xs text-gray-500">Pending Alerts</p>
            </div>
          </div>
        </div>

        {/* In Progress */}
        <div className="rounded-xl bg-white p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{acknowledgedCount}</p>
              <p className="text-xs text-gray-500">In Progress</p>
            </div>
          </div>
        </div>

        {/* Customer Feedback */}
        <div className="rounded-xl bg-white p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Star className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-gray-900">
                  {feedbackSummary?.averageRating || '—'}
                </p>
                {feedbackSummary && feedbackSummary.averageRating > 0 && (
                  <StarDisplay rating={Math.round(feedbackSummary.averageRating)} />
                )}
              </div>
              <p className="text-xs text-gray-500">
                Avg Rating ({feedbackSummary?.totalCount || 0} reviews)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Service Requests */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-700" />
            <h3 className="font-semibold text-gray-900">Service Requests</h3>
            {pendingCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                {pendingCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              Show resolved
            </label>
            <button
              onClick={fetchRequests}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {requests.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No active service requests</p>
              <p className="text-xs text-gray-400 mt-1">Requests from customers will appear here</p>
            </div>
          ) : (
            requests.map((request) => {
              const config = typeConfig[request.type];
              const isPending = request.status === 'pending';
              const isAcknowledged = request.status === 'acknowledged';
              const isResolved = request.status === 'resolved';
              const isUpdating = updatingId === request.id;

              return (
                <div
                  key={request.id}
                  className={`p-4 transition-colors ${
                    isPending ? 'bg-red-50/50' : isResolved ? 'bg-gray-50 opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`flex-shrink-0 h-10 w-10 rounded-lg ${config.bgColor} flex items-center justify-center ${config.color}`}>
                      {config.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm ${config.color}`}>
                          {config.label}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          isPending
                            ? 'bg-red-100 text-red-700'
                            : isAcknowledged
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {isPending ? 'Pending' : isAcknowledged ? 'In Progress' : 'Resolved'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                          <User className="h-3 w-3" />
                          Table {request.tableId}
                        </span>
                        <span className="text-xs text-gray-400">
                          {timeAgo(request.createdAt)}
                        </span>
                      </div>
                      {request.message && (
                        <p className="text-sm text-gray-600 mt-1.5 italic">
                          "{request.message}"
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    {!isResolved && (
                      <div className="flex-shrink-0 flex items-center gap-2">
                        {isPending && (
                          <button
                            onClick={() => handleAction(request.id, 'acknowledge')}
                            disabled={isUpdating}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-xs font-medium hover:bg-amber-200 transition-colors disabled:opacity-50"
                          >
                            {isUpdating ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            Acknowledge
                          </button>
                        )}
                        <button
                          onClick={() => handleAction(request.id, 'resolve')}
                          disabled={isUpdating}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200 transition-colors disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCheck className="h-3.5 w-3.5" />
                          )}
                          Resolve
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recent Customer Feedback */}
      {feedbackSummary && feedbackSummary.recentFeedback.length > 0 && (
        <div className="rounded-xl bg-white shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 p-4 border-b border-gray-100">
            <MessageCircle className="h-5 w-5 text-gray-700" />
            <h3 className="font-semibold text-gray-900">Recent Customer Feedback</h3>
            <span className="ml-auto text-xs text-gray-400">
              {feedbackSummary.totalCount} total reviews
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {feedbackSummary.recentFeedback.map((fb) => (
              <div key={fb.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                    <User className="h-4 w-4 text-amber-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        Table {fb.tableId}
                      </span>
                      <StarDisplay rating={fb.rating} />
                      <span className="text-xs text-gray-400">
                        {timeAgo(fb.createdAt)}
                      </span>
                    </div>
                    {fb.comment && (
                      <p className="text-sm text-gray-600 mt-1">
                        "{fb.comment}"
                      </p>
                    )}
                    {fb.orderId && (
                      <p className="text-xs text-gray-400 mt-1">
                        Order: {fb.orderId}
                      </p>
                    )}
                  </div>
                  <div className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-bold ${
                    fb.rating >= 4
                      ? 'bg-green-100 text-green-700'
                      : fb.rating >= 3
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {fb.rating}/5
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
