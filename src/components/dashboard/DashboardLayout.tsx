'use client';

/**
 * Manager Dashboard Layout
 *
 * Desktop-optimized control panel with sidebar navigation.
 * Contains KDS, Analytics, and Menu Management sections.
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  ChefHat,
  BarChart3,
  MessageSquare,
  Settings,
  Menu,
  X,
  Bell,
  BellRing,
  UtensilsCrossed,
} from 'lucide-react';

type TabId = 'orders' | 'notifications' | 'analytics' | 'ai-insights' | 'menu' | 'settings';

interface DashboardLayoutProps {
  children?: React.ReactNode;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  pendingOrderCount?: number;
  serviceRequestCount?: number;
}

const navItems: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'orders', label: 'Live Orders', icon: <ChefHat className="h-5 w-5" /> },
  { id: 'notifications', label: 'Notifications', icon: <BellRing className="h-5 w-5" /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-5 w-5" /> },
  { id: 'ai-insights', label: 'AI Insights', icon: <MessageSquare className="h-5 w-5" /> },
  { id: 'menu', label: 'Menu Manager', icon: <UtensilsCrossed className="h-5 w-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
];

export default function DashboardLayout({
  children,
  activeTab,
  onTabChange,
  pendingOrderCount = 0,
  serviceRequestCount = 0,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-gray-900 transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">Dashboard</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setSidebarOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.id === 'orders' && pendingOrderCount > 0 && (
                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                  {pendingOrderCount}
                </span>
              )}
              {item.id === 'notifications' && serviceRequestCount > 0 && (
                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white animate-pulse">
                  {serviceRequestCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold text-sm">
              M
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Manager</p>
              <p className="text-xs text-gray-500 truncate">Shift: Evening</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {navItems.find((item) => item.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button
              onClick={() => onTabChange('notifications')}
              className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            >
              <Bell className="h-5 w-5" />
              {(pendingOrderCount > 0 || serviceRequestCount > 0) && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>

            {/* Current time */}
            <div className="hidden sm:block text-sm text-gray-500">
              <CurrentTime />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

// Helper component for live time display
function CurrentTime() {
  const [time, setTime] = useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span>
      {time.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })}
    </span>
  );
}
