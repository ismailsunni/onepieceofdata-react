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
