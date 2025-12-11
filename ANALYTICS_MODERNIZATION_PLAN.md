# Analytics Pages Modernization Plan

**Project:** One Piece of Data React
**Date Created:** 2025-12-11
**Status:** 📋 Planning Phase
**Goal:** Modernize all analytics pages to match the quality and design system of the recently updated detail pages

---

## 📊 Current State Analysis

### Existing Analytics Pages (5 total)
1. **AnalyticsPage.tsx** - Main hub with category cards
2. **StoryArcsAnalyticsPage.tsx** - Arc length visualizations
3. **CharacterStatsPage.tsx** - Bounties & status distribution
4. **CharacterAppearancesPage.tsx** - Character introduction patterns
5. **CharacterBirthdayPage.tsx** - Birthday calendar

### Existing Chart Components (8 total)
- `ArcLengthChart.tsx` - Stacked bar chart showing arc lengths by saga
- `TopBountiesChart.tsx` - Horizontal bar chart of highest bounties
- `CharacterStatusChart.tsx` - Status distribution visualization
- `BountyDistributionChart.tsx` - Bounty range distribution
- `CharacterAppearanceChart.tsx` - Character debuts across sagas
- `SagaAppearanceChart.tsx` - Saga-level appearance patterns
- `SagaAppearanceCountChart.tsx` - Character counts per saga
- `CharacterTimelineChart.tsx` - Timeline of character introductions

### Current Issues
- ❌ Inconsistent styling across pages
- ❌ Basic card designs (bg-white rounded-lg shadow-md)
- ❌ No consistent layout patterns
- ❌ Emoji icons instead of SVG
- ❌ Minimal interactivity
- ❌ No breadcrumb navigation
- ❌ Missing export functionality
- ❌ Inconsistent color schemes
- ❌ No loading/empty states in some components

---

## 🎯 Modernization Strategy

### Design System Goals
Apply the same modern design system used in detail pages (Character, Volume, Arc, Saga):
- ✅ Soft gradient hero sections
- ✅ Max-w-7xl container with bg-gray-50 background
- ✅ Rounded-xl cards with shadow-sm and border-gray-200
- ✅ Consistent spacing (mb-6, mb-8, gap-6)
- ✅ Modern breadcrumb navigation with SVG chevrons
- ✅ Hover effects and smooth transitions
- ✅ Mobile-first responsive design
- ✅ WCAG AA accessibility compliance

---

## 📋 Phase-by-Phase Implementation Plan

### Phase 1: Design System Foundation 🏗️

**Objective:** Create reusable components for consistent analytics design

**Tasks:**
1. Create `src/components/analytics/` folder structure
2. Build reusable components:
   - **ChartCard** - Wrapper for all charts
     ```tsx
     interface ChartCardProps {
       title: string
       description?: string
       children: React.ReactNode
       onExport?: () => void
       filters?: React.ReactNode
       className?: string
     }
     ```
   - **StatCard** - For displaying key metrics/KPIs
     ```tsx
     interface StatCardProps {
       label: string
       value: string | number
       icon?: React.ReactNode
       trend?: 'up' | 'down' | 'neutral'
       trendValue?: string
       color?: 'blue' | 'green' | 'purple' | 'amber'
     }
     ```
   - **SectionHeader** - Consistent section titles
   - **FilterButton** - Standardized filter controls
   - **ExportButton** - Download/share functionality

3. Define color palette constants:
   ```tsx
   export const ANALYTICS_COLORS = {
     characters: { from: 'blue-50', to: 'cyan-50', accent: 'blue-600' },
     appearances: { from: 'emerald-50', to: 'teal-50', accent: 'emerald-600' },
     arcs: { from: 'purple-50', to: 'indigo-50', accent: 'purple-600' },
     birthdays: { from: 'pink-50', to: 'rose-50', accent: 'pink-600' },
     releases: { from: 'yellow-50', to: 'amber-50', accent: 'yellow-600' }
   }
   ```

**Deliverables:**
- [ ] ChartCard component with tests
- [ ] StatCard component with tests
- [ ] SectionHeader component
- [ ] FilterButton component
- [ ] ExportButton component
- [ ] Color palette constants
- [ ] Analytics components documentation

**Estimated Time:** 2-3 hours

---

### Phase 2: Analytics Hub (AnalyticsPage.tsx) 🎯

**Current State:**
- Simple grid of category cards with emojis
- Basic "Analytics Dashboard" title
- Minimal description text

**Modernization Plan:**

#### 2.1 Hero Section
```tsx
<div className="relative mb-8 overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-60"></div>
  <Card className="relative border-2 border-purple-100">
    <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
      Analytics Dashboard
    </h1>
    <p className="text-xl text-gray-700">Explore visual insights from the One Piece universe</p>
  </Card>
</div>
```

#### 2.2 Quick Stats Row
```tsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
  <StatCard label="Total Characters" value={stats.totalCharacters} icon={<UsersIcon />} />
  <StatCard label="Story Arcs" value={stats.totalArcs} icon={<BookIcon />} />
  <StatCard label="Total Chapters" value={stats.totalChapters} icon={<DocumentIcon />} />
  <StatCard label="Active Characters" value={stats.activeCharacters} icon={<HeartIcon />} />
</div>
```

#### 2.3 Enhanced Category Cards
Replace emojis with SVG icons from Heroicons/FontAwesome:
- Character Statistics → `<ChartBarIcon />`
- Character Appearances → `<UserGroupIcon />`
- Story & Arc Analytics → `<BookOpenIcon />`
- Birthday Calendar → `<CakeIcon />`
- Chapter Release Calendar → `<CalendarIcon />`

Add hover effects, mini preview charts, and gradient backgrounds per category.

#### 2.4 Recent Activity Section
- Last updated timestamp
- Recently added characters
- Latest arc completion
- Upcoming birthdays preview

**Deliverables:**
- [ ] Modernized hero section
- [ ] Quick stats integration
- [ ] Enhanced category cards with SVG icons
- [ ] Recent activity panel
- [ ] Breadcrumb navigation
- [ ] Mobile responsive layout

**Estimated Time:** 2-3 hours

---

### Phase 3: Story Arcs Analytics Page 📖

**Theme:** Purple/Indigo gradient

**Modernization Plan:**

#### 3.1 Page Structure
```tsx
<main className="min-h-screen bg-gray-50">
  <div className="max-w-7xl mx-auto px-6 py-8">
    {/* Breadcrumb */}
    {/* Hero Section */}
    {/* Quick Stats Row */}
    {/* Main Chart */}
    {/* Additional Visualizations */}
    {/* Insights Panel */}
  </div>
</main>
```

#### 3.2 Quick Stats
- Total Arcs
- Longest Arc (name + chapter count)
- Average Arc Length
- Paradise vs New World Split

#### 3.3 Main Chart Enhancements
**ArcLengthChart improvements:**
- Wrap in ChartCard with title and description
- Add export button (PNG, CSV)
- Add view toggle: Stacked vs Grouped bars
- Add era filter: All | Paradise | New World
- Improve tooltip styling
- Add click-through to arc detail pages

#### 3.4 Additional Visualizations
- **Arc Timeline** - Chronological horizontal bar chart
- **Top 5 Longest Arcs** - Simple list with chapter counts
- **Saga Comparison** - Average arc length per saga

#### 3.5 Insights Panel
```tsx
<Card className="bg-purple-50 border-purple-200">
  <h3>Key Insights</h3>
  <ul>
    <li>🔍 The {longestArc} is the longest arc with {chapters} chapters</li>
    <li>📊 Average arc length: {avgLength} chapters</li>
    <li>🌊 Paradise Era: {paradiseArcs} arcs</li>
    <li>🌍 New World Era: {newWorldArcs} arcs</li>
  </ul>
</Card>
```

**Deliverables:**
- [ ] Hero section with gradient
- [ ] Quick stats cards
- [ ] Enhanced ArcLengthChart
- [ ] Arc timeline visualization
- [ ] Top 5 longest arcs list
- [ ] Insights panel
- [ ] Export functionality
- [ ] Era filters

**Estimated Time:** 3-4 hours

---

### Phase 4: Character Stats Page 👥

**Theme:** Blue/Cyan gradient

**Modernization Plan:**

#### 4.1 KPI Cards Row
```tsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
  <StatCard label="Total Characters" value={stats.total} color="blue" />
  <StatCard label="Average Bounty" value={formatBounty(stats.avgBounty)} color="blue" />
  <StatCard label="Living Characters" value={stats.alive} color="green" />
  <StatCard label="Devil Fruit Users" value={stats.fruitUsers} color="purple" />
</div>
```

#### 4.2 Chart Grid Layout
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <ChartCard title="Top 10 Highest Bounties" onExport={handleExport}>
    <TopBountiesChart dataAll={...} dataAlive={...} />
  </ChartCard>

  <ChartCard title="Bounty Distribution" onExport={handleExport}>
    <BountyDistributionChart data={...} />
  </ChartCard>

  <ChartCard title="Character Status" onExport={handleExport}>
    <CharacterStatusChart data={...} />
  </ChartCard>

  <ChartCard title="Status Distribution" onExport={handleExport}>
    <DonutChart data={...} />
  </ChartCard>
</div>
```

#### 4.3 Advanced Filters
```tsx
<div className="flex flex-wrap gap-2 mb-6">
  <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterButton>
  <FilterButton active={filter === 'pirates'} onClick={() => setFilter('pirates')}>Pirates</FilterButton>
  <FilterButton active={filter === 'marines'} onClick={() => setFilter('marines')}>Marines</FilterButton>
  <FilterButton active={filter === 'fruit-users'} onClick={() => setFilter('fruit-users')}>Devil Fruit Users</FilterButton>
</div>
```

#### 4.4 Interactive Elements
- Click on chart bar → Navigate to character detail page
- Hover shows detailed tooltip with character info
- Export individual charts or entire page

**Deliverables:**
- [ ] Hero section with gradient
- [ ] KPI cards row
- [ ] Enhanced TopBountiesChart
- [ ] Enhanced BountyDistributionChart
- [ ] Enhanced CharacterStatusChart
- [ ] New status distribution donut chart
- [ ] Filter system
- [ ] Click-through navigation
- [ ] Export functionality

**Estimated Time:** 4-5 hours

---

### Phase 5: Character Appearances Page 📊

**Theme:** Emerald/Teal gradient

**Modernization Plan:**

#### 5.1 Stats Row
```tsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
  <StatCard label="Characters per Saga" value={stats.avgPerSaga} />
  <StatCard label="Debut Rate" value={`${stats.debutRate}/saga`} />
  <StatCard label="Most Active Saga" value={stats.mostActiveSaga} />
  <StatCard label="Latest Debut" value={stats.latestDebut} />
</div>
```

#### 5.2 Chart Sections
```tsx
<ChartCard title="Character Appearances by Saga">
  <SagaAppearanceChart data={...} />
</ChartCard>

<ChartCard title="Character Count per Saga">
  <SagaAppearanceCountChart data={...} />
</ChartCard>

<ChartCard title="Character Debut Timeline">
  <CharacterTimelineChart data={...} />
</ChartCard>
```

#### 5.3 Era Comparison
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <Card>
    <h3>Paradise Era</h3>
    <p>Characters introduced: {paradiseCount}</p>
    <p>Arcs: {paradiseArcs}</p>
  </Card>
  <Card>
    <h3>New World Era</h3>
    <p>Characters introduced: {newWorldCount}</p>
    <p>Arcs: {newWorldArcs}</p>
  </Card>
</div>
```

#### 5.4 Featured Debuts Section
```tsx
<Card className="bg-emerald-50">
  <h3>Featured Character Debuts</h3>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <FeatureCard title="Straw Hat Pirates" characters={strawHats} />
    <FeatureCard title="Yonko" characters={yonko} />
    <FeatureCard title="Warlords" characters={warlords} />
  </div>
</Card>
```

**Deliverables:**
- [ ] Hero section with gradient
- [ ] Stats row
- [ ] Enhanced appearance charts
- [ ] Era comparison section
- [ ] Featured debuts section
- [ ] Export functionality

**Estimated Time:** 3-4 hours

---

### Phase 6: Birthday Calendar Page 🎂

**Theme:** Pink/Rose gradient

**Modernization Plan:**

#### 6.1 Hero Section
```tsx
<div className="relative mb-8">
  <Card className="border-2 border-pink-100 bg-gradient-to-br from-pink-50 to-rose-50">
    <h1>Character Birthday Calendar</h1>
    <p>Celebrate One Piece character birthdays throughout the year</p>
  </Card>
</div>
```

#### 6.2 Month Navigation
```tsx
<div className="flex items-center justify-between mb-6">
  <button onClick={prevMonth}>← Previous</button>
  <h2 className="text-2xl font-bold">{currentMonth} {year}</h2>
  <button onClick={nextMonth}>Next →</button>
</div>

<div className="flex gap-2 mb-6 overflow-x-auto">
  {months.map(month => (
    <button
      key={month}
      onClick={() => setCurrentMonth(month)}
      className={currentMonth === month ? 'active' : ''}
    >
      {month}
    </button>
  ))}
</div>
```

#### 6.3 Calendar Grid
```tsx
<Card>
  <div className="grid grid-cols-7 gap-2">
    {/* Day headers */}
    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
      <div key={day} className="text-center font-semibold">{day}</div>
    ))}

    {/* Calendar days */}
    {calendarDays.map(day => (
      <div
        key={day.date}
        className={`
          p-2 border rounded-lg
          ${day.hasBirthday ? 'bg-pink-50 border-pink-300' : 'bg-white'}
          ${day.isToday ? 'ring-2 ring-pink-500' : ''}
        `}
      >
        <div className="text-sm">{day.date}</div>
        {day.characters.map(char => (
          <Link
            to={`/characters/${char.id}`}
            className="text-xs truncate block hover:underline"
          >
            {char.name}
          </Link>
        ))}
      </div>
    ))}
  </div>
</Card>
```

#### 6.4 Sidebar Sections
```tsx
<div className="space-y-6">
  {/* Today's Birthdays */}
  <Card className="bg-pink-50">
    <h3>🎉 Today's Birthdays</h3>
    {todaysBirthdays.map(char => (
      <CharacterBirthdayCard key={char.id} character={char} />
    ))}
  </Card>

  {/* Upcoming Birthdays */}
  <Card>
    <h3>📅 Upcoming (Next 7 Days)</h3>
    {upcomingBirthdays.map(char => (
      <CharacterBirthdayCard key={char.id} character={char} />
    ))}
  </Card>

  {/* Zodiac Distribution */}
  <Card>
    <h3>♈ Zodiac Distribution</h3>
    <ZodiacChart data={zodiacData} />
  </Card>
</div>
```

**Deliverables:**
- [ ] Hero section with gradient
- [ ] Month navigation
- [ ] Interactive calendar grid
- [ ] Today's birthdays card
- [ ] Upcoming birthdays list
- [ ] Zodiac distribution chart
- [ ] Character birthday cards
- [ ] Mobile responsive layout

**Estimated Time:** 4-5 hours

---

### Phase 7: Chart Component Enhancements ✨

**Apply to ALL chart components:**

#### 7.1 Export Functionality
```tsx
const handleExportPNG = () => {
  // Use html2canvas or similar
  const chartElement = chartRef.current
  html2canvas(chartElement).then(canvas => {
    canvas.toBlob(blob => {
      saveAs(blob, `${chartTitle}.png`)
    })
  })
}

const handleExportCSV = () => {
  const csv = convertDataToCSV(chartData)
  const blob = new Blob([csv], { type: 'text/csv' })
  saveAs(blob, `${chartTitle}.csv`)
}
```

#### 7.2 Loading States
```tsx
{isLoading && (
  <div className="animate-pulse space-y-4">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-64 bg-gray-200 rounded"></div>
  </div>
)}
```

#### 7.3 Empty States
```tsx
{data.length === 0 && (
  <div className="flex flex-col items-center justify-center py-12">
    <EmptyChartIcon className="w-16 h-16 text-gray-300 mb-4" />
    <p className="text-gray-500">No data available</p>
    <button className="mt-4 text-blue-600">Refresh Data</button>
  </div>
)}
```

#### 7.4 Enhanced Tooltips
```tsx
<Tooltip
  content={({ active, payload }) => {
    if (!active || !payload) return null
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
        <p className="font-semibold">{payload[0].payload.name}</p>
        <p className="text-sm text-gray-600">{payload[0].value}</p>
        <button className="text-xs text-blue-600 mt-1">View Details →</button>
      </div>
    )
  }}
/>
```

#### 7.5 Interactive Legends
```tsx
const [hiddenSeries, setHiddenSeries] = useState<string[]>([])

const toggleSeries = (dataKey: string) => {
  setHiddenSeries(prev =>
    prev.includes(dataKey)
      ? prev.filter(key => key !== dataKey)
      : [...prev, dataKey]
  )
}

// In chart:
{!hiddenSeries.includes('seriesName') && (
  <Bar dataKey="seriesName" fill="..." />
)}
```

#### 7.6 Color Palette Standardization
```tsx
export const CHART_COLORS = {
  primary: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
  status: {
    alive: '#10b981',
    deceased: '#6b7280',
    unknown: '#d1d5db'
  },
  bounty: {
    high: '#dc2626',
    medium: '#ea580c',
    low: '#f59e0b'
  },
  era: {
    paradise: '#3b82f6',
    newWorld: '#8b5cf6'
  }
}
```

#### 7.7 Responsive Design
```tsx
// Mobile-optimized chart
<ResponsiveContainer width="100%" height={isMobile ? 300 : 450}>
  <BarChart data={data} layout={isMobile ? 'vertical' : 'horizontal'}>
    {/* ... */}
  </BarChart>
</ResponsiveContainer>
```

#### 7.8 Entrance Animations
```tsx
// Add to chart components
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  <BarChart>
    <Bar animationDuration={800} />
  </BarChart>
</motion.div>
```

**Deliverables:**
- [ ] Export functionality (PNG, CSV) for all charts
- [ ] Loading skeleton states
- [ ] Empty states with illustrations
- [ ] Enhanced rich tooltips
- [ ] Interactive clickable legends
- [ ] Standardized color palette
- [ ] Mobile responsive optimizations
- [ ] Subtle entrance animations

**Estimated Time:** 5-6 hours

---

### Phase 8: Shared Features Across All Pages 🔧

**Add to EVERY analytics page:**

#### 8.1 Breadcrumb Navigation
```tsx
<nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
  <Link to="/" className="hover:text-gray-900">Home</Link>
  <ChevronRightIcon className="w-4 h-4" />
  <Link to="/analytics" className="hover:text-gray-900">Analytics</Link>
  <ChevronRightIcon className="w-4 h-4" />
  <span className="text-gray-900 font-medium">{pageTitle}</span>
</nav>
```

#### 8.2 Action Buttons Row
```tsx
<div className="flex items-center gap-2 mb-6">
  <button onClick={() => navigate('/analytics')} className="...">
    <ArrowLeftIcon /> Back
  </button>

  <div className="ml-auto flex items-center gap-2">
    <button onClick={handleRefresh} className="...">
      <RefreshIcon /> Refresh
    </button>
    <button onClick={handleShare} className="...">
      <ShareIcon /> Share
    </button>
  </div>
</div>
```

#### 8.3 Last Updated Timestamp
```tsx
<div className="text-sm text-gray-500 mb-4">
  Last updated: {formatDistance(lastUpdated, new Date(), { addSuffix: true })}
</div>
```

#### 8.4 Data Source Badge
```tsx
<div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
  <DatabaseIcon className="w-3 h-3" />
  Data from Supabase
</div>
```

#### 8.5 Refresh Data Functionality
```tsx
const handleRefresh = async () => {
  setIsRefreshing(true)
  await queryClient.invalidateQueries(['analytics'])
  setIsRefreshing(false)
  toast.success('Data refreshed!')
}
```

#### 8.6 Share Functionality
```tsx
const handleShare = async () => {
  const url = window.location.href
  if (navigator.share) {
    await navigator.share({
      title: pageTitle,
      text: pageDescription,
      url: url
    })
  } else {
    await navigator.clipboard.writeText(url)
    toast.success('Link copied!')
  }
}
```

#### 8.7 Mobile Optimization
```tsx
// Stack layout on mobile
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Charts stack vertically on mobile, side-by-side on desktop */}
</div>

// Horizontal scroll for filters on mobile
<div className="overflow-x-auto">
  <div className="flex gap-2 min-w-max">
    {filters.map(filter => <FilterButton key={filter} />)}
  </div>
</div>
```

**Deliverables:**
- [ ] Breadcrumb navigation on all pages
- [ ] Back button to Analytics hub
- [ ] Share button with fallback to clipboard
- [ ] Last updated timestamps
- [ ] Data source badges
- [ ] Refresh data functionality
- [ ] Mobile responsive optimizations
- [ ] Toast notifications for actions

**Estimated Time:** 3-4 hours

---

## 🎨 Design Specifications

### Color Themes by Page
```css
/* Character Stats */
.theme-characters {
  --gradient-from: rgb(239 246 255); /* blue-50 */
  --gradient-to: rgb(207 250 254);   /* cyan-50 */
  --accent: rgb(37 99 235);          /* blue-600 */
}

/* Character Appearances */
.theme-appearances {
  --gradient-from: rgb(236 253 245); /* emerald-50 */
  --gradient-to: rgb(240 253 250);   /* teal-50 */
  --accent: rgb(5 150 105);          /* emerald-600 */
}

/* Story Arcs */
.theme-arcs {
  --gradient-from: rgb(250 245 255); /* purple-50 */
  --gradient-to: rgb(238 242 255);   /* indigo-50 */
  --accent: rgb(147 51 234);         /* purple-600 */
}

/* Birthday Calendar */
.theme-birthdays {
  --gradient-from: rgb(253 242 248); /* pink-50 */
  --gradient-to: rgb(255 241 242);   /* rose-50 */
  --accent: rgb(219 39 119);         /* pink-600 */
}

/* Chapter Releases */
.theme-releases {
  --gradient-from: rgb(254 252 232); /* yellow-50 */
  --gradient-to: rgb(254 243 199);   /* amber-50 */
  --accent: rgb(217 119 6);          /* yellow-600 */
}
```

### Typography Scale
```css
.title-xl { font-size: 3rem; font-weight: 700; } /* 48px */
.title-lg { font-size: 2.25rem; font-weight: 700; } /* 36px */
.title-md { font-size: 1.875rem; font-weight: 600; } /* 30px */
.title-sm { font-size: 1.5rem; font-weight: 600; } /* 24px */
.body-lg { font-size: 1.125rem; } /* 18px */
.body-md { font-size: 1rem; } /* 16px */
.body-sm { font-size: 0.875rem; } /* 14px */
.body-xs { font-size: 0.75rem; } /* 12px */
```

### Spacing System
```css
gap-2: 0.5rem   /* 8px */
gap-4: 1rem     /* 16px */
gap-6: 1.5rem   /* 24px */
gap-8: 2rem     /* 32px */

mb-4: 1rem      /* 16px */
mb-6: 1.5rem    /* 24px */
mb-8: 2rem      /* 32px */
mb-12: 3rem     /* 48px */
```

### Component Dimensions
```css
/* Cards */
.card { border-radius: 0.75rem; } /* 12px */
.card-lg { padding: 1.5rem; }     /* 24px */
.card-md { padding: 1rem; }       /* 16px */

/* Buttons */
.btn { padding: 0.5rem 1rem; border-radius: 0.5rem; }
.btn-sm { padding: 0.25rem 0.75rem; font-size: 0.875rem; }
.btn-lg { padding: 0.75rem 1.5rem; font-size: 1.125rem; }

/* Charts */
.chart-height-sm { height: 300px; }
.chart-height-md { height: 400px; }
.chart-height-lg { height: 500px; }
```

---

## 🧪 Testing Checklist

### Functionality Testing
- [ ] All charts render correctly with real data
- [ ] Export functions work (PNG, CSV)
- [ ] Filters update charts properly
- [ ] Click-through navigation works
- [ ] Share functionality works
- [ ] Refresh data works
- [ ] Loading states display correctly
- [ ] Empty states display correctly
- [ ] Tooltips are informative and styled
- [ ] Legends are interactive

### Responsive Testing
- [ ] Desktop (1920x1080)
- [ ] Laptop (1440x900)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] Charts resize properly
- [ ] Filters scroll horizontally on mobile
- [ ] Navigation is accessible on all screens

### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast ratio ≥ 4.5:1
- [ ] Screen reader compatible
- [ ] ARIA labels present
- [ ] Alt text on images/icons
- [ ] No keyboard traps

### Performance Testing
- [ ] Page load time < 2 seconds
- [ ] Chart render time < 500ms
- [ ] No memory leaks
- [ ] Smooth animations (60fps)
- [ ] Lazy load charts if needed

### Browser Testing
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## 📦 Dependencies

### Required Packages
```json
{
  "dependencies": {
    "recharts": "^2.x.x",
    "framer-motion": "^10.x.x",
    "html2canvas": "^1.x.x",
    "file-saver": "^2.x.x",
    "date-fns": "^2.x.x",
    "react-hot-toast": "^2.x.x"
  }
}
```

### Installation
```bash
npm install recharts framer-motion html2canvas file-saver date-fns react-hot-toast
```

---

## 🚀 Implementation Timeline

| Phase | Tasks | Estimated Time | Priority |
|-------|-------|----------------|----------|
| Phase 1 | Foundation components | 2-3 hours | Critical |
| Phase 2 | Analytics Hub | 2-3 hours | High |
| Phase 3 | Story Arcs page | 3-4 hours | High |
| Phase 4 | Character Stats page | 4-5 hours | High |
| Phase 5 | Character Appearances page | 3-4 hours | Medium |
| Phase 6 | Birthday Calendar page | 4-5 hours | Medium |
| Phase 7 | Chart enhancements | 5-6 hours | High |
| Phase 8 | Shared features | 3-4 hours | Medium |

**Total Estimated Time:** 26-34 hours

**Recommended Schedule:**
- Week 1: Phases 1-2 (Foundation + Analytics Hub)
- Week 2: Phases 3-4 (Story Arcs + Character Stats)
- Week 3: Phases 5-6 (Character Appearances + Birthday Calendar)
- Week 4: Phases 7-8 (Chart enhancements + Shared features) + Testing

---

## ✅ Success Criteria

### User Experience
- ✅ All analytics pages have consistent modern design
- ✅ Navigation between pages is intuitive
- ✅ Charts load quickly and smoothly
- ✅ Mobile experience is excellent
- ✅ Interactive elements are discoverable

### Technical
- ✅ Code is DRY with reusable components
- ✅ TypeScript types are comprehensive
- ✅ Performance metrics are met
- ✅ Accessibility standards achieved
- ✅ No console errors or warnings

### Visual
- ✅ Design matches detail pages quality
- ✅ Color schemes are consistent per theme
- ✅ Typography is clear and hierarchical
- ✅ Spacing is consistent
- ✅ Animations are subtle and smooth

---

## 📝 Notes for AI Agents

### Context
- This project uses React 18+ with TypeScript
- Styling is done with TailwindCSS v3
- Charts use Recharts library
- Data is fetched from Supabase via React Query
- Routing uses React Router v6 with HashRouter
- Recently modernized detail pages serve as design reference

### Important Patterns
1. **Always use max-w-7xl container:** `<div className="max-w-7xl mx-auto px-6 py-8">`
2. **Card wrapper pattern:** `<Card className="rounded-xl shadow-sm border border-gray-200 p-6">`
3. **Breadcrumb chevrons:** Use SVG chevrons, not emoji or text
4. **Gradient themes:** Each page has unique gradient colors
5. **Mobile-first:** All layouts should stack on mobile

### Files to Reference
- `/src/pages/CharacterDetailPage.tsx` - Modern detail page example
- `/src/pages/AnalyticsPage.tsx` - Current analytics hub
- `/src/components/ArcLengthChart.tsx` - Example chart component

### Common Pitfalls to Avoid
- ❌ Don't use emoji icons (use SVG/FontAwesome)
- ❌ Don't use old card styles (bg-white rounded-lg shadow-md)
- ❌ Don't forget breadcrumb navigation
- ❌ Don't skip loading/empty states
- ❌ Don't hardcode colors (use theme variables)

---

## 📚 Additional Resources

### Design Inspiration
- Detail pages in this project (Character, Volume, Arc, Saga)
- Vercel Analytics Dashboard
- Linear App
- Notion Database Views

### Component Libraries
- [Recharts Documentation](https://recharts.org/)
- [TailwindCSS Components](https://tailwindui.com/)
- [Headless UI](https://headlessui.com/)
- [Heroicons](https://heroicons.com/)

### Accessibility Guidelines
- [WCAG 2.1 Level AA](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Accessibility](https://reactjs.org/docs/accessibility.html)
- [Chart Accessibility](https://www.w3.org/WAI/tutorials/charts/)

---

**Last Updated:** 2025-12-11
**Version:** 1.0
**Status:** Ready for implementation

---

## Quick Start for AI Agents

To begin implementation:

1. **Read this entire document** to understand the scope
2. **Start with Phase 1** - Create foundation components first
3. **Reference existing detail pages** for design consistency
4. **Test incrementally** - Don't wait until the end
5. **Update this document** as you complete phases
6. **Ask clarifying questions** if requirements are unclear

Good luck! 🚀
