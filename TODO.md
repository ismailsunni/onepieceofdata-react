# One Piece of Data - TODO List

## ✅ Completed

- [x] Volume page - Create detail page similar to Chapter/Arc/Saga
- [x] Chapter list in Arc page + expandable character list
- [x] Expandable lists applied to all detail pages (Arc, Saga, Volume)
  - All lists now have expand/collapse functionality with colored buttons
  - Improved page load performance by reducing initial DOM size
- [x] Better menu bar separation (Story → Saga, Arc; Media → Volume, Chapter)
  - Created dropdown navigation for Story and Media groups
  - Reordered items hierarchically (broader to specific)
- [x] Volume list page converted to table layout
  - Added chapter count, total pages, and chapter range columns
  - Consistent with other list pages (Chapters, Arcs, Sagas)
- [x] Rearrange Analytics page charts
  - Split into focused pages: Character Stats, Character Appearances, Story & Arcs
  - Created Analytics dashboard as navigation hub
  - Improved performance by loading only needed charts
- [x] Venn diagram for pre/post time skip characters
  - SVG-based interactive Venn diagram showing character distribution
  - Displays pre-time skip only, post-time skip only, and both periods
  - Integrated into Character Appearances analytics page
- [x] Clickable Home page components
  - 8 out of 10 components now interactive with navigation links
  - StatCards: 5/7 clickable (Chapters, Volumes, Arcs, Sagas, Characters)
  - Feature Cards: 3/3 clickable with hover effects
- [x] Enhanced About page
  - Added comprehensive project information and introduction
  - Included credits (creator, GitHub Pages, Supabase)
  - Added data sources and official links
  - Support section with "Buy me a coffee" button
  - Feedback section linking to GitHub Issues
  - Professional disclaimer and footer
- [x] Character birthday calendar
  - Interactive calendar with month/year view toggle
  - Color-coded dates based on birthday count (1-4+ characters)
  - Month/year navigation with "Today" quick jump button
  - Birthday greeting section for today's birthdays
  - Character ages and deceased status (skull icon) displayed
  - All character names clickable to detail pages
  - Context menu-style popup in year view for easy access
  - Today's date highlighted with orange border
  - Statistics cards with collapsible details (busiest day, empty dates)
  - Legend showing distribution counts for each birthday category
  - Added to Analytics dashboard with cake emoji icon

## 🔄 High Priority

- [ ] None currently

## 📊 Medium Priority (Data Visualization)

- [x] Calendar view of chapter release vs Jump issue
  - Compact table layout with narrow columns
  - 4 visualization themes (Jump Issue, Saga, Arc, Luffy Appears)
  - Copy/download as image functionality with full table capture
  - Dynamic legend based on selected theme
- [ ] Chapter release prediction feature
- [ ] Character timeline comparison
- [ ] Character comparison tool
- [ ] Fix Character Timeline bugs (currently hidden from navigation)

## 🎨 UI/UX Improvements

### 🚀 Priority Quick Wins
- [ ] Replace alert() with toast notifications library (react-hot-toast or sonner)
- [ ] Add dark mode toggle with localStorage persistence
- [ ] Make navigation header sticky on scroll
- [ ] Add breadcrumb navigation for detail pages
- [ ] Implement skeleton loaders to replace loading spinners
- [ ] Add zebra striping to calendar table for better readability

### 📅 Chapter Release Calendar Enhancements
- [ ] Add year range selector/slider to focus on specific years
- [ ] Highlight current year column and current week row
- [ ] Make table headers sticky when scrolling
- [ ] Add calendar stats summary panel (total breaks, consecutive weeks, etc.)
- [ ] Add zoom controls for calendar cell size adjustment
- [ ] Add tooltips on red cells showing break reasons
- [ ] Add filter to show only breaks/holidays

### 🎨 Design & Components
- [ ] Create standardized Button component with variants (primary, secondary, outline, ghost)
- [ ] Add mobile hamburger menu for navigation
- [ ] Add scroll to top button for long pages
- [ ] Improve color contrast for text-gray-500 elements (accessibility)
- [ ] Add tooltips to icons and abbreviations
- [ ] Add One Piece-inspired color palette (treasure gold accents, pirate red)
- [ ] Implement consistent heading hierarchy across all pages

### ✨ Advanced Features
- [ ] Add CSV/JSON export options for tables
- [ ] Implement smooth page transitions between routes
- [ ] Add hero section with One Piece themed background to homepage
- [ ] Add animated number counters for homepage statistics
- [ ] Add interactive legends (click to toggle visibility)
- [ ] Implement ripple effects on button clicks
- [ ] Add card lift animation on hover
- [ ] Add empty states with helpful messages and actions

### ♿ Accessibility
- [ ] Ensure all interactive elements are keyboard accessible
- [ ] Add visible focus indicators for keyboard users
- [ ] Add proper ARIA labels to icon buttons and dropdowns
- [ ] Make visualizations color-blind friendly (add patterns/icons)

## 🎨 Lower Priority (UX Polish)

- [ ] Smoother overall layout
  - Improve transitions and animations
  - Polish responsive design
- [ ] Add print stylesheet for calendar
- [ ] Implement offline mode with service worker

## 📝 Notes

### Recent Commits
- `18e2a11` - Reorganize analytics into focused, modular pages
- `9b7042b` - Remove ArcLengthChart from Arcs page
- `2aed5dc` - Reorder navigation dropdown items for better hierarchy
- `9daa93f` - Convert Volumes page to table layout with chapter statistics
- `646b642` - Add Character Timeline feature to Analytics

### Completed Features
- Volume detail page with full navigation (Prev/Next/Random, Wiki link)
- Volumes table with chapter count, total pages, and chapter range
- Chapter list showing in Arc detail pages
- Expand/collapse functionality for all lists (chapters, arcs, characters)
- Volume numbers clickable in Chapter detail pages
- Color-coded expand buttons (green=chapters, purple=arcs, blue=characters)
- Reorganized navigation with Story and Media dropdowns
- Modular analytics pages (Character Stats, Character Appearances, Story & Arcs)
- Time skip Venn diagram in Character Appearances page
- Interactive Home page with clickable stat cards and feature cards
- Enhanced About page with credits, data sources, support, and feedback sections
- Character birthday calendar with month/year views, clickable character links, age display, and context menu-style popups
- Chapter Release Calendar with compact layout, 4 visualization themes, and copy-as-image functionality
