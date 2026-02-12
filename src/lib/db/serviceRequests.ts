/**
 * Service Requests Store (In-Memory)
 *
 * Handles "Call Server" requests and customer feedback.
 * Supports real-time notification to the dashboard.
 */

export type ServiceRequestType = 'call_server' | 'feedback' | 'request_bill' | 'need_help';

export interface ServiceRequest {
  id: string;
  tableId: string;
  type: ServiceRequestType;
  message?: string;
  status: 'pending' | 'acknowledged' | 'resolved';
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

export interface CustomerFeedback {
  id: string;
  tableId: string;
  orderId?: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
}

// In-memory stores
const serviceRequests: Map<string, ServiceRequest> = new Map();
const customerFeedback: Map<string, CustomerFeedback> = new Map();

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// ============ SERVICE REQUESTS ============

export function createServiceRequest(
  tableId: string,
  type: ServiceRequestType,
  message?: string
): ServiceRequest {
  const request: ServiceRequest = {
    id: generateId('SRV'),
    tableId,
    type,
    message,
    status: 'pending',
    createdAt: new Date(),
  };

  serviceRequests.set(request.id, request);
  console.log(`[DB] Service request created: ${request.id} (${type}) for table ${tableId}`);
  return request;
}

export function acknowledgeServiceRequest(id: string): ServiceRequest | null {
  const request = serviceRequests.get(id);
  if (!request) return null;

  request.status = 'acknowledged';
  request.acknowledgedAt = new Date();
  serviceRequests.set(id, request);
  return request;
}

export function resolveServiceRequest(id: string): ServiceRequest | null {
  const request = serviceRequests.get(id);
  if (!request) return null;

  request.status = 'resolved';
  request.resolvedAt = new Date();
  serviceRequests.set(id, request);
  return request;
}

export function getActiveServiceRequests(): ServiceRequest[] {
  return Array.from(serviceRequests.values())
    .filter((r) => r.status !== 'resolved')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getAllServiceRequests(limit: number = 50): ServiceRequest[] {
  return Array.from(serviceRequests.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

// ============ CUSTOMER FEEDBACK ============

export function submitFeedback(
  tableId: string,
  rating: number,
  comment?: string,
  orderId?: string
): CustomerFeedback {
  const feedback: CustomerFeedback = {
    id: generateId('FDBK'),
    tableId,
    orderId,
    rating: Math.max(1, Math.min(5, rating)),
    comment,
    createdAt: new Date(),
  };

  customerFeedback.set(feedback.id, feedback);
  console.log(`[DB] Feedback submitted: ${feedback.id} - ${rating} stars from table ${tableId}`);
  return feedback;
}

export function getRecentFeedback(limit: number = 20): CustomerFeedback[] {
  return Array.from(customerFeedback.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function getFeedbackSummary(): {
  totalCount: number;
  averageRating: number;
  recentFeedback: CustomerFeedback[];
} {
  const all = Array.from(customerFeedback.values());
  const total = all.length;
  const avg = total > 0 ? all.reduce((sum, f) => sum + f.rating, 0) / total : 0;

  return {
    totalCount: total,
    averageRating: Math.round(avg * 10) / 10,
    recentFeedback: all
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10),
  };
}
