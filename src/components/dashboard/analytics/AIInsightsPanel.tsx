'use client';

/**
 * AI Insights Panel
 *
 * Shows what customers are asking the AI chatbot.
 * Highlights trends like:
 * - Most common dietary requests
 * - Frequently asked items not on menu
 * - Popular recommendation requests
 */

import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  TrendingUp,
  Lightbulb,
  AlertCircle,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Leaf,
  Wheat,
  Milk,
} from 'lucide-react';

interface ChatInsight {
  id: string;
  userMessage: string;
  intent: string;
  dietaryMentions: string[];
  timestamp: Date;
  tableId?: string;
}

interface TrendItem {
  term: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  percentChange?: number;
}

interface AIInsightsPanelProps {
  recentChats: ChatInsight[];
  dietaryTrends: TrendItem[];
  unmatchedRequests: TrendItem[]; // Items customers asked for that we don't have
  popularQueries: TrendItem[];
}

export default function AIInsightsPanel({
  recentChats,
  dietaryTrends,
  unmatchedRequests,
  popularQueries,
}: AIInsightsPanelProps) {
  const [activeTab, setActiveTab] = useState<'trends' | 'requests' | 'log'>('trends');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  // Filter chats by search query
  const filteredChats = useMemo(() => {
    if (!searchQuery) return recentChats;
    const query = searchQuery.toLowerCase();
    return recentChats.filter(
      (chat) =>
        chat.userMessage.toLowerCase().includes(query) ||
        chat.dietaryMentions.some((d) => d.toLowerCase().includes(query))
    );
  }, [recentChats, searchQuery]);

  // Get icon for dietary type
  const getDietaryIcon = (dietary: string) => {
    switch (dietary.toLowerCase()) {
      case 'vegan':
      case 'vegetarian':
        return <Leaf className="h-3 w-3" />;
      case 'gluten-free':
        return <Wheat className="h-3 w-3" />;
      case 'dairy-free':
        return <Milk className="h-3 w-3" />;
      default:
        return null;
    }
  };

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              AI Insights
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              What your customers are asking the chatbot
            </p>
          </div>

          {/* Tab selector */}
          <div className="flex rounded-lg bg-gray-100 p-1">
            {(['trends', 'requests', 'log'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'trends' && 'Trends'}
                {tab === 'requests' && 'Opportunities'}
                {tab === 'log' && 'Chat Log'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            {/* Dietary Trends */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Dietary Requests This Week
              </h4>
              <div className="grid gap-2">
                {dietaryTrends.map((trend) => (
                  <div
                    key={trend.term}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                        {getDietaryIcon(trend.term) || <Leaf className="h-4 w-4" />}
                      </div>
                      <span className="font-medium text-gray-900">{trend.term}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-900">{trend.count}</span>
                      {trend.percentChange !== undefined && (
                        <span
                          className={`flex items-center gap-1 text-xs font-medium ${
                            trend.trend === 'up'
                              ? 'text-green-600'
                              : trend.trend === 'down'
                              ? 'text-red-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {trend.trend === 'up' && <ChevronUp className="h-3 w-3" />}
                          {trend.trend === 'down' && <ChevronDown className="h-3 w-3" />}
                          {trend.percentChange > 0 ? '+' : ''}
                          {trend.percentChange}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Queries */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                Most Common Questions
              </h4>
              <div className="space-y-2">
                {popularQueries.map((query, index) => (
                  <div
                    key={query.term}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-sm text-gray-700">"{query.term}"</span>
                    <span className="text-sm font-medium text-gray-500">{query.count}x</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Opportunities Tab */}
        {activeTab === 'requests' && (
          <div>
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                These are items customers asked about but couldn't find on your menu.
                Consider adding popular requests!
              </p>
            </div>

            <div className="space-y-3">
              {unmatchedRequests.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No unmatched requests this period. Great menu coverage!
                </p>
              ) : (
                unmatchedRequests.map((request) => (
                  <div
                    key={request.term}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">"{request.term}"</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {request.count} customers asked for this
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          request.count >= 20
                            ? 'bg-red-100 text-red-700'
                            : request.count >= 10
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {request.count >= 20
                          ? 'High Demand'
                          : request.count >= 10
                          ? 'Moderate'
                          : 'Low'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Chat Log Tab */}
        {activeTab === 'log' && (
          <div>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chat messages..."
                className="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Chat list */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredChats.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No chat messages found
                </p>
              ) : (
                filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() =>
                      setExpandedInsight(expandedInsight === chat.id ? null : chat.id)
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">
                          "{chat.userMessage}"
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(chat.timestamp)}
                          </span>
                          {chat.tableId && (
                            <span className="text-xs text-gray-400">
                              • Table {chat.tableId}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {chat.dietaryMentions.slice(0, 2).map((dietary) => (
                          <span
                            key={dietary}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs"
                          >
                            {getDietaryIcon(dietary)}
                            {dietary}
                          </span>
                        ))}
                        {chat.dietaryMentions.length > 2 && (
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">
                            +{chat.dietaryMentions.length - 2}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expanded view */}
                    {expandedInsight === chat.id && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Intent:</span>{' '}
                            <span className="font-medium text-gray-700 capitalize">
                              {chat.intent.replace('_', ' ')}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Time:</span>{' '}
                            <span className="font-medium text-gray-700">
                              {new Date(chat.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Load more */}
            {filteredChats.length >= 20 && (
              <button className="w-full mt-4 py-2 text-sm text-amber-600 hover:text-amber-700 font-medium">
                Load more messages
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
