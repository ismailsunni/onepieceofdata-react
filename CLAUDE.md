# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

One Piece of Data is a React-based data exploration application for visualizing and analyzing One Piece universe data. This is a migration from an existing Streamlit application to a modern React stack, hosted on GitHub Pages with Supabase as the backend.

## Tech Stack

- **Frontend:** React 18+ with TypeScript, built with Vite
- **Routing:** React Router v6 with HashRouter (for GitHub Pages compatibility)
- **State Management:** React Context API + Custom Hooks
- **UI Framework:** TailwindCSS + Headless UI
- **Tables:** TanStack Table (React Table v8)
- **Charts:** Recharts (primary) + Chart.js wrapper
- **Data Fetching:** React Query (TanStack Query)
- **Backend:** Supabase (PostgreSQL database, REST API)
- **Hosting:** GitHub Pages
- **Testing:** Vitest + React Testing Library

## Architecture

### Folder Structure

The project follows a feature-based architecture:

```
src/
├── app/                    # App root and router setup
├── features/               # Feature-based modules
│   ├── characters/         # Character listing, detail pages
│   ├── arcs/              # Story arc features
│   ├── devilfruits/       # Devil fruit features
│   └── analytics/         # Data visualization
├── shared/                # Shared components, hooks, utilities
│   ├── components/        # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Helper functions
│   └── types/             # TypeScript type definitions
├── services/              # API clients and services
└── context/               # React Context providers
```

Each feature module contains:
- `components/` - Feature-specific UI components
- `hooks/` - Feature-specific custom hooks
- `services/` - API calls for that feature
- `pages/` - Route-level page components

### Data Model

The application works with three main entities:

1. **Characters**: Name, epithet, status, affiliation, devil fruit, bounty, debut arc
2. **Arcs**: Name, description, chapter/episode ranges, saga, chronological order
3. **Devil Fruits**: Names (Japanese/English), type (Paramecia/Zoan/Logia), abilities, users

These are stored in Supabase with relationships managed via junction tables (e.g., Character_Arcs).

## Development Commands

### Initial Setup
```bash
# Install dependencies
npm install

# Set up environment variables
# Create .env.local with:
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Development
```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

### Build & Deploy
```bash
# Create production build
npm run build

# Preview production build locally
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

## Important Technical Considerations

### Routing with GitHub Pages

- **MUST use HashRouter** instead of BrowserRouter due to GitHub Pages limitations
- Direct URL access and page refreshes work with HashRouter without 404 errors
- URLs will have `/#/` format (e.g., `domain.com/#/characters`)

### Performance Optimization

- **Code Splitting**: Implement route-based code splitting with React.lazy() and Suspense
- **Lazy Loading**: Use lazy loading for images and components
- **Caching**: React Query caches API responses with 5-minute stale time
- **Virtualization**: Use table virtualization for lists exceeding 100 rows
- **Target Metrics**:
  - Initial load < 2 seconds
  - Time to Interactive < 3 seconds
  - Lighthouse Performance score > 90
  - Bundle size < 300KB (initial load)

### Data Fetching Pattern

Use React Query for all API calls:

```typescript
// Example pattern
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

export const useCharacters = (filters) => {
  return useQuery({
    queryKey: ['characters', filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

### Security

- **Never commit** Supabase API keys - use environment variables only
- Store sensitive config in `.env.local` (already in .gitignore)
- Implement input sanitization to prevent XSS attacks
- Use Row-Level Security (RLS) in Supabase if authentication is added
- All API requests must use HTTPS

### Accessibility Requirements

- Maintain WCAG 2.1 Level AA compliance
- All interactive elements must support keyboard navigation
- Include ARIA labels on buttons and interactive components
- Ensure color contrast ratio ≥ 4.5:1 for normal text
- Provide alternative text for all images
- Add visible focus indicators on all focusable elements

## Design System & UI/UX

### Design Principles

- **Clean & Minimal**: Focus on content with minimal distractions
- **Data-First**: Prioritize readability and clarity of information
- **Responsive**: Mobile-first approach, optimized for all screen sizes
- **Consistent**: Unified visual language across all features
- **Accessible**: WCAG 2.1 Level AA compliance

### Color Palette

The application uses a carefully selected color system built on Tailwind's color palette:

#### Brand Colors
- **Primary Blue**: `blue-600` to `blue-700` - Main brand color, CTAs, links
  - Gradient: `from-blue-600 to-blue-700`
  - Used in: Logo, primary buttons, active states

#### Semantic Colors (StatCard Themes)
- **Blue** (`blue-50/100/200/600/900`): General information, default state
- **Green** (`green-50/100/200/600/900`): Success, positive trends, growth
- **Purple** (`purple-50/100/200/600/900`): Premium features, special content
- **Amber** (`amber-50/100/200/600/900`): Warnings, attention needed
- **Pink** (`pink-50/100/200/600/900`): Highlights, featured content
- **Emerald** (`emerald-50/100/200/600/900`): Confirmation, completion

#### Neutral Colors
- **Gray Scale**: `gray-50` (backgrounds) to `gray-900` (headings)
  - `gray-50`: Page background
  - `gray-100`: Hover states
  - `gray-200`: Borders, dividers
  - `gray-400`: Disabled states, subtle icons
  - `gray-600`: Body text, labels
  - `gray-900`: Headings, emphasis

#### Accent Colors
- **Orange**: `orange-500` - Beta badges, special indicators
- **Red**: `red-600` - Errors, negative trends, critical states
- **White**: Card backgrounds, elevated surfaces

### Typography

#### Font Stack
- **System Fonts**: Uses native system font stack for optimal performance
- Defined in TailwindCSS configuration

#### Type Scale
- **3xl** (`text-3xl`): Primary metric values (StatCard values)
- **xl** (`text-xl`): Card titles, section headers
- **lg** (`text-lg`): Page headers, prominent labels
- **base** (`text-base`): Standard body text, brand name
- **sm** (`text-sm`): Secondary text, metadata
- **xs** (`text-xs`): Supporting text, badges, labels

#### Font Weights
- **Bold** (`font-bold`): Primary values, strong emphasis
- **Semibold** (`font-semibold`): Headings, labels, brand
- **Medium** (`font-medium`): Sub-headings, button text, secondary emphasis
- **Regular**: Default body text

### Spacing System

Follow Tailwind's spacing scale (based on 0.25rem = 4px):

- **Micro**: `1` (4px) - Icon gaps, tight spacing
- **Small**: `2-3` (8-12px) - Component internal spacing
- **Medium**: `4-6` (16-24px) - Card padding, section gaps
- **Large**: `8` (32px) - Card padding (desktop), major sections
- **XL**: `12-16` (48-64px) - Page sections, hero spacing

### Layout System

#### Container Widths
- **Max Width**: `max-w-7xl` (1280px) - Main content container
- **Centered**: `mx-auto` - Horizontally center containers
- **Padding**: `px-4 sm:px-6 lg:px-8` - Responsive horizontal padding

#### Grid System
- Use CSS Grid or Flexbox for layouts
- Mobile-first: Start with single column, add columns on larger screens
- Common patterns:
  - 1 column (mobile) → 2 columns (tablet) → 3-4 columns (desktop)
  - Use `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

### Component Patterns

#### Cards
```tsx
// Standard Card Pattern
<div className="bg-white border border-gray-200 rounded-xl p-8 hover:border-gray-300 hover:shadow-md transition-all duration-200">
  {/* Card content */}
</div>
```

Properties:
- Background: `bg-white`
- Border: `border-gray-200` (subtle)
- Radius: `rounded-xl` (12px) - Friendly, modern feel
- Padding: `p-8` (32px) on desktop
- Hover: Enhanced border + shadow
- Transition: `transition-all duration-200`

#### StatCard Pattern
Six color variations for different contexts:
- Uses semantic colors for backgrounds and accents
- Includes icons, trends, tooltips, expandable details
- Loading states with skeleton UI
- Optional links for navigation

#### Buttons (Implicit Pattern)
```tsx
// Primary Button
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
  Button Text
</button>

// Secondary Button
<button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
  Button Text
</button>

// Icon Button
<button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
  <svg className="w-5 h-5">{/* icon */}</svg>
</button>
```

### Interactive States

#### Hover States
- Cards: `hover:border-gray-300 hover:shadow-md`
- Links: `hover:text-blue-600`
- Buttons: `hover:bg-blue-700`
- Icon buttons: `hover:bg-gray-100`
- Always include: `transition-colors` or `transition-all`

#### Focus States
- Ensure visible focus indicators for keyboard navigation
- Use browser default or: `focus:ring-2 focus:ring-blue-500 focus:outline-none`

#### Active States
- Links: `text-blue-600`
- Navigation items: Enhanced styling for current page

#### Loading States
- Skeleton loaders: `bg-gray-200 animate-pulse rounded`
- Spinners: `animate-spin rounded-full border-b-2 border-blue-600`
- Disable interaction during loading

#### Disabled States
- Reduced opacity: `opacity-50`
- No hover effects: `pointer-events-none`
- Gray text: `text-gray-400`

### Animations & Transitions

#### Standard Transitions
- **Duration**: `duration-200` (200ms) for most interactions
- **Easing**: Use CSS defaults (ease-in-out)
- **Properties**:
  - Colors: `transition-colors`
  - All: `transition-all` (use sparingly)
  - Transform: `transition-transform`

#### Animated Effects
- **Hover Translate**: `group-hover:translate-x-1` - Arrow icons in links
- **Rotate**: `rotate-90` - Expandable chevrons
- **Scale**: `hover:scale-105` - Subtle zoom effects
- **Spin**: `animate-spin` - Loading indicators
- **Pulse**: `animate-pulse` - Skeleton loaders

### Icons

#### Icon Library
- Use **Heroicons** pattern (SVG icons from Tailwind team)
- Inline SVG for customization and performance

#### Icon Sizes
- `w-3 h-3` (12px): Micro icons in text
- `w-4 h-4` (16px): Small icons, inline with text
- `w-5 h-5` (20px): Standard interactive icons
- `w-6 h-6` (24px): Larger interactive icons
- `w-8 h-8` (32px): Logo, feature icons
- `w-10 h-10` (40px): StatCard icons

#### Icon Containers (StatCard Pattern)
```tsx
<div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-lg">
  {/* Icon SVG */}
</div>
```

### Responsive Design

#### Breakpoints (Tailwind Defaults)
- **sm**: 640px - Small tablets
- **md**: 768px - Tablets
- **lg**: 1024px - Laptops
- **xl**: 1280px - Desktops
- **2xl**: 1536px - Large desktops

#### Mobile-First Patterns
1. **Header**: Fixed sticky header
   - Mobile: Collapsible menu, search modal
   - Desktop: Inline search, expanded navigation

2. **Grid Layouts**:
   - Mobile: 1 column, full width
   - Tablet: 2 columns
   - Desktop: 3-4 columns

3. **Typography**:
   - Scale down heading sizes on mobile
   - Maintain readability (min 16px for body text)

4. **Spacing**:
   - Reduce padding on mobile: `p-4 lg:p-8`
   - Tighter gaps: `gap-4 lg:gap-6`

### Shadows & Elevation

Use shadows sparingly for depth:

- **None**: Default cards (use borders instead)
- **sm**: `shadow-sm` - Elevated header
- **md**: `shadow-md` - Hover state on cards
- **lg**: `shadow-lg` - Modals, tooltips, dropdowns

### Forms & Inputs (Future Reference)

When implementing forms:
```tsx
<input
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
  placeholder="Enter text"
/>
```

### Badges & Labels

```tsx
// Beta Badge Example
<sup className="text-xs text-orange-500 ml-1">beta</sup>
```

### Tooltips

- Background: `bg-gray-900`
- Text: `text-white text-sm`
- Padding: `px-4 py-3`
- Rounded: `rounded-lg`
- Shadow: `shadow-lg`
- Position: Absolute with transforms
- Include arrow pointer

### UX Patterns

#### Navigation
- Fixed header that stays visible during scroll
- Breadcrumbs for deep navigation (if needed)
- Clear active state indicators
- Mobile: Hamburger menu or bottom navigation

#### Data Display
- Tables: Sortable columns, pagination, search
- Charts: Interactive, tooltips on hover, downloadable
- Cards: Scannable grid layouts
- Lists: Virtualization for 100+ items

#### Feedback
- Loading states: Skeleton UI or spinners
- Error states: Clear error messages with retry options
- Success states: Confirmation messages
- Empty states: Helpful guidance

#### Search
- Prominent search bar in header
- Real-time results
- Keyboard navigation support
- Mobile: Full-screen search modal

#### Progressive Disclosure
- Expandable details (StatCard pattern)
- Collapsible sections for complex data
- "Show more" for long lists
- Tabs or segments for related content

### Accessibility Guidelines

#### Color Contrast
- Text: Minimum 4.5:1 ratio
- Large text (18px+): Minimum 3:1 ratio
- Interactive elements: Maintain contrast in all states

#### Keyboard Navigation
- All interactive elements must be focusable
- Logical tab order
- Visible focus indicators
- Escape key closes modals/dropdowns
- Enter/Space activates buttons

#### ARIA Labels
- Add `aria-label` to icon-only buttons
- Use `role` attributes where needed
- Add `alt` text to all images
- Use semantic HTML (`<nav>`, `<main>`, `<article>`, etc.)

#### Screen Readers
- Use semantic HTML structure
- Provide text alternatives for visual content
- Announce dynamic content updates
- Hide decorative elements: `aria-hidden="true"`

## Component Patterns

### Feature Components

- Keep components small and focused (< 200 lines)
- Use TypeScript interfaces for props
- Implement proper loading and error states
- Follow the container/presentational pattern where appropriate

### Shared Components

Located in `shared/components/`, these should be:
- Highly reusable across features
- Well-documented with TypeScript types
- Tested with unit tests
- Theme-aware (support light/dark modes)

## State Management

- **Local State**: Use useState for component-specific state
- **Server State**: Use React Query for all API data
- **Global UI State**: Use Context API (theme, filters, user preferences)
- **URL State**: Use React Router for shareable/bookmarkable state

Store user preferences (theme, layout settings) in localStorage.

## Testing Guidelines

- Write unit tests for all utilities and hooks
- Test component rendering and user interactions
- Target 80%+ code coverage
- Mock Supabase calls in tests
- Use React Testing Library best practices (test behavior, not implementation)

## Deployment Configuration

When deploying to GitHub Pages:

1. Set `base` in `vite.config.ts` to match repository name: `base: '/onepieceofdata-react/'`
2. Ensure HashRouter is used in routing configuration
3. Run `npm run build` to create production bundle
4. Deploy using `npm run deploy` (gh-pages package)
5. Verify deployment at: `https://[username].github.io/onepieceofdata-react/`

## Development Phases

The project is being built in phases:

1. **Foundation**: Project setup, routing, core infrastructure
2. **Core Features**: Interactive data tables with sorting/filtering
3. **Detail Pages**: Character, Arc, Devil Fruit detail views
4. **Data Visualization**: Analytics page with interactive charts
5. **Search & UX**: Global search, theme switching, loading states
6. **Testing & Optimization**: Unit tests, performance optimization, accessibility
7. **Documentation & Launch**: Final documentation and production deployment

## Supabase Integration

### API Pattern

All Supabase interactions should go through service files in `src/services/` or feature-specific services:

```typescript
// Example: src/features/characters/services/characterService.ts
export const characterService = {
  getAll: (filters) => supabase.from('characters').select('*')...
  getById: (id) => supabase.from('characters').select('*').eq('id', id).single()
  // etc.
};
```

### Real-time Updates (Optional)

Supabase supports real-time subscriptions. If implementing live updates:
- Use sparingly to avoid excessive re-renders
- Clean up subscriptions in useEffect cleanup
- Consider user preference toggles for real-time features

## Browser Compatibility

Support modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Use polyfills if needed for older browser support.

## Known Constraints

- **GitHub Pages**: Static site only, no server-side rendering
- **Supabase Free Tier**: 500 MB storage, 2 GB bandwidth/month
- **No Backend Routes**: All routing must be client-side via HashRouter
- **CORS**: Configure Supabase CORS settings for GitHub Pages domain

## Code Style

- Use TypeScript for all new files
- Follow React best practices and hooks rules
- Configure ESLint and Prettier for consistent formatting
- Use meaningful variable and function names
- Write clear comments for complex logic
- Keep files focused on a single responsibility
