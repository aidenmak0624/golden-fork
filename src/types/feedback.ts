/**
 * Feedback/Review Types
 *
 * Types for customer feedback and reviews
 */

export interface FeedbackItem {
  id: string;
  orderId: string;
  tableId: string;
  rating: number; // 1-5 stars
  foodRating?: number;
  serviceRating?: number;
  ambienceRating?: number;
  comment?: string;
  menuItemFeedback?: MenuItemFeedback[];
  wouldRecommend: boolean;
  createdAt: Date;
}

export interface MenuItemFeedback {
  menuItemId: string;
  menuItemName: string;
  rating: number; // 1-5 stars
  comment?: string;
}

export interface FeedbackStats {
  totalReviews: number;
  averageRating: number;
  averageFoodRating: number;
  averageServiceRating: number;
  averageAmbienceRating: number;
  recommendationRate: number; // percentage
  ratingDistribution: { [key: number]: number }; // 1-5 stars count
  recentTrend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface AIInsightData {
  recentChats: ChatInsight[];
  dietaryTrends: TrendItem[];
  unmatchedRequests: TrendItem[];
  popularQueries: TrendItem[];
  feedbackInsights: FeedbackInsight[];
}

export interface ChatInsight {
  id: string;
  userMessage: string;
  intent: string;
  dietaryMentions: string[];
  timestamp: Date;
  tableId?: string;
}

export interface TrendItem {
  term: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  percentChange?: number;
}

export interface FeedbackInsight {
  type: 'positive' | 'negative' | 'suggestion';
  category: string;
  message: string;
  count: number;
  menuItems?: string[];
}

// Request/Response types
export interface CreateFeedbackRequest {
  orderId: string;
  tableId: string;
  rating: number;
  foodRating?: number;
  serviceRating?: number;
  ambienceRating?: number;
  comment?: string;
  menuItemFeedback?: MenuItemFeedback[];
  wouldRecommend: boolean;
}

export interface ChatLogEntry {
  id: string;
  sessionId: string;
  tableId?: string;
  userMessage: string;
  assistantResponse: string;
  intent?: string;
  dietaryMentions: string[];
  menuItemsMentioned: string[];
  timestamp: Date;
}
