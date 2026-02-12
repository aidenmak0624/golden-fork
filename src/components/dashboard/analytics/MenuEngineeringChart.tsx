'use client';

/**
 * Menu Engineering Chart
 *
 * Scatter plot comparing Profitability vs. Popularity for menu items.
 * Categorizes items into four quadrants:
 * - Stars: High popularity, High profit (top right)
 * - Puzzles: Low popularity, High profit (top left)
 * - Plowhorses: High popularity, Low profit (bottom right)
 * - Dogs: Low popularity, Low profit (bottom left)
 */

import React, { useState, useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Star, HelpCircle, TrendingUp, Dog, Filter } from 'lucide-react';

interface MenuItemAnalytics {
  id: string;
  name: string;
  category: string;
  popularity: number; // Number of orders
  profitMargin: number; // Profit per item in dollars
  revenue: number;
  price: number;
}

interface MenuEngineeringChartProps {
  data: MenuItemAnalytics[];
  popularityThreshold?: number;
  profitThreshold?: number;
}

type Quadrant = 'star' | 'puzzle' | 'plowhorse' | 'dog';

const quadrantConfig: Record<
  Quadrant,
  { label: string; color: string; bgColor: string; icon: React.ReactNode; description: string }
> = {
  star: {
    label: 'Stars',
    color: '#eab308',
    bgColor: 'bg-yellow-50',
    icon: <Star className="h-4 w-4" />,
    description: 'High popularity & profit. Promote these!',
  },
  puzzle: {
    label: 'Puzzles',
    color: '#8b5cf6',
    bgColor: 'bg-purple-50',
    icon: <HelpCircle className="h-4 w-4" />,
    description: 'High profit, low sales. Market better.',
  },
  plowhorse: {
    label: 'Plowhorses',
    color: '#3b82f6',
    bgColor: 'bg-blue-50',
    icon: <TrendingUp className="h-4 w-4" />,
    description: 'Popular but low margin. Optimize costs.',
  },
  dog: {
    label: 'Dogs',
    color: '#ef4444',
    bgColor: 'bg-red-50',
    icon: <Dog className="h-4 w-4" />,
    description: 'Low on both. Consider removing.',
  },
};

export default function MenuEngineeringChart({
  data,
  popularityThreshold,
  profitThreshold,
}: MenuEngineeringChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredItem, setHoveredItem] = useState<MenuItemAnalytics | null>(null);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(data.map((item) => item.category));
    return ['all', ...Array.from(cats)];
  }, [data]);

  // Filter data by category
  const filteredData = useMemo(() => {
    if (selectedCategory === 'all') return data;
    return data.filter((item) => item.category === selectedCategory);
  }, [data, selectedCategory]);

  // Calculate thresholds if not provided (use median)
  const { popThreshold, profThreshold } = useMemo(() => {
    const sortedByPop = [...filteredData].sort((a, b) => a.popularity - b.popularity);
    const sortedByProfit = [...filteredData].sort((a, b) => a.profitMargin - b.profitMargin);

    const medianPop =
      popularityThreshold ??
      (sortedByPop.length > 0
        ? sortedByPop[Math.floor(sortedByPop.length / 2)].popularity
        : 50);
    const medianProfit =
      profitThreshold ??
      (sortedByProfit.length > 0
        ? sortedByProfit[Math.floor(sortedByProfit.length / 2)].profitMargin
        : 5);

    return { popThreshold: medianPop, profThreshold: medianProfit };
  }, [filteredData, popularityThreshold, profitThreshold]);

  // Categorize items
  const getQuadrant = (item: MenuItemAnalytics): Quadrant => {
    const isHighPop = item.popularity >= popThreshold;
    const isHighProfit = item.profitMargin >= profThreshold;

    if (isHighPop && isHighProfit) return 'star';
    if (!isHighPop && isHighProfit) return 'puzzle';
    if (isHighPop && !isHighProfit) return 'plowhorse';
    return 'dog';
  };

  // Count items in each quadrant
  const quadrantCounts = useMemo(() => {
    return filteredData.reduce(
      (acc, item) => {
        const q = getQuadrant(item);
        acc[q]++;
        return acc;
      },
      { star: 0, puzzle: 0, plowhorse: 0, dog: 0 } as Record<Quadrant, number>
    );
  }, [filteredData, popThreshold, profThreshold]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as MenuItemAnalytics;
      const quadrant = getQuadrant(item);
      const config = quadrantConfig[quadrant];

      return (
        <div className="rounded-lg bg-white p-3 shadow-lg border border-gray-200 max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1 rounded ${config.bgColor}`} style={{ color: config.color }}>
              {config.icon}
            </div>
            <span className="font-semibold text-gray-900">{item.name}</span>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600">
              Category: <span className="text-gray-900">{item.category}</span>
            </p>
            <p className="text-gray-600">
              Orders: <span className="font-medium text-gray-900">{item.popularity}</span>
            </p>
            <p className="text-gray-600">
              Profit/item: <span className="font-medium text-green-600">${item.profitMargin.toFixed(2)}</span>
            </p>
            <p className="text-gray-600">
              Price: <span className="text-gray-900">${item.price.toFixed(2)}</span>
            </p>
            <p className="text-gray-600">
              Total Revenue: <span className="font-medium text-gray-900">${item.revenue.toLocaleString()}</span>
            </p>
          </div>
          <div className={`mt-2 p-2 rounded text-xs ${config.bgColor}`} style={{ color: config.color }}>
            <span className="font-medium">{config.label}:</span> {config.description}
          </div>
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
            <Star className="h-5 w-5 text-yellow-500" />
            Menu Engineering Matrix
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Profitability vs. Popularity analysis
          </p>
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quadrant Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {(Object.keys(quadrantConfig) as Quadrant[]).map((q) => {
          const config = quadrantConfig[q];
          return (
            <div
              key={q}
              className={`rounded-lg p-3 ${config.bgColor} border`}
              style={{ borderColor: config.color + '40' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span style={{ color: config.color }}>{config.icon}</span>
                <span className="text-sm font-medium text-gray-700">{config.label}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: config.color }}>
                {quadrantCounts[q]}
              </p>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              dataKey="popularity"
              name="Popularity"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              label={{
                value: 'Popularity (Orders)',
                position: 'bottom',
                offset: 0,
                fill: '#6b7280',
                fontSize: 12,
              }}
            />
            <YAxis
              type="number"
              dataKey="profitMargin"
              name="Profit"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              label={{
                value: 'Profit ($)',
                angle: -90,
                position: 'insideLeft',
                fill: '#6b7280',
                fontSize: 12,
              }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Threshold lines */}
            <ReferenceLine
              x={popThreshold}
              stroke="#9ca3af"
              strokeDasharray="5 5"
              label={{
                value: 'Popularity Threshold',
                position: 'top',
                fill: '#9ca3af',
                fontSize: 10,
              }}
            />
            <ReferenceLine
              y={profThreshold}
              stroke="#9ca3af"
              strokeDasharray="5 5"
              label={{
                value: 'Profit Threshold',
                position: 'right',
                fill: '#9ca3af',
                fontSize: 10,
              }}
            />

            {/* Data points */}
            <Scatter name="Menu Items" data={filteredData}>
              {filteredData.map((item, index) => (
                <Cell
                  key={item.id}
                  fill={quadrantConfig[getQuadrant(item)].color}
                  strokeWidth={hoveredItem?.id === item.id ? 2 : 0}
                  stroke="#000"
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {(Object.keys(quadrantConfig) as Quadrant[]).map((q) => {
          const config = quadrantConfig[q];
          return (
            <div key={q} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              <span className="text-gray-600">{config.description.split('.')[0]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
