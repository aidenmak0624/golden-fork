'use client';

/**
 * Sales Velocity Chart
 *
 * Shows orders per hour to help predict rush times.
 * Displays both today's data and historical average for comparison.
 */

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Clock, Calendar } from 'lucide-react';

interface HourlyData {
  hour: string; // "11 AM", "12 PM", etc.
  orders: number;
  revenue: number;
  avgOrders?: number; // Historical average for comparison
}

interface SalesVelocityChartProps {
  data: HourlyData[];
  timeRange?: 'today' | 'week' | 'month';
  onTimeRangeChange?: (range: 'today' | 'week' | 'month') => void;
}

export default function SalesVelocityChart({
  data,
  timeRange = 'today',
  onTimeRangeChange,
}: SalesVelocityChartProps) {
  const [showRevenue, setShowRevenue] = useState(false);

  // Calculate summary stats
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const peakHour = data.reduce(
    (max, d) => (d.orders > max.orders ? d : max),
    data[0] || { hour: '-', orders: 0 }
  );
  const avgOrdersPerHour = data.length > 0 ? totalOrders / data.length : 0;

  // Compare to average (if available)
  const avgTotal = data.reduce((sum, d) => sum + (d.avgOrders || 0), 0);
  const performanceVsAvg =
    avgTotal > 0 ? ((totalOrders - avgTotal) / avgTotal) * 100 : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg bg-white p-3 shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('Revenue') ? `$${entry.value.toFixed(0)}` : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-500" />
            Sales Velocity
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Orders per hour {timeRange === 'today' ? 'today' : `this ${timeRange}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex rounded-lg bg-gray-100 p-1">
            {(['today', 'week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => onTimeRangeChange?.(range)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>

          {/* Toggle revenue view */}
          <button
            onClick={() => setShowRevenue(!showRevenue)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              showRevenue
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            $
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg bg-amber-50 p-3">
          <p className="text-xs text-amber-600 font-medium">Total Orders</p>
          <p className="text-2xl font-bold text-amber-700">{totalOrders}</p>
        </div>
        <div className="rounded-lg bg-green-50 p-3">
          <p className="text-xs text-green-600 font-medium">Revenue</p>
          <p className="text-2xl font-bold text-green-700">
            ${totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-blue-600 font-medium">Peak Hour</p>
          <p className="text-2xl font-bold text-blue-700">{peakHour.hour}</p>
        </div>
        <div className="rounded-lg bg-purple-50 p-3">
          <p className="text-xs text-purple-600 font-medium">Avg/Hour</p>
          <p className="text-2xl font-bold text-purple-700">
            {avgOrdersPerHour.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Performance indicator */}
      {avgTotal > 0 && (
        <div
          className={`flex items-center gap-2 mb-4 p-2 rounded-lg ${
            performanceVsAvg >= 0 ? 'bg-green-50' : 'bg-red-50'
          }`}
        >
          {performanceVsAvg >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
          <span
            className={`text-sm font-medium ${
              performanceVsAvg >= 0 ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {performanceVsAvg >= 0 ? '+' : ''}
            {performanceVsAvg.toFixed(1)}% vs. average
          </span>
        </div>
      )}

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) => (
                <span className="text-sm text-gray-600">{value}</span>
              )}
            />

            {/* Historical average (if available) */}
            {data.some((d) => d.avgOrders !== undefined) && (
              <Area
                type="monotone"
                dataKey="avgOrders"
                name="Avg Orders"
                stroke="#6366f1"
                strokeDasharray="5 5"
                fillOpacity={1}
                fill="url(#colorAvg)"
              />
            )}

            {/* Main data */}
            <Area
              type="monotone"
              dataKey={showRevenue ? 'revenue' : 'orders'}
              name={showRevenue ? 'Revenue' : 'Orders'}
              stroke={showRevenue ? '#10b981' : '#f59e0b'}
              strokeWidth={2}
              fillOpacity={1}
              fill={showRevenue ? 'url(#colorRevenue)' : 'url(#colorOrders)'}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Current status indicator */}
      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
        <Clock className="h-4 w-4" />
        <span>
          Last updated: {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
