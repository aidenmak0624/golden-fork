'use client';

/**
 * Feedback Stats Panel
 *
 * Displays aggregated customer feedback statistics.
 * Shows ratings, trends, and recommendations rate.
 */

import React from 'react';
import {
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  ThumbsUp,
  MessageSquare,
  Utensils,
  Users,
  Sparkles,
} from 'lucide-react';
import { FeedbackStats } from '../../../types/feedback';

interface FeedbackStatsPanelProps {
  stats: FeedbackStats | null;
  isLoading?: boolean;
}

export default function FeedbackStatsPanel({ stats, isLoading }: FeedbackStatsPanelProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl bg-white shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-xl bg-white shadow-sm border border-gray-200 p-6">
        <p className="text-gray-500 text-center py-8">No feedback data available yet</p>
      </div>
    );
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= Math.round(rating)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  const ratingBarWidth = (count: number) => {
    const maxCount = Math.max(...Object.values(stats.ratingDistribution));
    return maxCount > 0 ? (count / maxCount) * 100 : 0;
  };

  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              Customer Feedback
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon(stats.recentTrend)}
            <span
              className={`text-sm font-medium ${
                stats.recentTrend === 'up'
                  ? 'text-green-600'
                  : stats.recentTrend === 'down'
                  ? 'text-red-600'
                  : 'text-gray-500'
              }`}
            >
              {stats.trendPercentage > 0 ? '+' : ''}
              {stats.trendPercentage}% vs last week
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Overall Rating */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium text-amber-700">Overall</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.averageRating.toFixed(1)}
            </div>
            {renderStars(stats.averageRating)}
          </div>

          {/* Food Rating */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <Utensils className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-green-700">Food</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.averageFoodRating > 0 ? stats.averageFoodRating.toFixed(1) : '-'}
            </div>
            {stats.averageFoodRating > 0 && renderStars(stats.averageFoodRating)}
          </div>

          {/* Service Rating */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-blue-700">Service</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.averageServiceRating > 0 ? stats.averageServiceRating.toFixed(1) : '-'}
            </div>
            {stats.averageServiceRating > 0 && renderStars(stats.averageServiceRating)}
          </div>

          {/* Would Recommend */}
          <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-xl p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <ThumbsUp className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium text-purple-700">Recommend</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.recommendationRate}%
            </div>
            <span className="text-xs text-purple-600">would recommend</span>
          </div>
        </div>

        {/* Rating Distribution */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Rating Distribution
          </h4>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm font-medium text-gray-700">{rating}</span>
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                </div>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      rating >= 4
                        ? 'bg-green-500'
                        : rating === 3
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${ratingBarWidth(stats.ratingDistribution[rating])}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 w-12 text-right">
                  {stats.ratingDistribution[rating]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
