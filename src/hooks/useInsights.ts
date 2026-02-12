'use client';

/**
 * useInsights Hook
 *
 * Fetches AI insights and feedback data for the dashboard.
 * Polls periodically for real-time updates.
 */

import { useState, useEffect, useCallback } from 'react';
import { AIInsightData, FeedbackStats } from '../types/feedback';

interface UseInsightsReturn {
  insights: AIInsightData | null;
  feedbackStats: FeedbackStats | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useInsights(pollInterval: number = 30000): UseInsightsReturn {
  const [insights, setInsights] = useState<AIInsightData | null>(null);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (seedData = false) => {
    try {
      // Fetch insights and feedback stats in parallel
      const [insightsRes, feedbackRes] = await Promise.all([
        fetch(`/api/insights${seedData ? '?seed=true' : ''}`),
        fetch('/api/feedback/stats'),
      ]);

      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        setInsights(insightsData.insights);
      }

      if (feedbackRes.ok) {
        const feedbackData = await feedbackRes.json();
        setFeedbackStats(feedbackData.stats);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError('Failed to fetch insights');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch with seed data for demo
  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Polling
  useEffect(() => {
    if (pollInterval <= 0) return;

    const interval = setInterval(() => {
      fetchData(false);
    }, pollInterval);

    return () => clearInterval(interval);
  }, [pollInterval, fetchData]);

  return {
    insights,
    feedbackStats,
    isLoading,
    error,
    refresh: () => fetchData(false),
  };
}

// Helper hook for just feedback stats
export function useFeedbackStats(pollInterval: number = 30000) {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/feedback/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching feedback stats:', err);
      setError('Failed to fetch stats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (pollInterval <= 0) return;

    const interval = setInterval(fetchStats, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval, fetchStats]);

  return { stats, isLoading, error, refresh: fetchStats };
}
