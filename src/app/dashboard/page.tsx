'use client';

/**
 * Manager Dashboard Page
 *
 * Main dashboard page that brings together:
 * - Live Orders (KDS)
 * - Analytics (Sales Velocity, Menu Engineering)
 * - AI Insights
 * - Menu Management
 */

import React, { useState, Suspense } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import KDSBoard from '../../components/dashboard/KDSBoard';
import ServiceRequestsPanel from '../../components/dashboard/ServiceRequestsPanel';
import SalesVelocityChart from '../../components/dashboard/analytics/SalesVelocityChart';
import MenuEngineeringChart from '../../components/dashboard/analytics/MenuEngineeringChart';
import AIInsightsPanel from '../../components/dashboard/analytics/AIInsightsPanel';
import FeedbackStatsPanel from '../../components/dashboard/analytics/FeedbackStatsPanel';
import { useRealtimeOrders } from '../../hooks/useRealtimeOrders';
import { useInsights } from '../../hooks/useInsights';
import { Loader2, ChefHat, Plus, Trash2, Save, Sparkles } from 'lucide-react';

type TabId = 'orders' | 'notifications' | 'analytics' | 'ai-insights' | 'menu' | 'settings';

// Demo data for charts
const demoSalesData = [
  { hour: '11 AM', orders: 12, revenue: 480, avgOrders: 10 },
  { hour: '12 PM', orders: 28, revenue: 1120, avgOrders: 25 },
  { hour: '1 PM', orders: 35, revenue: 1400, avgOrders: 32 },
  { hour: '2 PM', orders: 22, revenue: 880, avgOrders: 20 },
  { hour: '3 PM', orders: 15, revenue: 600, avgOrders: 12 },
  { hour: '4 PM', orders: 10, revenue: 400, avgOrders: 8 },
  { hour: '5 PM', orders: 18, revenue: 720, avgOrders: 15 },
  { hour: '6 PM', orders: 42, revenue: 1680, avgOrders: 38 },
  { hour: '7 PM', orders: 55, revenue: 2200, avgOrders: 50 },
  { hour: '8 PM', orders: 48, revenue: 1920, avgOrders: 45 },
  { hour: '9 PM', orders: 32, revenue: 1280, avgOrders: 30 },
  { hour: '10 PM', orders: 18, revenue: 720, avgOrders: 20 },
];

const demoMenuData = [
  { id: '1', name: 'Pan-Seared Duck Breast', category: 'mains', popularity: 85, profitMargin: 18, revenue: 3315, price: 38.99 },
  { id: '2', name: 'Grilled Ribeye Steak', category: 'steaks', popularity: 92, profitMargin: 22, revenue: 4875, price: 52.99 },
  { id: '3', name: 'Lobster Risotto', category: 'seafood', popularity: 45, profitMargin: 25, revenue: 2025, price: 44.99 },
  { id: '4', name: 'Thai Red Curry', category: 'vegetarian', popularity: 68, profitMargin: 12, revenue: 1360, price: 19.99 },
  { id: '5', name: 'Caesar Salad', category: 'salads', popularity: 120, profitMargin: 8, revenue: 1440, price: 11.99 },
  { id: '6', name: 'Truffle Fries', category: 'sides', popularity: 95, profitMargin: 6, revenue: 950, price: 9.99 },
  { id: '7', name: 'Chocolate Lava Cake', category: 'desserts', popularity: 72, profitMargin: 9, revenue: 935, price: 12.99 },
  { id: '8', name: 'Crispy Calamari', category: 'appetizers', popularity: 88, profitMargin: 10, revenue: 1320, price: 14.99 },
  { id: '9', name: 'Herb-Crusted Salmon', category: 'seafood', popularity: 62, profitMargin: 16, revenue: 2170, price: 34.99 },
  { id: '10', name: 'Wild Mushroom Fettuccine', category: 'pasta', popularity: 38, profitMargin: 14, revenue: 1026, price: 26.99 },
  { id: '11', name: 'Burrata & Tomatoes', category: 'appetizers', popularity: 55, profitMargin: 11, revenue: 935, price: 16.99 },
  { id: '12', name: 'Spaghetti Carbonara', category: 'pasta', popularity: 78, profitMargin: 13, revenue: 1950, price: 24.99 },
];

const demoAIInsights = {
  recentChats: [
    { id: '1', userMessage: "What's gluten-free on the menu?", intent: 'dietary_inquiry', dietaryMentions: ['gluten-free'], timestamp: new Date(Date.now() - 5 * 60000), tableId: '12' },
    { id: '2', userMessage: "I'm vegan, what do you recommend?", intent: 'recommendation', dietaryMentions: ['vegan'], timestamp: new Date(Date.now() - 15 * 60000), tableId: '8' },
    { id: '3', userMessage: 'What wine pairs with the duck?', intent: 'pairing_request', dietaryMentions: [], timestamp: new Date(Date.now() - 22 * 60000), tableId: '5' },
    { id: '4', userMessage: 'Do you have any nut-free desserts?', intent: 'dietary_inquiry', dietaryMentions: ['nut-free'], timestamp: new Date(Date.now() - 35 * 60000), tableId: '15' },
    { id: '5', userMessage: "What's your most popular dish?", intent: 'recommendation', dietaryMentions: [], timestamp: new Date(Date.now() - 45 * 60000), tableId: '3' },
    { id: '6', userMessage: 'Any dairy-free pasta options?', intent: 'dietary_inquiry', dietaryMentions: ['dairy-free'], timestamp: new Date(Date.now() - 55 * 60000), tableId: '7' },
  ],
  dietaryTrends: [
    { term: 'Gluten-free', count: 52, trend: 'up' as const, percentChange: 15 },
    { term: 'Vegan', count: 38, trend: 'up' as const, percentChange: 22 },
    { term: 'Vegetarian', count: 31, trend: 'stable' as const, percentChange: 2 },
    { term: 'Dairy-free', count: 24, trend: 'up' as const, percentChange: 8 },
    { term: 'Nut-free', count: 18, trend: 'down' as const, percentChange: -5 },
  ],
  unmatchedRequests: [
    { term: 'Vegan cheese', count: 23, trend: 'up' as const },
    { term: 'Cauliflower crust pizza', count: 15, trend: 'stable' as const },
    { term: 'Oat milk latte', count: 12, trend: 'up' as const },
    { term: 'Beyond burger', count: 8, trend: 'stable' as const },
  ],
  popularQueries: [
    { term: "What's gluten-free?", count: 45, trend: 'stable' as const },
    { term: 'Best dish for sharing', count: 32, trend: 'up' as const },
    { term: 'Wine pairing recommendation', count: 28, trend: 'stable' as const },
    { term: "Chef's recommendation", count: 25, trend: 'up' as const },
    { term: 'Spicy options', count: 19, trend: 'down' as const },
  ],
};

function DashboardPageContent() {
  const [activeTab, setActiveTab] = useState<TabId>('orders');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [serviceRequestCount, setServiceRequestCount] = useState(0);

  const { orders, updateOrderStatus, isLoading } = useRealtimeOrders();
  const { insights, feedbackStats, isLoading: insightsLoading } = useInsights();

  const pendingOrderCount = orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length;

  // Chef's Choice state
  const [chefsChoiceItems, setChefsChoiceItems] = useState<
    { id: string; name: string; description: string; reason: string }[]
  >([]);
  const [chefsChoiceMessage, setChefsChoiceMessage] = useState('');
  const [chefsChoiceSaving, setChefsChoiceSaving] = useState(false);
  const [chefsChoiceSaved, setChefsChoiceSaved] = useState(false);
  const [chefsChoiceLoaded, setChefsChoiceLoaded] = useState(false);

  // Load current Chef's Choice on mount
  React.useEffect(() => {
    if (chefsChoiceLoaded) return;
    fetch('/api/admin/chefs-choice')
      .then((res) => res.json())
      .then((data) => {
        if (data.items && data.items.length > 0) {
          setChefsChoiceItems(data.items);
          setChefsChoiceMessage(data.message || '');
        }
        setChefsChoiceLoaded(true);
      })
      .catch(() => setChefsChoiceLoaded(true));
  }, [chefsChoiceLoaded]);

  const addChefsChoiceItem = () => {
    setChefsChoiceItems((prev) => [
      ...prev,
      { id: `chef-${Date.now()}`, name: '', description: '', reason: '' },
    ]);
    setChefsChoiceSaved(false);
  };

  const removeChefsChoiceItem = (id: string) => {
    setChefsChoiceItems((prev) => prev.filter((item) => item.id !== id));
    setChefsChoiceSaved(false);
  };

  const updateChefsChoiceItem = (id: string, field: string, value: string) => {
    setChefsChoiceItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
    setChefsChoiceSaved(false);
  };

  const saveChefsChoice = async () => {
    setChefsChoiceSaving(true);
    try {
      const res = await fetch('/api/admin/chefs-choice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: chefsChoiceItems.filter((item) => item.name.trim()),
          message: chefsChoiceMessage,
        }),
      });
      if (res.ok) {
        setChefsChoiceSaved(true);
        setTimeout(() => setChefsChoiceSaved(false), 3000);
      }
    } catch {
      // ignore
    } finally {
      setChefsChoiceSaving(false);
    }
  };

  // Poll for active service requests count
  React.useEffect(() => {
    const fetchServiceRequests = async () => {
      try {
        const res = await fetch('/api/service-requests?active=true');
        if (res.ok) {
          const data = await res.json();
          const pending = (data.requests || []).filter(
            (r: { status: string }) => r.status === 'pending'
          );
          setServiceRequestCount(pending.length);
        }
      } catch {
        // Silently ignore fetch errors
      }
    };

    fetchServiceRequests();
    const interval = setInterval(fetchServiceRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      pendingOrderCount={pendingOrderCount}
      serviceRequestCount={serviceRequestCount}
    >
      {/* Live Orders (KDS) */}
      {activeTab === 'orders' && (
        <div className="h-full">
          <KDSBoard orders={orders} onStatusChange={updateOrderStatus} />
        </div>
      )}

      {/* Notifications - Service Requests & Feedback */}
      {activeTab === 'notifications' && (
        <div className="h-full">
          <ServiceRequestsPanel />
        </div>
      )}

      {/* Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Customer Feedback Stats */}
          <FeedbackStatsPanel stats={feedbackStats} isLoading={insightsLoading} />

          {/* Sales Velocity */}
          <SalesVelocityChart
            data={demoSalesData}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />

          {/* Menu Engineering */}
          <MenuEngineeringChart data={demoMenuData} />
        </div>
      )}

      {/* AI Insights */}
      {activeTab === 'ai-insights' && (
        <div className="space-y-6">
          <AIInsightsPanel
            recentChats={insights?.recentChats || []}
            dietaryTrends={insights?.dietaryTrends || []}
            unmatchedRequests={insights?.unmatchedRequests || []}
            popularQueries={insights?.popularQueries || []}
          />

          {/* Feedback-based Insights */}
          {insights?.feedbackInsights && insights.feedbackInsights.length > 0 && (
            <div className="rounded-xl bg-white shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📊 Insights from Customer Feedback
              </h3>
              <div className="space-y-3">
                {insights.feedbackInsights.map((insight, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      insight.type === 'positive'
                        ? 'bg-green-50 border-green-200'
                        : insight.type === 'negative'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">
                        {insight.type === 'positive' ? '✨' : insight.type === 'negative' ? '⚠️' : '💡'}
                      </span>
                      <div>
                        <p className={`font-medium ${
                          insight.type === 'positive'
                            ? 'text-green-800'
                            : insight.type === 'negative'
                            ? 'text-red-800'
                            : 'text-amber-800'
                        }`}>
                          {insight.category}
                        </p>
                        <p className={`text-sm ${
                          insight.type === 'positive'
                            ? 'text-green-700'
                            : insight.type === 'negative'
                            ? 'text-red-700'
                            : 'text-amber-700'
                        }`}>
                          {insight.message}
                        </p>
                        {insight.menuItems && insight.menuItems.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {insight.menuItems.map((item, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-white rounded text-xs font-medium text-gray-700"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Menu Manager */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          {/* Chef's Choice Manager */}
          <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center gap-3">
              <ChefHat className="h-6 w-6 text-white" />
              <div>
                <h2 className="text-lg font-bold text-white">Chef&apos;s Choice Today</h2>
                <p className="text-amber-100 text-sm">Pick today&apos;s highlighted dishes for customers</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Chef's message */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Chef&apos;s Message <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={chefsChoiceMessage}
                  onChange={(e) => { setChefsChoiceMessage(e.target.value); setChefsChoiceSaved(false); }}
                  placeholder={"e.g. Fresh catch just arrived this morning!"}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-400/20 transition-all"
                />
              </div>

              {/* Items */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Featured Dishes
                </label>
                {chefsChoiceItems.length === 0 && (
                  <p className="text-sm text-gray-400 italic py-2">
                    No dishes selected yet. Add your picks below.
                  </p>
                )}
                {chefsChoiceItems.map((item) => (
                  <div key={item.id} className="flex gap-3 items-start p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateChefsChoiceItem(item.id, 'name', e.target.value)}
                        placeholder="Dish name"
                        className="rounded-lg border border-amber-200 px-3 py-2 text-sm font-medium focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 bg-white"
                      />
                      <input
                        type="text"
                        value={item.reason}
                        onChange={(e) => updateChefsChoiceItem(item.id, 'reason', e.target.value)}
                        placeholder="Why today? e.g. Freshest ingredients"
                        className="rounded-lg border border-amber-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 bg-white"
                      />
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateChefsChoiceItem(item.id, 'description', e.target.value)}
                        placeholder="Short description (optional)"
                        className="rounded-lg border border-amber-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 bg-white"
                      />
                    </div>
                    <button
                      onClick={() => removeChefsChoiceItem(item.id)}
                      className="flex-shrink-0 h-9 w-9 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addChefsChoiceItem}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-amber-300 text-amber-600 font-medium text-sm hover:bg-amber-50 hover:border-amber-400 transition-all w-full justify-center"
                >
                  <Plus className="h-4 w-4" />
                  Add Dish
                </button>
              </div>

              {/* Save button */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={saveChefsChoice}
                  disabled={chefsChoiceSaving || chefsChoiceItems.filter((i) => i.name.trim()).length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95 disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  {chefsChoiceSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {chefsChoiceSaving ? 'Saving...' : 'Save Chef\'s Choice'}
                </button>
                {chefsChoiceSaved && (
                  <span className="flex items-center gap-1 text-sm text-green-600 font-medium animate-fadeIn">
                    <Sparkles className="h-4 w-4" />
                    Saved! Customers can see it now.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Menu & RAG section */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Menu & RAG Knowledge Base
          </h2>
          <p className="text-gray-600 mb-6">
            Upload your menu to update the AI assistant's knowledge base.
          </p>

          {/* Upload area */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-amber-400 transition-colors cursor-pointer">
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-2">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <p className="text-gray-700 font-medium">
                Drop your menu file here or click to upload
              </p>
              <p className="text-sm text-gray-500">
                Supports PDF, TXT, or JSON (max 10MB)
              </p>
            </div>
          </div>

          {/* Current menu status */}
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-green-700">
                Menu indexed successfully
              </span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              23 items • Last updated: Today at 2:30 PM
            </p>
          </div>

          {/* Quick actions */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Re-index Menu
            </button>
            <button className="flex items-center justify-center gap-2 rounded-lg bg-amber-600 py-2.5 text-sm font-medium text-white hover:bg-amber-700 transition-colors">
              Edit System Prompt
            </button>
          </div>
        </div>
        </div>
      )}

      {/* Settings */}
      {activeTab === 'settings' && (
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Settings</h2>

          <div className="space-y-6">
            {/* Restaurant Info */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Restaurant Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Restaurant Name
                  </label>
                  <input
                    type="text"
                    defaultValue="The Golden Fork"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Number of Tables
                  </label>
                  <input
                    type="number"
                    defaultValue={20}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* AI Settings */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                AI Assistant Settings
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700">
                    Show AI assistant on customer ordering page
                  </span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700">
                    Log AI conversations for analytics
                  </span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700">
                    Allow AI to suggest wine pairings
                  </span>
                </label>
              </div>
            </div>

            {/* API Keys */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                API Configuration
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">OpenAI API</p>
                    <p className="text-xs text-gray-500">sk-...xxxx</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                    Connected
                  </span>
                </div>
              </div>
            </div>

            {/* Save */}
            <div className="pt-4 border-t border-gray-200">
              <button className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// Loading fallback component
function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-amber-500 mx-auto mb-4" />
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  );
}

// Wrap with Suspense for dynamic imports
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardPageContent />
    </Suspense>
  );
}
