'use client';

/**
 * Customer Feedback Form
 *
 * Allows customers to rate their experience after their order is served.
 * Includes overall rating, category ratings, and comments.
 */

import React, { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, Send, CheckCircle, Loader2 } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
}

interface FeedbackFormProps {
  orderId: string;
  tableId: string;
  menuItems?: MenuItem[];
  onSubmitSuccess?: () => void;
}

// StarRating component moved outside to prevent re-creation on each render
function StarRating({
  value,
  onChange,
  label,
  size = 'md',
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [hovered, setHovered] = useState(0);

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm text-gray-600 font-medium">{label}</span>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="focus:outline-none transition-transform hover:scale-110 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Star
              className={`${sizeClasses[size]} transition-colors ${
                star <= (hovered || value)
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-transparent text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FeedbackForm({
  orderId,
  tableId,
  menuItems = [],
  onSubmitSuccess,
}: FeedbackFormProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [foodRating, setFoodRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [ambienceRating, setAmbienceRating] = useState(0);
  const [comment, setComment] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [menuItemRatings, setMenuItemRatings] = useState<{ [key: string]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overallHovered, setOverallHovered] = useState(0);

  const handleSubmit = async () => {
    if (overallRating === 0) {
      setError('Please provide an overall rating');
      return;
    }

    if (wouldRecommend === null) {
      setError('Please tell us if you would recommend us');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const menuItemFeedback = Object.entries(menuItemRatings)
        .filter(([_, rating]) => rating > 0)
        .map(([menuItemId, rating]) => ({
          menuItemId,
          menuItemName: menuItems.find((m) => m.id === menuItemId)?.name || 'Unknown',
          rating,
        }));

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          tableId,
          rating: overallRating,
          foodRating: foodRating || undefined,
          serviceRating: serviceRating || undefined,
          ambienceRating: ambienceRating || undefined,
          comment: comment.trim() || undefined,
          menuItemFeedback: menuItemFeedback.length > 0 ? menuItemFeedback : undefined,
          wouldRecommend,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setIsSubmitted(true);
      onSubmitSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 text-center border border-green-200">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Thank You!</h3>
        <p className="text-gray-600">
          Your feedback helps us improve. We appreciate you taking the time to share your experience.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
        <h3 className="text-lg font-semibold text-white">How was your experience?</h3>
        <p className="text-amber-100 text-sm">Your feedback helps us serve you better</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Overall Rating */}
        <div className="text-center">
          <p className="text-gray-700 font-medium mb-3">Overall Experience</p>
          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setOverallRating(star)}
                onMouseEnter={() => setOverallHovered(star)}
                onMouseLeave={() => setOverallHovered(0)}
                className="focus:outline-none transition-transform hover:scale-110 p-2 min-w-[48px] min-h-[48px] flex items-center justify-center"
              >
                <Star
                  className={`h-10 w-10 transition-colors ${
                    star <= (overallHovered || overallRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-transparent text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {overallRating > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              {overallRating === 5
                ? 'Excellent!'
                : overallRating === 4
                ? 'Great!'
                : overallRating === 3
                ? 'Good'
                : overallRating === 2
                ? 'Fair'
                : 'Poor'}
            </p>
          )}
        </div>

        {/* Category Ratings */}
        <div className="flex flex-col sm:flex-row sm:justify-around gap-5 py-4 border-y border-gray-100">
          <StarRating
            value={foodRating}
            onChange={setFoodRating}
            label="Food"
            size="md"
          />
          <StarRating
            value={serviceRating}
            onChange={setServiceRating}
            label="Service"
            size="md"
          />
          <StarRating
            value={ambienceRating}
            onChange={setAmbienceRating}
            label="Ambience"
            size="md"
          />
        </div>

        {/* Menu Item Ratings (if items provided) */}
        {menuItems.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Rate your dishes</p>
            <div className="space-y-2">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                >
                  <span className="text-sm text-gray-700">{item.name}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setMenuItemRatings((prev) => ({ ...prev, [item.id]: star }))
                        }
                        className="focus:outline-none p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center"
                      >
                        <Star
                          className={`h-5 w-5 transition-colors ${
                            star <= (menuItemRatings[item.id] || 0)
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-transparent text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Would Recommend */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">
            Would you recommend us to a friend?
          </p>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setWouldRecommend(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-colors ${
                wouldRecommend === true
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <ThumbsUp className="h-5 w-5" />
              <span className="font-medium">Yes!</span>
            </button>
            <button
              type="button"
              onClick={() => setWouldRecommend(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-colors ${
                wouldRecommend === false
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <ThumbsDown className="h-5 w-5" />
              <span className="font-medium">Not yet</span>
            </button>
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Any additional comments? (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us more about your experience..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              Submit Feedback
            </>
          )}
        </button>
      </div>
    </div>
  );
}
