import { useQuery } from '@tanstack/react-query'
import { fetchChapterReleases, ChapterRelease } from '../services/analyticsService'
import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { StatCard, FilterButton } from '../components/analytics'
import { ChartCard } from '../components/common/ChartCard'

// Color palette for sagas (matching SagaAppearanceChart)
const SAGA_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
  '#14b8a6', // teal-500
]

// Color palette for arcs
const ARC_COLORS = [
  '#60a5fa', // blue-400
  '#34d399', // green-400
  '#fbbf24', // amber-400
  '#f87171', // red-400
  '#a78bfa', // violet-400
  '#f472b6', // pink-400
  '#22d3ee', // cyan-400
  '#a3e635', // lime-400
  '#fb923c', // orange-400
  '#818cf8', // indigo-400
  '#2dd4bf', // teal-400
  '#fb7185', // rose-400
  '#c084fc', // purple-400
  '#facc15', // yellow-400
]

type VisualizationTheme = 'jump' | 'saga' | 'arc' | 'luffy'

interface JumpIssue {
  jump: string
  chapters: ChapterRelease[]
  isDouble: boolean
  issueEnd: number | null // For merged cells in double issues
}

interface YearData {
  year: number
  issues: Map<number, JumpIssue>
  doubleIssueSpans: Set<number> // Track which issue numbers are part of a double issue span
}

// Helper function to get cell background color based on theme
// Returns hex color for html2canvas compatibility
function getCellColor(
  chapters: ChapterRelease[],
  theme: VisualizationTheme,
  sagaColorMap: Map<string, string>,
  arcColorMap: Map<string, string>
): string {
  if (chapters.length === 0) return '#fca5a5' // red-300

  const firstChapter = chapters[0]

  switch (theme) {
    case 'jump':
      return '#22c55e' // green-500

    case 'saga':
      if (firstChapter.sagaId && sagaColorMap.has(firstChapter.sagaId)) {
        return sagaColorMap.get(firstChapter.sagaId)!
      }
      return '#9ca3af' // gray-400

    case 'arc':
      if (firstChapter.arcId && arcColorMap.has(firstChapter.arcId)) {
        return arcColorMap.get(firstChapter.arcId)!
      }
      return '#9ca3af' // gray-400

    case 'luffy':
      // Check if Luffy appears in any of the chapters
      const luffyAppears = chapters.some((ch) => ch.luffyAppears)
      return luffyAppears ? '#fbbf24' : '#d1d5db' // yellow-400 : gray-300

    default:
      return '#22c55e' // green-500
  }
}

function ChapterReleaseCalendarPage() {
  const [theme, setTheme] = useState<VisualizationTheme>('jump')
  const [isCompact, setIsCompact] = useState(false)

  const { data: releases, isLoading, error } = useQuery<ChapterRelease[]>({
    queryKey: ['analytics', 'chapter-releases'],
    queryFn: fetchChapterReleases,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Group chapters by year and Jump issue
  const yearData = useMemo(() => {
    if (!releases) return []

    const yearMap = new Map<number, Map<number, ChapterRelease[]>>()

    // Group by year and issue number
    releases.forEach((release) => {
      if (!release.year || release.issue === null) return

      if (!yearMap.has(release.year)) {
        yearMap.set(release.year, new Map())
      }

      const issueMap = yearMap.get(release.year)!
      if (!issueMap.has(release.issue)) {
        issueMap.set(release.issue, [])
      }

      issueMap.get(release.issue)!.push(release)
    })

    // Convert to array and sort
    const years: YearData[] = []
    const sortedYears = Array.from(yearMap.keys()).sort()

    sortedYears.forEach((year) => {
      const issueMap = yearMap.get(year)!
      const issues = new Map<number, JumpIssue>()
      const doubleIssueSpans = new Set<number>()

      // Sort issues by number
      const sortedIssues = Array.from(issueMap.keys()).sort((a, b) => a - b)

      sortedIssues.forEach((issueNum) => {
        const issueReleases = issueMap.get(issueNum)!
        const firstRelease = issueReleases[0]
        const jumpIssue = firstRelease.jump!
        const issueEnd = firstRelease.issueEnd
        const isDouble = issueEnd !== null

        // If it's a double issue, mark the spanned issues
        if (isDouble && issueEnd) {
          for (let i = issueNum + 1; i <= issueEnd; i++) {
            doubleIssueSpans.add(i)
          }
        }

        issues.set(issueNum, {
          jump: jumpIssue,
          chapters: issueReleases,
          isDouble,
          issueEnd,
        })
      })

      years.push({ year, issues, doubleIssueSpans })
    })

    return years
  }, [releases])

  // Create color maps for sagas and arcs
  const { sagaColorMap, arcColorMap } = useMemo(() => {
    if (!releases) return { sagaColorMap: new Map(), arcColorMap: new Map() }

    // Get unique sagas and arcs in order of first appearance
    const uniqueSagas = new Map<string, string>()
    const uniqueArcs = new Map<string, string>()

    releases.forEach((release) => {
      if (release.sagaId && release.sagaTitle && !uniqueSagas.has(release.sagaId)) {
        uniqueSagas.set(release.sagaId, release.sagaTitle)
      }
      if (release.arcId && release.arcTitle && !uniqueArcs.has(release.arcId)) {
        uniqueArcs.set(release.arcId, release.arcTitle)
      }
    })

    // Assign colors to sagas
    const sagaMap = new Map<string, string>()
    Array.from(uniqueSagas.keys()).forEach((sagaId, index) => {
      sagaMap.set(sagaId, SAGA_COLORS[index % SAGA_COLORS.length])
    })

    // Assign colors to arcs
    const arcMap = new Map<string, string>()
    Array.from(uniqueArcs.keys()).forEach((arcId, index) => {
      arcMap.set(arcId, ARC_COLORS[index % ARC_COLORS.length])
    })

    return { sagaColorMap: sagaMap, arcColorMap: arcMap }
  }, [releases])

  // Get all unique issue numbers across all years for the y-axis
  const allIssues = useMemo(() => {
    const issues = new Set<number>()
    yearData.forEach((yearData) => {
      yearData.issues.forEach((_, issue) => issues.add(issue))
    })
    return Array.from(issues).sort((a, b) => a - b)
  }, [yearData])



  // Calculate quick stats
  const stats = useMemo(() => {
    if (!releases) return {
      totalBreaks: 0,
      yearsCount: 0,
      longestStreak: 0,
      longestStreakInfo: null,
      uninterruptedBreaks: 0,
      breakChapters: []
    }

    // Calculate total breaks (any week without One Piece, excluding issue 53)
    // Calculate uninterrupted breaks (3+ consecutive weeks without One Piece)
    // - Ignore issue 53 (no One Piece published)
    // - Double issues count as covering 2 weeks, so no break
    let totalBreaksCount = 0
    let uninterruptedBreaksCount = 0
    const breakChapters: Array<{
      fromChapter: number,
      toChapter: number,
      fromJump: string,
      toJump: string,
      weeksBreak: number
    }> = []

    // Track longest streak without break
    let currentStreak = 0
    let currentStreakStart = 0
    let longestStreak = 0
    let longestStreakStart = 0
    let longestStreakEnd = 0

    const sortedReleases = [...releases].sort((a, b) => a.number - b.number)

    // Initialize streak with first chapter
    if (sortedReleases.length > 0) {
      currentStreak = 1
      currentStreakStart = 0
      longestStreak = 1
      longestStreakStart = 0
      longestStreakEnd = 0
    }

    for (let i = 1; i < sortedReleases.length; i++) {
      const current = sortedReleases[i]
      const previous = sortedReleases[i - 1]

      if (current.year && previous.year && current.issue !== null && previous.issue !== null) {
        let weeksBetween = 0

        if (current.year === previous.year) {
          // Calculate weeks in same year
          weeksBetween = current.issue - previous.issue

          // Adjust for double issues
          if (previous.issueEnd !== null && previous.issueEnd > previous.issue) {
            // Previous was a double issue, it already covered extra weeks
            weeksBetween -= (previous.issueEnd - previous.issue)
          }

          // Subtract 1 for the expected next issue
          weeksBetween -= 1

          // Check if there's an issue 53 in between and subtract it
          if (previous.issue < 53 && current.issue > 53) {
            weeksBetween -= 1
          }
        } else if (current.year === previous.year + 1) {
          // Year transition
          weeksBetween = (52 - previous.issue) + current.issue

          // Adjust for double issues
          if (previous.issueEnd !== null && previous.issueEnd > previous.issue) {
            weeksBetween -= (previous.issueEnd - previous.issue)
          }

          // Subtract 1 for expected next issue
          weeksBetween -= 1

          // Issue 53 is always excluded
          weeksBetween -= 1
        }

        // Count total breaks (any gap)
        if (weeksBetween > 0) {
          totalBreaksCount += weeksBetween
        }

        // Track streaks (any break of 1+ week resets the streak)
        if (weeksBetween < 1) {
          // No break, continue streak
          currentStreak++
          if (currentStreak > longestStreak) {
            longestStreak = currentStreak
            longestStreakStart = currentStreakStart
            longestStreakEnd = i
          }
        } else {
          // Break detected (1+ weeks), reset streak
          currentStreak = 1
          currentStreakStart = i
        }

        // Count if there were 3 or more weeks without a chapter
        if (weeksBetween >= 3) {
          uninterruptedBreaksCount++
          breakChapters.push({
            fromChapter: previous.number,
            toChapter: current.number,
            fromJump: previous.jump || `${previous.year}-${previous.issue}`,
            toJump: current.jump || `${current.year}-${current.issue}`,
            weeksBreak: weeksBetween
          })
        }
      }
    }

    const longestStreakInfo = longestStreak > 0 ? {
      chapters: longestStreak,
      fromChapter: sortedReleases[longestStreakStart].number,
      toChapter: sortedReleases[longestStreakEnd].number
    } : null

    return {
      totalBreaks: totalBreaksCount,
      yearsCount: yearData.length,
      longestStreak,
      longestStreakInfo,
      uninterruptedBreaks: uninterruptedBreaksCount,
      breakChapters
    }
  }, [releases, yearData.length, allIssues.length])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600"></div>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-red-600">
            <p>Error loading chapter release data. Please try again later.</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Section */}
        <div className="relative mb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 opacity-60 rounded-2xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-yellow-600">
                  Chapter Release Calendar
                </h1>
                <p className="text-gray-600 text-lg mt-2">
                  Visualize chapter releases by year and Weekly Shonen Jump issue
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            label="Years Covered"
            value={stats.yearsCount}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            color="blue"
            loading={isLoading}
          />
          <StatCard
            label="Longest Streak Without Break"
            value={`${stats.longestStreak} ch`}
            subtitle={stats.longestStreakInfo ? `Ch. ${stats.longestStreakInfo.fromChapter}-${stats.longestStreakInfo.toChapter}` : undefined}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            }
            color="purple"
            loading={isLoading}
          />
          <StatCard
            label="Total Breaks (weeks)"
            value={stats.totalBreaks}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            color="amber"
            loading={isLoading}
          />
          <StatCard
            label="Long Breaks (3+ weeks)"
            value={stats.uninterruptedBreaks}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            color="green"
            loading={isLoading}
            details={stats.breakChapters.map(
              b => `Chapter ${b.fromChapter} to ${b.toChapter} (${b.weeksBreak} weeks break)`
            )}
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Theme Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Color Theme:</label>
              <div className="flex flex-wrap gap-2">
                <FilterButton
                  active={theme === 'jump'}
                  onClick={() => setTheme('jump')}
                >
                  Jump Issue
                </FilterButton>
                <FilterButton
                  active={theme === 'saga'}
                  onClick={() => setTheme('saga')}
                >
                  Saga
                </FilterButton>
                <FilterButton
                  active={theme === 'arc'}
                  onClick={() => setTheme('arc')}
                >
                  Arc
                </FilterButton>
                <FilterButton
                  active={theme === 'luffy'}
                  onClick={() => setTheme('luffy')}
                >
                  Luffy
                </FilterButton>
              </div>
            </div>

            {/* Display Mode */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Display Mode:</label>
              <div className="flex gap-2">
                <FilterButton
                  active={!isCompact}
                  onClick={() => setIsCompact(false)}
                >
                  Detail
                </FilterButton>
                <FilterButton
                  active={isCompact}
                  onClick={() => setIsCompact(true)}
                >
                  Compact
                </FilterButton>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Card */}
        <ChartCard
          title="Calendar Visualization"
          downloadFileName={`one-piece-calendar-${theme}`}
        >
          {/* Legend */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Legend:</h3>

            {theme === 'jump' && (
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: '#22c55e', border: '1px solid #d1d5db' }}
                  ></div>
                  <span className="text-sm" style={{ color: '#4b5563' }}>
                    Chapter Released
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: '#fca5a5', border: '1px solid #d1d5db' }}
                  ></div>
                  <span className="text-sm" style={{ color: '#4b5563' }}>
                    No Chapter (Planned Break/Holiday)
                  </span>
                </div>
              </div>
            )}

            {theme === 'saga' && (
              <div className="flex flex-wrap gap-4">
                {Array.from(sagaColorMap.entries()).map(([sagaId, color]) => {
                  const sagaTitle = releases?.find((r) => r.sagaId === sagaId)?.sagaTitle
                  return (
                    <div key={sagaId} className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: color, border: '1px solid #d1d5db' }}
                      ></div>
                      <span className="text-sm" style={{ color: '#4b5563' }}>
                        {sagaTitle}
                      </span>
                    </div>
                  )
                })}
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: '#fca5a5', border: '1px solid #d1d5db' }}
                  ></div>
                  <span className="text-sm" style={{ color: '#4b5563' }}>
                    No Chapter
                  </span>
                </div>
              </div>
            )}

            {theme === 'arc' && (
              <div className="flex flex-wrap gap-4">
                {Array.from(arcColorMap.entries()).slice(0, 10).map(([arcId, color]) => {
                  const arcTitle = releases?.find((r) => r.arcId === arcId)?.arcTitle
                  return (
                    <div key={arcId} className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: color, border: '1px solid #d1d5db' }}
                      ></div>
                      <span className="text-sm" style={{ color: '#4b5563' }}>
                        {arcTitle}
                      </span>
                    </div>
                  )
                })}
                {arcColorMap.size > 10 && (
                  <span className="text-xs italic" style={{ color: '#6b7280' }}>
                    ... and {arcColorMap.size - 10} more arcs
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: '#fca5a5', border: '1px solid #d1d5db' }}
                  ></div>
                  <span className="text-sm" style={{ color: '#4b5563' }}>
                    No Chapter
                  </span>
                </div>
              </div>
            )}

            {theme === 'luffy' && (
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: '#fbbf24', border: '1px solid #d1d5db' }}
                  ></div>
                  <span className="text-sm" style={{ color: '#4b5563' }}>
                    Luffy Appears
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: '#d1d5db', border: '1px solid #d1d5db' }}
                  ></div>
                  <span className="text-sm" style={{ color: '#4b5563' }}>
                    Luffy Does Not Appear
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: '#fca5a5', border: '1px solid #d1d5db' }}
                  ></div>
                  <span className="text-sm" style={{ color: '#4b5563' }}>
                    No Chapter
                  </span>
                </div>
              </div>
            )}

            <p className="text-xs mt-2" style={{ color: '#6b7280' }}>
              * Double issues show multiple chapter numbers in the same cell. {!isCompact && 'Click on chapter numbers to view details.'}
              {isCompact && 'Compact mode shows only the pattern of releases. Hover over cells to see chapter numbers and details.'}
            </p>
          </div>

          {/* Calendar Grid */}
          <div className="rounded-lg shadow-lg overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th
                    className="px-2 py-1 text-xs font-bold sticky left-0 z-10"
                    style={{
                      border: '2px solid #d1d5db',
                      backgroundColor: '#f3f4f6',
                      minWidth: '60px',
                    }}
                  >
                    Issue
                  </th>
                  {yearData.map((yearData) => (
                    <th
                      key={yearData.year}
                      className="px-2 py-1 text-xs font-bold"
                      style={{
                        border: '2px solid #d1d5db',
                        backgroundColor: '#dbeafe',
                        minWidth: isCompact ? '40px' : '60px',
                      }}
                    >
                      {isCompact ? String(yearData.year).slice(-2) : yearData.year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allIssues.map((issueNum) => (
                  <tr key={issueNum}>
                    <td
                      className="px-2 py-1 text-xs font-semibold text-center sticky left-0 z-10"
                      style={{
                        border: '2px solid #d1d5db',
                        backgroundColor: '#f3f4f6',
                      }}
                    >
                      {issueNum}
                    </td>
                    {yearData.map((yearData) => {
                      // Skip rendering if this issue is part of a double issue span
                      if (yearData.doubleIssueSpans.has(issueNum)) {
                        return null
                      }

                      const issue = yearData.issues.get(issueNum)
                      if (!issue) {
                        // No chapter this issue
                        return (
                          <td
                            key={`${yearData.year}-${issueNum}`}
                            className="px-1 py-1 text-center"
                            style={{
                              border: '2px solid #d1d5db',
                              backgroundColor: '#fca5a5',
                            }}
                          >
                            {!isCompact && <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>-</span>}
                          </td>
                        )
                      }

                      // Calculate rowspan for double issues
                      const rowSpan = issue.issueEnd ? issue.issueEnd - issueNum + 1 : 1

                      // Get cell color based on theme
                      const cellColor = getCellColor(issue.chapters, theme, sagaColorMap, arcColorMap)

                      // Create tooltip for compact mode
                      const getTooltipText = () => {
                        if (!isCompact) return undefined

                        const chapterNumbers = issue.chapters.map((ch) => ch.number).join(', ')
                        const firstChapter = issue.chapters[0]

                        let additionalInfo = ''
                        if (theme === 'saga' && firstChapter.sagaTitle) {
                          additionalInfo = `\nSaga: ${firstChapter.sagaTitle}`
                        } else if (theme === 'arc' && firstChapter.arcTitle) {
                          additionalInfo = `\nArc: ${firstChapter.arcTitle}`
                        } else if (theme === 'luffy') {
                          const luffyAppears = issue.chapters.some((ch) => ch.luffyAppears)
                          additionalInfo = `\n${luffyAppears ? 'Luffy appears' : 'Luffy does not appear'}`
                        }

                        return `Chapter${issue.chapters.length > 1 ? 's' : ''}: ${chapterNumbers}${additionalInfo}`
                      }

                      return (
                        <td
                          key={`${yearData.year}-${issueNum}`}
                          rowSpan={rowSpan}
                          className="px-1 py-1 text-center align-middle"
                          style={{
                            border: '2px solid #d1d5db',
                            backgroundColor: cellColor,
                            cursor: isCompact ? 'help' : 'default',
                          }}
                          title={getTooltipText()}
                        >
                          {!isCompact &&
                            issue.chapters.map((chapter, idx) => (
                              <span key={chapter.number}>
                                <Link
                                  to={`/chapters/${chapter.number}`}
                                  className="text-xs font-bold hover:underline cursor-pointer"
                                  style={{ color: '#2563eb' }}
                                >
                                  {chapter.number}
                                </Link>
                                {idx < issue.chapters.length - 1 && (
                                  <span style={{ color: '#4b5563', fontSize: '0.75rem' }}>, </span>
                                )}
                              </span>
                            ))}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            This calendar shows the release schedule of One Piece chapters in Weekly Shonen Jump.
            Green cells indicate weeks with chapter releases, while red cells show weeks without releases.
          </p>
        </div>
      </div>
    </main>
  )
}

export default ChapterReleaseCalendarPage
