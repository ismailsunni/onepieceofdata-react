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
  - Interactive full-year calendar showing character birthdays
  - Color-coded dates based on birthday count (1-4+ characters)
  - Hover tooltips displaying character names
  - Month navigation for exploring different months
  - Statistics cards showing total birthdays, unique dates, and busiest day
  - Added to Analytics dashboard with cake emoji icon

## 🔄 High Priority

- [ ] None currently

## 📊 Medium Priority (Data Visualization)

- [ ] Calendar view of chapter release vs Jump issue
- [ ] Chapter release prediction feature
- [ ] Character timeline comparison
- [x] Character birthday calendar
- [ ] Character comparison tool
- [ ] Fix Character Timeline bugs (currently hidden from navigation)

## 🎨 Lower Priority (UX Polish)

- [ ] Smoother overall layout
  - Improve transitions and animations
  - Polish responsive design

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
- Character birthday calendar with interactive monthly view and hover tooltips
