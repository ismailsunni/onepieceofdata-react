/**
 * Color Palette and Theme Constants for Analytics Pages
 */

export const ANALYTICS_COLORS = {
  characters: {
    from: 'from-blue-50',
    via: 'via-cyan-50',
    to: 'to-blue-50',
    accent: 'blue-600',
    accentHex: '#2563eb',
    light: 'blue-50',
    border: 'border-blue-200',
  },
  appearances: {
    from: 'from-emerald-50',
    via: 'via-teal-50',
    to: 'to-green-50',
    accent: 'emerald-600',
    accentHex: '#059669',
    light: 'emerald-50',
    border: 'border-emerald-200',
  },
  arcs: {
    from: 'from-purple-50',
    via: 'via-indigo-50',
    to: 'to-violet-50',
    accent: 'purple-600',
    accentHex: '#9333ea',
    light: 'purple-50',
    border: 'border-purple-200',
  },
  birthdays: {
    from: 'from-pink-50',
    via: 'via-rose-50',
    to: 'to-pink-50',
    accent: 'pink-600',
    accentHex: '#db2777',
    light: 'pink-50',
    border: 'border-pink-200',
  },
  releases: {
    from: 'from-yellow-50',
    via: 'via-amber-50',
    to: 'to-orange-50',
    accent: 'yellow-600',
    accentHex: '#ca8a04',
    light: 'yellow-50',
    border: 'border-yellow-200',
  },
} as const

export const CHART_COLORS = {
  primary: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f43f5e', '#8b5cf6'],
  status: {
    alive: '#10b981',
    deceased: '#6b7280',
    unknown: '#d1d5db',
  },
  bounty: {
    high: '#dc2626',
    medium: '#ea580c',
    low: '#f59e0b',
  },
  era: {
    paradise: '#3b82f6',
    newWorld: '#8b5cf6',
  },
  gradient: {
    blue: ['#3b82f6', '#60a5fa', '#93c5fd'],
    purple: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
    green: ['#10b981', '#34d399', '#6ee7b7'],
    orange: ['#f59e0b', '#fbbf24', '#fcd34d'],
  },
} as const

export type AnalyticsTheme = keyof typeof ANALYTICS_COLORS
