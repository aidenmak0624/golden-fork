/**
 * Component Exports
 *
 * Central export file for all components.
 */

// Chat
export { default as ChatWidget } from './chat/ChatWidget';

// Dashboard
export { default as DashboardLayout } from './dashboard/DashboardLayout';
export { default as KDSBoard } from './dashboard/KDSBoard';

// Analytics
export { default as SalesVelocityChart } from './dashboard/analytics/SalesVelocityChart';
export { default as MenuEngineeringChart } from './dashboard/analytics/MenuEngineeringChart';
export { default as AIInsightsPanel } from './dashboard/analytics/AIInsightsPanel';

// Types re-export
export type { Order, OrderItem } from './dashboard/KDSBoard';
