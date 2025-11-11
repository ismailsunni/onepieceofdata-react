# Product Requirements Document (PRD)
## One Piece of Data - React Data Exploration App

**Project Name:** One Piece of Data  
**Version:** 2.0 (React Migration)  
**Document Version:** 1.0  
**Created:** November 11, 2025  
**Product Owner:** [Your Name]  
**Status:** Draft

---

## Executive Summary

### Purpose
One Piece of Data is a comprehensive data exploration application designed to provide interactive visualization and analysis of One Piece universe data. This PRD outlines the migration from the existing Streamlit application (https://onepieceofdata.streamlit.app/) to a modern React-based architecture hosted on GitHub Pages, with Supabase as the backend data source.

### Background
The current Streamlit application serves as a proof-of-concept for exploring One Piece data through tables and visualizations. The React migration aims to modernize the stack, improve performance, enhance user experience, and provide a more polished, production-ready interface while maintaining the core functionality users appreciate.

### Goals
- **Primary Goal:** Successfully migrate core features from Streamlit to React with improved UX/UI
- **Secondary Goals:**
  - Achieve sub-2-second page load times on GitHub Pages
  - Implement responsive design supporting mobile, tablet, and desktop
  - Enable real-time data updates through Supabase integration
  - Provide interactive data exploration with filtering, sorting, and search capabilities
  - Create a scalable architecture for future feature additions

### Success Metrics
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Initial Load Time | < 2 seconds | Lighthouse Performance Score > 90 |
| Time to Interactive | < 3 seconds | React DevTools Profiler |
| Mobile Responsiveness | 100% | Responsive design testing across devices |
| Data Fetch Time | < 500ms | API response time monitoring |
| User Engagement | 30% increase | Analytics tracking (time on page, interactions) |
| Feature Parity | 100% | All core Streamlit features implemented |

---

## Stakeholders

### Internal Stakeholders
- **Product Owner/Developer:** Responsible for development, deployment, and maintenance
- **Future Contributors:** Open-source contributors (if applicable)

### External Stakeholders
- **End Users:** One Piece fans, data analysts, researchers interested in anime/manga data
- **Data Source:** Supabase (database management and API)
- **Hosting Platform:** GitHub Pages

---

## Product Vision & Objectives

### Vision Statement
To create the most comprehensive, user-friendly, and visually appealing One Piece data exploration platform that enables fans and researchers to discover insights, patterns, and trends within the One Piece universe.

### Objectives
1. **Modernization:** Transform the application from a Python-based Streamlit app to a React-based SPA
2. **Performance:** Optimize for fast loading and smooth interactions
3. **User Experience:** Design intuitive navigation and interactive data exploration
4. **Scalability:** Build a maintainable codebase that supports future features
5. **Accessibility:** Ensure the application is accessible to all users (WCAG 2.1 Level AA compliance)

---

## User Personas

### Persona 1: The Casual Fan
- **Name:** Alex
- **Age:** 18-30
- **Background:** Watches/reads One Piece casually, interested in character stats and arc information
- **Goals:** Quick access to character information, comparison of devil fruits, viewing arc summaries
- **Pain Points:** Overwhelming amounts of data, complex interfaces
- **Needs:** Simple navigation, visual charts, mobile-friendly interface

### Persona 2: The Data Analyst
- **Name:** Jordan
- **Age:** 25-40
- **Background:** Data enthusiast who enjoys analyzing anime/manga statistics
- **Goals:** Deep-dive analysis, filtering and sorting capabilities, exporting data
- **Pain Points:** Limited filtering options, no data export functionality
- **Needs:** Advanced filtering, sortable tables, downloadable datasets, chart customization

### Persona 3: The Wiki Contributor
- **Name:** Morgan
- **Age:** 20-35
- **Background:** Active One Piece community member who maintains wikis
- **Goals:** Verify information, find accurate statistics, discover data relationships
- **Pain Points:** Unreliable sources, outdated information
- **Needs:** Accurate data, source citations, search functionality, recent updates

---

## Technical Architecture

### Tech Stack
- **Frontend Framework:** React 18+ with TypeScript
- **Build Tool:** Vite
- **Routing:** React Router v6 (with HashRouter for GitHub Pages compatibility)
- **State Management:** React Context API + Custom Hooks
- **UI Framework:** TailwindCSS + Headless UI (or Material-UI/Chakra UI)
- **Table Library:** TanStack Table (React Table v8) - headless, flexible, TypeScript-first
- **Chart Library:** Recharts (primary) + Chart.js wrapper (for specific chart types)
- **Data Fetching:** React Query (TanStack Query) for server state management
- **Backend:** Supabase (PostgreSQL database, REST API, real-time subscriptions)
- **Hosting:** GitHub Pages
- **Analytics:** Google Analytics 4 (optional)
- **Testing:** Vitest + React Testing Library

### System Architecture
```
┌─────────────────────────────────────────────────────┐
│                  GitHub Pages                        │
│              (Static Site Hosting)                   │
└───────────────────┬─────────────────────────────────┘
                    │
                    │ HTTPS
                    │
┌───────────────────▼─────────────────────────────────┐
│              React Application                       │
│  ┌─────────────────────────────────────────────┐   │
│  │  Components (Pages, UI, Charts, Tables)     │   │
│  └──────────────────┬──────────────────────────┘   │
│  ┌──────────────────▼──────────────────────────┐   │
│  │     State Management (Context + Hooks)      │   │
│  └──────────────────┬──────────────────────────┘   │
│  ┌──────────────────▼──────────────────────────┐   │
│  │    Data Layer (React Query + Supabase SDK)  │   │
│  └──────────────────┬──────────────────────────┘   │
└─────────────────────┼──────────────────────────────┘
                      │
                      │ REST API / WebSocket
                      │
┌─────────────────────▼──────────────────────────────┐
│                  Supabase                           │
│  ┌────────────────────────────────────────────┐   │
│  │     PostgreSQL Database                    │   │
│  │  (Characters, Arcs, Devil Fruits, etc.)    │   │
│  └────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────┐   │
│  │     Authentication (if needed)             │   │
│  └────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────┐   │
│  │     Real-time (for live updates)           │   │
│  └────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────┘
```

### Folder Structure
```
one-piece-of-data/
├── public/
│   ├── favicon.ico
│   ├── robots.txt
│   └── assets/
│       └── images/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── Router.tsx
│   ├── features/
│   │   ├── characters/
│   │   │   ├── components/
│   │   │   │   ├── CharacterTable.tsx
│   │   │   │   ├── CharacterCard.tsx
│   │   │   │   └── CharacterFilters.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useCharacters.ts
│   │   │   ├── services/
│   │   │   │   └── characterService.ts
│   │   │   └── pages/
│   │   │       ├── CharactersPage.tsx
│   │   │       └── CharacterDetailPage.tsx
│   │   ├── arcs/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── pages/
│   │   ├── devilfruits/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── pages/
│   │   └── analytics/
│   │       ├── components/
│   │       ├── hooks/
│   │       └── pages/
│   ├── shared/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   └── Loading.tsx
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Layout.tsx
│   │   │   └── charts/
│   │   │       ├── BarChart.tsx
│   │   │       ├── PieChart.tsx
│   │   │       └── LineChart.tsx
│   │   ├── hooks/
│   │   │   ├── useDebounce.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   └── useMediaQuery.ts
│   │   ├── utils/
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   └── constants.ts
│   │   └── types/
│   │       ├── character.types.ts
│   │       ├── arc.types.ts
│   │       └── devilfruit.types.ts
│   ├── services/
│   │   ├── supabase.ts
│   │   └── api/
│   │       └── client.ts
│   ├── context/
│   │   ├── ThemeContext.tsx
│   │   └── FilterContext.tsx
│   ├── styles/
│   │   ├── index.css
│   │   └── tailwind.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── .env.local
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

---

## Functional Requirements

### FR-1: Navigation & Routing

#### FR-1.1: Main Navigation
**Priority:** Must-Have  
**User Story:** As a user, I want to navigate between different sections of the app so that I can explore various aspects of One Piece data.

**Acceptance Criteria:**
- Navigation bar displays at the top of all pages
- Navigation includes links to: Home, Characters, Arcs, Devil Fruits, Analytics
- Active page is visually highlighted in navigation
- Navigation is responsive and converts to hamburger menu on mobile (< 768px)
- Navigation persists across all pages
- Clicking logo returns user to home page

#### FR-1.2: Client-Side Routing
**Priority:** Must-Have  
**User Story:** As a user, I want fast page transitions without full page reloads so that I have a smooth browsing experience.

**Acceptance Criteria:**
- Implement React Router with HashRouter (for GitHub Pages compatibility)
- Routes include: `/`, `/characters`, `/characters/:id`, `/arcs`, `/arcs/:id`, `/devil-fruits`, `/analytics`
- Browser back/forward buttons work correctly
- Direct URL access works for all routes
- 404 page displays for invalid routes
- Page transitions complete in < 200ms

### FR-2: Data Tables

#### FR-2.1: Interactive Data Tables
**Priority:** Must-Have  
**User Story:** As a user, I want to view data in sortable, filterable tables so that I can easily find specific information.

**Acceptance Criteria:**
- Tables display with columns: Name, Status, Affiliation, Devil Fruit, Bounty (for Characters)
- Column headers are clickable for sorting (ascending/descending)
- Each column has filter input (text search for strings, range for numbers)
- Pagination controls display at bottom (show 10/25/50/100 rows per page)
- Table displays loading state while fetching data
- Empty state displays when no results match filters
- Table is responsive (stacks columns or horizontal scroll on mobile)
- Selected row highlights when clicked
- Double-click row navigates to detail page

#### FR-2.2: Advanced Filtering
**Priority:** Should-Have  
**User Story:** As a data analyst, I want advanced filtering options so that I can perform complex queries on the data.

**Acceptance Criteria:**
- Filter panel can be toggled open/closed
- Supports multiple filter conditions with AND/OR logic
- Filters persist when navigating between pages
- "Clear All Filters" button resets all active filters
- Active filter count badge displays on filter button
- Filters can be saved as "presets" for quick access (localStorage)

#### FR-2.3: Data Export
**Priority:** Could-Have  
**User Story:** As a researcher, I want to export filtered data so that I can analyze it in external tools.

**Acceptance Criteria:**
- Export button available above table
- Supports CSV and JSON formats
- Exported file includes only filtered/visible data
- File naming convention: `one-piece-[table-name]-[date].csv`
- Export completes in < 3 seconds for datasets up to 1000 rows

### FR-3: Data Visualization

#### FR-3.1: Interactive Charts
**Priority:** Must-Have  
**User Story:** As a casual fan, I want to see visual representations of data so that I can understand trends and patterns easily.

**Acceptance Criteria:**
- Analytics page displays multiple chart types: bar, pie, line, scatter
- Charts include: Devil Fruit distribution by type, Character bounties by arc, Crew size comparison
- Charts are interactive (hover shows tooltips with values)
- Charts are responsive and resize based on viewport
- Charts support light/dark theme
- Loading state displays while chart data is fetching
- Chart legends are clickable to toggle data series visibility

#### FR-3.2: Chart Customization
**Priority:** Should-Have  
**User Story:** As a data analyst, I want to customize chart parameters so that I can create specific visualizations.

**Acceptance Criteria:**
- Dropdown to select chart type (bar, line, pie, scatter)
- Options to select X-axis and Y-axis data fields
- Color palette selector for chart colors
- Toggle options for grid lines, labels, legends
- "Reset to Default" button restores original chart settings

### FR-4: Search & Discovery

#### FR-4.1: Global Search
**Priority:** Must-Have  
**User Story:** As a user, I want to search across all data so that I can quickly find what I'm looking for.

**Acceptance Criteria:**
- Search bar in header available on all pages
- Search activates after typing 3+ characters
- Results display in dropdown with categories (Characters, Arcs, Devil Fruits)
- Shows top 5 results per category
- "View All Results" link navigates to full search results page
- Keyboard navigation supported (arrow keys, Enter to select)
- Search includes fuzzy matching for typos
- Recent searches stored and displayed (localStorage, max 10)

#### FR-4.2: Autocomplete & Suggestions
**Priority:** Should-Have  
**User Story:** As a user, I want search suggestions as I type so that I can discover relevant content faster.

**Acceptance Criteria:**
- Suggestions appear after 2 characters
- Displays up to 10 suggestions
- Highlights matching text in suggestions
- Suggestions ordered by relevance (exact matches first, then partial)
- Popular/trending searches highlighted with icon

### FR-5: Detail Pages

#### FR-5.1: Character Detail Page
**Priority:** Must-Have  
**User Story:** As a user, I want to view comprehensive information about a character so that I can learn more about them.

**Acceptance Criteria:**
- Page displays: Name, image, epithet, status, affiliation, devil fruit, bounty, debut arc
- Related characters displayed in "Crew Members" or "Allies" section
- Character timeline shows appearances across arcs
- Back button returns to characters table
- Share button copies URL to clipboard
- Page is SEO-friendly with meta tags and structured data

#### FR-5.2: Arc Detail Page
**Priority:** Must-Have  
**User Story:** As a user, I want to view arc information including characters and events so that I can understand story progression.

**Acceptance Criteria:**
- Page displays: Arc name, description, start/end chapter, episode count
- Characters introduced in arc displayed as cards
- Key events timeline displayed chronologically
- Related arcs section shows previous/next arcs

#### FR-5.3: Devil Fruit Detail Page
**Priority:** Must-Have  
**User Story:** As a user, I want detailed devil fruit information including abilities and users.

**Acceptance Criteria:**
- Page displays: Fruit name (Japanese & English), type (Paramecia/Zoan/Logia), description
- Current user displayed with link to character page
- Previous users listed (if applicable)
- Abilities section with bullet points
- Weaknesses section
- Related fruits suggested based on type

### FR-6: User Preferences

#### FR-6.1: Theme Switching
**Priority:** Should-Have  
**User Story:** As a user, I want to switch between light and dark themes so that I can view the app comfortably in different lighting conditions.

**Acceptance Criteria:**
- Theme toggle button in header
- Themes: Light, Dark, System (follows OS preference)
- Theme preference saved to localStorage
- Smooth transition between themes (< 200ms)
- All charts, tables, and components respect theme
- High contrast mode available for accessibility

#### FR-6.2: Layout Customization
**Priority:** Could-Have  
**User Story:** As a user, I want to customize the layout so that I can personalize my viewing experience.

**Acceptance Criteria:**
- Toggle sidebar visibility (collapsed/expanded)
- Adjustable table density (compact/comfortable/spacious)
- Font size options (small/medium/large)
- Preferences saved to localStorage

### FR-7: Performance & Optimization

#### FR-7.1: Code Splitting & Lazy Loading
**Priority:** Must-Have  
**User Story:** As a user, I want the app to load quickly so that I can start exploring data immediately.

**Acceptance Criteria:**
- Route-based code splitting implemented
- Components lazy-loaded with Suspense fallbacks
- Images lazy-loaded (loading="lazy" attribute)
- Bundle size < 300KB (initial load)
- Lighthouse Performance score > 90

#### FR-7.2: Caching & Data Management
**Priority:** Must-Have  
**User Story:** As a user, I want the app to remember previously loaded data so that navigation is faster.

**Acceptance Criteria:**
- React Query caches API responses with 5-minute stale time
- Background refetching on window focus
- Optimistic updates for user interactions
- Error retry logic (3 attempts with exponential backoff)

---

## Non-Functional Requirements

### NFR-1: Performance
- **Initial Load Time:** < 2 seconds on 3G connection
- **Time to Interactive:** < 3 seconds
- **Largest Contentful Paint (LCP):** < 2.5 seconds
- **First Input Delay (FID):** < 100ms
- **Cumulative Layout Shift (CLS):** < 0.1
- **API Response Time:** < 500ms for 95th percentile

### NFR-2: Scalability
- Handle datasets with up to 5,000 characters, 100 arcs, 200 devil fruits
- Support up to 1,000 concurrent users (GitHub Pages limitation)
- Table virtualization for lists exceeding 100 rows
- Implement infinite scroll or pagination for large datasets

### NFR-3: Security
- All API requests use HTTPS
- Supabase API keys stored in environment variables (not committed)
- Row-Level Security (RLS) enabled on Supabase (if authentication added)
- Input sanitization to prevent XSS attacks
- Content Security Policy (CSP) headers configured

### NFR-4: Accessibility (WCAG 2.1 Level AA)
- Keyboard navigation support for all interactive elements
- ARIA labels on all buttons and interactive components
- Color contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text
- Screen reader compatible
- Focus indicators visible on all focusable elements
- Alternative text for all images

### NFR-5: Compatibility
- **Browsers:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Devices:** Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)
- **Screen Readers:** NVDA, JAWS, VoiceOver
- **Operating Systems:** Windows, macOS, iOS, Android

### NFR-6: Maintainability
- Code follows React best practices and design patterns
- TypeScript for type safety
- ESLint and Prettier configured for consistent code style
- 80%+ code coverage with unit tests
- Component documentation with Storybook (optional)
- README with setup instructions and architecture overview

### NFR-7: Usability
- Onboarding tooltip tour for first-time visitors (optional)
- Help icon with documentation link in header
- Error messages clear and actionable
- Maximum of 3 clicks to reach any feature
- Consistent UI patterns across all pages

---

## Data Model

### Supabase Tables

#### Characters Table
```typescript
interface Character {
  id: string; // UUID primary key
  name: string;
  epithet?: string;
  status: 'Alive' | 'Deceased' | 'Unknown';
  affiliation?: string;
  devil_fruit_id?: string; // Foreign key
  bounty?: number;
  debut_arc_id?: string; // Foreign key
  image_url?: string;
  description?: string;
  created_at: timestamp;
  updated_at: timestamp;
}
```

#### Arcs Table
```typescript
interface Arc {
  id: string; // UUID primary key
  name: string;
  description: string;
  start_chapter?: number;
  end_chapter?: number;
  start_episode?: number;
  end_episode?: number;
  saga?: string;
  order: number; // For chronological sorting
  created_at: timestamp;
  updated_at: timestamp;
}
```

#### Devil Fruits Table
```typescript
interface DevilFruit {
  id: string; // UUID primary key
  name_japanese: string;
  name_english: string;
  type: 'Paramecia' | 'Zoan' | 'Logia' | 'Mythical Zoan' | 'Ancient Zoan';
  description: string;
  abilities: string[]; // JSON array
  weaknesses: string[]; // JSON array
  current_user_id?: string; // Foreign key to characters
  image_url?: string;
  created_at: timestamp;
  updated_at: timestamp;
}
```

#### Character_Arcs (Junction Table)
```typescript
interface CharacterArc {
  character_id: string; // Foreign key
  arc_id: string; // Foreign key
  role?: 'Main' | 'Supporting' | 'Minor';
  created_at: timestamp;
}
```

### API Endpoints (Supabase REST API)

**Characters:**
- GET `/rest/v1/characters` - List all characters (with filters, sorting, pagination)
- GET `/rest/v1/characters?id=eq.{id}` - Get character by ID

**Arcs:**
- GET `/rest/v1/arcs` - List all arcs
- GET `/rest/v1/arcs?id=eq.{id}` - Get arc by ID

**Devil Fruits:**
- GET `/rest/v1/devil_fruits` - List all devil fruits
- GET `/rest/v1/devil_fruits?id=eq.{id}` - Get devil fruit by ID

**Analytics:**
- GET `/rest/v1/rpc/get_fruit_distribution` - Custom RPC function
- GET `/rest/v1/rpc/get_bounty_trends` - Custom RPC function

---

## User Stories & Epics

### Epic 1: Core Navigation & Routing
**Priority:** Must-Have

- **US-1.1:** As a user, I want to see a navigation bar so that I can access different sections.
  - *Acceptance Criteria:* Navigation displays Home, Characters, Arcs, Devil Fruits, Analytics links
  
- **US-1.2:** As a user, I want page URLs to change when navigating so that I can bookmark and share pages.
  - *Acceptance Criteria:* React Router implemented with HashRouter, all routes work with direct URL access

### Epic 2: Characters Feature
**Priority:** Must-Have

- **US-2.1:** As a user, I want to view a table of all characters so that I can browse the cast.
  - *Acceptance Criteria:* Table displays with name, status, affiliation, bounty columns

- **US-2.2:** As a user, I want to sort characters by bounty so that I can see the most powerful characters.
  - *Acceptance Criteria:* Clicking bounty column header sorts ascending/descending

- **US-2.3:** As a user, I want to filter characters by affiliation so that I can see crew members.
  - *Acceptance Criteria:* Affiliation dropdown filter updates table results

- **US-2.4:** As a user, I want to click a character to view their details so that I can learn more.
  - *Acceptance Criteria:* Clicking row navigates to `/characters/:id` with full information

### Epic 3: Data Visualization
**Priority:** Must-Have

- **US-3.1:** As a user, I want to see a chart of devil fruit types so that I understand the distribution.
  - *Acceptance Criteria:* Pie chart displays Paramecia, Zoan, Logia percentages

- **US-3.2:** As a user, I want to see bounty trends over time so that I can track power progression.
  - *Acceptance Criteria:* Line chart displays average bounties per arc

### Epic 4: Search & Discovery
**Priority:** Should-Have

- **US-4.1:** As a user, I want to search for characters by name so that I can quickly find them.
  - *Acceptance Criteria:* Search bar in header, results display in < 500ms

- **US-4.2:** As a user, I want search suggestions as I type so that I can discover related content.
  - *Acceptance Criteria:* Autocomplete dropdown shows 5 suggestions after 2 characters

### Epic 5: User Experience Enhancements
**Priority:** Should-Have

- **US-5.1:** As a user, I want a dark mode option so that I can view the app comfortably at night.
  - *Acceptance Criteria:* Theme toggle in header, preference saved to localStorage

- **US-5.2:** As a user, I want responsive design so that I can use the app on my phone.
  - *Acceptance Criteria:* All pages functional on mobile (375px width), hamburger menu works

---

## Development Timeline

### Phase 1: Foundation (Weeks 1-2)
**Milestone:** Project setup and core infrastructure complete

**Tasks:**
- Project initialization with Vite + React + TypeScript
- Configure TailwindCSS, ESLint, Prettier
- Set up Supabase project and database schema
- Implement basic routing with React Router
- Create folder structure and base components
- Configure GitHub Pages deployment

**Deliverables:**
- Empty React app deployed to GitHub Pages
- Supabase database with sample data
- README with setup instructions

### Phase 2: Core Features - Tables (Weeks 3-4)
**Milestone:** Interactive data tables functional

**Tasks:**
- Implement TanStack Table for Characters page
- Add sorting, filtering, pagination
- Connect to Supabase API with React Query
- Create table loading and error states
- Implement responsive table design
- Add Arcs and Devil Fruits tables

**Deliverables:**
- Functional Characters, Arcs, Devil Fruits tables
- Working filters and sorting
- Supabase integration complete

### Phase 3: Detail Pages (Weeks 5-6)
**Milestone:** Detail pages for all entities complete

**Tasks:**
- Create character detail page with full information
- Create arc detail page with characters list
- Create devil fruit detail page
- Implement related content sections
- Add navigation breadcrumbs
- Test detail page routing

**Deliverables:**
- Fully functional detail pages
- Smooth navigation between list and detail views

### Phase 4: Data Visualization (Week 7)
**Milestone:** Analytics page with charts

**Tasks:**
- Set up Recharts library
- Create devil fruit distribution pie chart
- Create bounty trends line chart
- Create crew size comparison bar chart
- Add chart interactivity (hover, click)
- Implement responsive chart sizing

**Deliverables:**
- Analytics page with 3+ interactive charts
- Chart data sourced from Supabase

### Phase 5: Search & UX Enhancements (Week 8)
**Milestone:** Search and UX improvements

**Tasks:**
- Implement global search functionality
- Add autocomplete and suggestions
- Create theme switcher (light/dark)
- Add loading states and transitions
- Implement error boundaries
- Add 404 page

**Deliverables:**
- Working global search
- Theme switching functional
- Polished loading states

### Phase 6: Testing & Optimization (Week 9)
**Milestone:** App fully tested and optimized

**Tasks:**
- Write unit tests for components (Vitest)
- Implement code splitting and lazy loading
- Optimize bundle size
- Run Lighthouse performance audit
- Fix accessibility issues (WCAG compliance)
- Cross-browser testing

**Deliverables:**
- 80%+ code coverage
- Lighthouse score > 90
- All accessibility issues resolved

### Phase 7: Documentation & Launch (Week 10)
**Milestone:** Production launch

**Tasks:**
- Update README with features and screenshots
- Create user guide/help documentation
- Final QA testing
- Deploy to production (GitHub Pages)
- Set up analytics (optional)
- Announce launch

**Deliverables:**
- Production-ready application
- Complete documentation
- Public launch

---

## Constraints & Dependencies

### Constraints
- **GitHub Pages Limitations:**
  - No server-side rendering (SSR) available
  - Must use HashRouter for client-side routing (BrowserRouter causes 404 on refresh)
  - Static site only - no dynamic backend routes
  
- **Supabase Free Tier Limits:**
  - 500 MB database storage
  - 2 GB bandwidth per month
  - 50,000 monthly active users
  - May require upgrade if traffic increases

- **Budget:** $0 (free tier hosting and backend)

- **Development Time:** Single developer, part-time (10 weeks estimated)

### Dependencies
- **Supabase Service Availability:** App depends on Supabase uptime (99.9% SLA)
- **GitHub Pages Availability:** Hosting depends on GitHub service
- **External Libraries:** React ecosystem libraries (maintenance and updates)
- **Data Source:** Requires accurate One Piece data (manual entry or API)

### Risks & Mitigation

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|-------------------|
| Supabase free tier limits exceeded | High | Low | Monitor usage, implement caching, upgrade if needed |
| GitHub Pages 404 routing issues | High | Medium | Use HashRouter, add 404.html fallback |
| Performance issues with large datasets | Medium | Medium | Implement virtualization, pagination, lazy loading |
| Data accuracy/completeness | Medium | Medium | Source from reliable wikis, implement data validation |
| Browser compatibility issues | Low | Low | Test on multiple browsers, use polyfills if needed |
| Scope creep during development | Medium | High | Strict prioritization (MoSCoW), stick to MVP features |

---

## Testing Strategy

### Unit Testing
- **Framework:** Vitest + React Testing Library
- **Coverage Target:** 80% code coverage
- **Focus Areas:**
  - Component rendering
  - User interactions (clicks, typing)
  - Props validation
  - Hooks logic
  - Utility functions

### Integration Testing
- **Focus Areas:**
  - API integration with Supabase
  - React Query cache behavior
  - Routing and navigation flows
  - Filter and search interactions

### End-to-End Testing (Optional)
- **Framework:** Playwright or Cypress
- **Focus Areas:**
  - Critical user journeys (search → view detail)
  - Table filtering and sorting
  - Theme switching

### Performance Testing
- **Tools:** Lighthouse, WebPageTest, React DevTools Profiler
- **Metrics:** LCP, FID, CLS, bundle size, API response times

### Accessibility Testing
- **Tools:** axe DevTools, WAVE, Lighthouse
- **Manual Testing:** Screen reader testing (NVDA, VoiceOver)

---

## Deployment & DevOps

### Deployment Process
1. **Build:** Run `npm run build` to create production bundle
2. **Configure:** Set `base` in `vite.config.ts` to `/repo-name`
3. **Deploy:** Run `npm run deploy` (gh-pages package)
4. **Verify:** Check GitHub Pages settings, test deployed site

### Environment Variables
```bash
# .env.local (not committed)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_GA_TRACKING_ID=your_ga_id (optional)
```

### Continuous Integration (Optional)
- **GitHub Actions workflow:**
  - Run tests on pull requests
  - Lint code
  - Build app
  - Deploy to GitHub Pages on merge to main

### Monitoring & Analytics
- **Google Analytics 4:** Track page views, user flows
- **Sentry (optional):** Error tracking and monitoring
- **Supabase Dashboard:** Monitor database queries and performance

---

## Future Enhancements (Post-MVP)

### Phase 2 Features
- **User Accounts & Authentication:** Allow users to save favorites, create custom lists
- **Data Contributions:** Let users submit corrections or additions (moderated)
- **Advanced Analytics:** Predictive modeling, trend analysis, correlations
- **Comparison Tool:** Side-by-side character/devil fruit comparison
- **Timeline Visualization:** Interactive story timeline with events
- **Mobile App:** React Native version for iOS/Android

### Phase 3 Features
- **Social Features:** Comments, ratings, discussions
- **API for Developers:** Public API for third-party integrations
- **Localization:** Multi-language support (English, Japanese, Spanish)
- **Data Export API:** Scheduled exports, webhooks
- **Custom Dashboards:** User-created charts and reports

---

## Appendix

### Glossary
- **MVP:** Minimum Viable Product
- **SPA:** Single Page Application
- **SSR:** Server-Side Rendering
- **CSR:** Client-Side Rendering
- **RLS:** Row-Level Security (Supabase)
- **TanStack Table:** Headless table library (formerly React Table)
- **React Query:** Server state management library (TanStack Query)
- **HashRouter:** React Router mode that uses URL hash for routing

### References
- React Documentation: https://react.dev
- TanStack Table: https://tanstack.com/table
- Recharts: https://recharts.org
- Supabase Documentation: https://supabase.com/docs
- GitHub Pages React Deployment: https://create-react-app.dev/docs/deployment/#github-pages
- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/

### Related Documents
- Original Streamlit App: https://onepieceofdata.streamlit.app/
- Database Schema (to be created in Supabase)
- API Documentation (Supabase auto-generated)
- Design Mockups (to be created in Figma - optional)

---

## Approval & Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | [Your Name] | YYYY-MM-DD | |
| Lead Developer | [Your Name] | YYYY-MM-DD | |

---

**Document History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-11 | [Your Name] | Initial PRD creation |

---

**Next Steps:**
1. Review and approve this PRD
2. Set up development environment (Vite + React + Supabase)
3. Begin Phase 1: Foundation (Week 1)
4. Schedule weekly progress check-ins
5. Document learnings and blockers in project wiki
