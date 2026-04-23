import { useQuery } from '@tanstack/react-query'
import {
  fetchChapterReleases,
  fetchCharacterChapterList,
  ChapterRelease,
} from '../services/analyticsService'
import { fetchCharacters } from '../services/characterService'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
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

type VisualizationTheme = 'jump' | 'saga' | 'arc' | 'character'

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

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
  arcColorMap: Map<string, string>,
  characterChapterSet: Set<number> | null
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

    case 'character': {
      if (!characterChapterSet) return '#d1d5db' // gray-300 — no character selected
      const appears = chapters.some((ch) => characterChapterSet.has(ch.number))
      return appears ? '#22c55e' : '#d1d5db' // green-500 : gray-300
    }

    default:
      return '#22c55e' // green-500
  }
}

/**
 * Compute the longest run of consecutive chapter numbers in `appearChapters`
 * (longest streak of appearances) and the longest gap between two consecutive
 * appearances (the longest stretch of chapters where the character does NOT
 * appear, bounded by chapters where they do).
 *
 * Both ranges are returned as inclusive [from, to] chapter numbers, with
 * length being the chapter count covered by the range.
 */
function computeAppearanceStreaks(appearChapters: number[]): {
  longestStreak: { from: number; to: number; length: number } | null
  longestGap: { from: number; to: number; length: number } | null
} {
  if (!appearChapters || appearChapters.length === 0) {
    return { longestStreak: null, longestGap: null }
  }

  const sorted = [...new Set(appearChapters)].sort((a, b) => a - b)

  // Longest streak: longest run of consecutive integers
  let streakStart = sorted[0]
  let streakLen = 1
  let bestStreakStart = sorted[0]
  let bestStreakEnd = sorted[0]
  let bestStreakLen = 1
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      streakLen++
    } else {
      streakLen = 1
      streakStart = sorted[i]
    }
    if (streakLen > bestStreakLen) {
      bestStreakLen = streakLen
      bestStreakStart = streakStart
      bestStreakEnd = sorted[i]
    }
  }

  // Longest gap: largest difference between consecutive appearances
  let bestGap: { from: number; to: number; length: number } | null = null
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i] - sorted[i - 1] - 1
    if (gap > 0 && (!bestGap || gap > bestGap.length)) {
      bestGap = {
        from: sorted[i - 1] + 1,
        to: sorted[i] - 1,
        length: gap,
      }
    }
  }

  return {
    longestStreak: {
      from: bestStreakStart,
      to: bestStreakEnd,
      length: bestStreakLen,
    },
    longestGap: bestGap,
  }
}

function ChapterReleaseCalendarPage() {
  const [theme, setTheme] = useState<VisualizationTheme>('jump')
  const [isCompact, setIsCompact] = useState(false)
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
    null
  )
  const [characterSearch, setCharacterSearch] = useState('')
  const [characterDropdownOpen, setCharacterDropdownOpen] = useState(false)
  const characterSearchRef = useRef<HTMLDivElement>(null)

  const {
    data: releases,
    isLoading,
    error,
  } = useQuery<ChapterRelease[]>({
    queryKey: ['analytics', 'chapter-releases'],
    queryFn: fetchChapterReleases,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Character list — used for the search dropdown when the Character theme is
  // active. Cached across the app since CharacterTimelinePage uses it too.
  const { data: allCharacters = [] } = useQuery({
    queryKey: ['characters'],
    queryFn: fetchCharacters,
    staleTime: 10 * 60 * 1000,
  })

  // Default to Luffy when the user hasn't picked anyone yet. Derived during
  // render (no effect) to avoid cascading renders.
  const effectiveCharacterId = useMemo(() => {
    if (selectedCharacterId) return selectedCharacterId
    return allCharacters.find((c) => c.name === 'Monkey D. Luffy')?.id ?? null
  }, [selectedCharacterId, allCharacters])

  // Fetch the chapter_list of the currently selected character (only when
  // we actually have a character selected — not gated by theme so that the
  // data is ready immediately when the user switches to the Character theme).
  const { data: selectedCharacterChapters = [] } = useQuery({
    queryKey: ['character-chapter-list', effectiveCharacterId],
    queryFn: () => fetchCharacterChapterList(effectiveCharacterId!),
    enabled: !!effectiveCharacterId,
    staleTime: 10 * 60 * 1000,
  })

  const characterChapterSet = useMemo(
    () =>
      theme === 'character' && selectedCharacterChapters.length > 0
        ? new Set(selectedCharacterChapters)
        : null,
    [theme, selectedCharacterChapters]
  )

  const selectedCharacter = useMemo(
    () => allCharacters.find((c) => c.id === effectiveCharacterId) || null,
    [allCharacters, effectiveCharacterId]
  )

  const filteredCharacters = useMemo(() => {
    if (!characterSearch.trim()) return []
    return allCharacters
      .filter((c) =>
        c.name?.toLowerCase().includes(characterSearch.toLowerCase())
      )
      .slice(0, 30)
  }, [allCharacters, characterSearch])

  // Close character dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        characterSearchRef.current &&
        !characterSearchRef.current.contains(event.target as Node)
      ) {
        setCharacterDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Streaks of appearance for selected character (only meaningful when
  // 'character' theme is active and a character is selected).
  const characterStreaks = useMemo(
    () => computeAppearanceStreaks(selectedCharacterChapters),
    [selectedCharacterChapters]
  )

  // Compute predicted schedule: Map<"year-issue", 'chapter'|'break'>
  // and double issue map: Map<"year-issue", issueEnd>
  interface PredictedEntry {
    type: 'chapter' | 'break'
    chapterNum?: number
    issue: number
    issueEnd: number | null
    year: number
    date: Date
    daysAway: number
  }

  const { predictedMap, predictedDoubleMap, predictedSchedule, predStats } =
    useMemo(() => {
      const predictedMap = new Map<
        string,
        { type: 'chapter' | 'break'; chapterNum?: number }
      >()
      const predictedDoubleMap = new Map<string, number>()
      const predictedSchedule: PredictedEntry[] = []
      const predStats = {
        sampleSize: 0,
        avgDays: 0,
        breakRate: 0,
        daysPerIssue: 0,
      }

      if (!releases || releases.length < 5)
        return {
          predictedMap,
          predictedDoubleMap,
          predictedSchedule,
          predStats,
        }

      const threeYearsAgo = new Date()
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3)

      const recent = releases
        .filter(
          (r) =>
            r.date &&
            r.issue != null &&
            r.year != null &&
            new Date(r.date) >= threeYearsAgo
        )
        .sort((a, b) => a.number - b.number)

      if (recent.length < 5)
        return {
          predictedMap,
          predictedDoubleMap,
          predictedSchedule,
          predStats,
        }

      const dayGaps: number[] = []
      const issueGaps: number[] = []
      for (let i = 1; i < recent.length; i++) {
        const prev = recent[i - 1]
        const curr = recent[i]
        const days =
          (new Date(curr.date!).getTime() - new Date(prev.date!).getTime()) /
          (1000 * 60 * 60 * 24)
        dayGaps.push(days)
        const prevEffective = prev.issueEnd ?? prev.issue!
        const issueDiff =
          curr.issue! - prevEffective + (curr.year! - prev.year!) * 52
        if (issueDiff > 0 && issueDiff < 20) issueGaps.push(issueDiff)
      }
      if (issueGaps.length < 5)
        return {
          predictedMap,
          predictedDoubleMap,
          predictedSchedule,
          predStats,
        }

      const daysPerIssue =
        dayGaps.reduce((s, g) => s + g, 0) /
        issueGaps.reduce((s, g) => s + g, 0)

      const doubleIssueMap = new Map<number, number>()
      recent.forEach((r) => {
        if (r.issueEnd != null && r.issueEnd > r.issue!)
          doubleIssueMap.set(r.issue!, r.issueEnd)
      })

      const issueChapterCount = new Map<number, number>()
      recent.forEach((r) => {
        issueChapterCount.set(
          r.issue!,
          (issueChapterCount.get(r.issue!) ?? 0) + 1
        )
      })
      const yearsInData = new Set(recent.map((r) => r.year!)).size || 1
      const issueChapterRate = (iss: number) =>
        (issueChapterCount.get(iss) ?? 0) / yearsInData

      const avgDays = dayGaps.reduce((s, g) => s + g, 0) / dayGaps.length
      const breakRate = issueGaps.filter((g) => g > 1).length / issueGaps.length
      predStats.sampleSize = recent.length
      predStats.avgDays = avgDays
      predStats.breakRate = breakRate
      predStats.daysPerIssue = daysPerIssue

      const latest = recent[recent.length - 1]
      const latestDate = new Date(latest.date!)
      let currentIssue = latest.issueEnd ?? latest.issue!
      let currentYear = latest.year!
      let currentDate = latestDate
      let chaptersFound = 0

      while (chaptersFound < 5) {
        currentIssue++
        if (currentIssue > 52) {
          currentIssue = 1
          currentYear++
        }

        const issueEnd = doubleIssueMap.get(currentIssue) ?? null
        const hasChapter = issueChapterRate(currentIssue) >= 0.5
        const key = `${currentYear}-${currentIssue}`
        const entryDate = new Date(
          currentDate.getTime() + daysPerIssue * 24 * 60 * 60 * 1000
        )
        const daysAway = Math.round(
          (entryDate.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (hasChapter) {
          const chapterNum = latest.number + chaptersFound + 1
          predictedMap.set(key, { type: 'chapter', chapterNum })
          predictedSchedule.push({
            type: 'chapter',
            chapterNum,
            issue: currentIssue,
            issueEnd,
            year: currentYear,
            date: entryDate,
            daysAway,
          })
          chaptersFound++
        } else {
          predictedMap.set(key, { type: 'break' })
          predictedSchedule.push({
            type: 'break',
            issue: currentIssue,
            issueEnd,
            year: currentYear,
            date: entryDate,
            daysAway,
          })
        }
        if (issueEnd != null) predictedDoubleMap.set(key, issueEnd)

        if (issueEnd != null) currentIssue = issueEnd
        currentDate = entryDate
      }

      return { predictedMap, predictedDoubleMap, predictedSchedule, predStats }
    }, [releases])

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

      // Add predicted double issue spans for this year
      predictedDoubleMap.forEach((issueEnd, key) => {
        const [yearStr, issueStr] = key.split('-')
        if (parseInt(yearStr) === year) {
          const issueNum = parseInt(issueStr)
          for (let i = issueNum + 1; i <= issueEnd; i++) {
            doubleIssueSpans.add(i)
          }
        }
      })

      years.push({ year, issues, doubleIssueSpans })
    })

    // Add any predicted years not already in yearMap
    predictedMap.forEach((_, key) => {
      const year = parseInt(key.split('-')[0])
      if (!sortedYears.includes(year)) {
        const doubleIssueSpans = new Set<number>()
        predictedDoubleMap.forEach((issueEnd, dKey) => {
          const [dYearStr, dIssueStr] = dKey.split('-')
          if (parseInt(dYearStr) === year) {
            for (let i = parseInt(dIssueStr) + 1; i <= issueEnd; i++) {
              doubleIssueSpans.add(i)
            }
          }
        })
        years.push({ year, issues: new Map(), doubleIssueSpans })
      }
    })

    return years.sort((a, b) => a.year - b.year)
  }, [releases, predictedMap, predictedDoubleMap])

  // Create color maps for sagas and arcs
  const { sagaColorMap, arcColorMap } = useMemo(() => {
    if (!releases) return { sagaColorMap: new Map(), arcColorMap: new Map() }

    // Get unique sagas and arcs in order of first appearance
    const uniqueSagas = new Map<string, string>()
    const uniqueArcs = new Map<string, string>()

    releases.forEach((release) => {
      if (
        release.sagaId &&
        release.sagaTitle &&
        !uniqueSagas.has(release.sagaId)
      ) {
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
    yearData.forEach((yd) => {
      yd.issues.forEach((_, issue) => issues.add(issue))
    })
    // Include predicted issue numbers (start issues only, not double-issue spans)
    predictedMap.forEach((_, key) => {
      issues.add(parseInt(key.split('-')[1]))
    })
    return Array.from(issues).sort((a, b) => a - b)
  }, [yearData, predictedMap])

  // Calculate quick stats
  const stats = useMemo(() => {
    if (!releases)
      return {
        totalBreaks: 0,
        yearsCount: 0,
        longestStreak: 0,
        longestStreakInfo: null,
        uninterruptedBreaks: 0,
        breakChapters: [],
      }

    // Calculate total breaks (any week without One Piece, excluding issue 53)
    // Calculate uninterrupted breaks (3+ consecutive weeks without One Piece)
    // - Ignore issue 53 (no One Piece published)
    // - Double issues count as covering 2 weeks, so no break
    let totalBreaksCount = 0
    let uninterruptedBreaksCount = 0
    const breakChapters: Array<{
      fromChapter: number
      toChapter: number
      fromJump: string
      toJump: string
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

      if (
        current.year &&
        previous.year &&
        current.issue !== null &&
        previous.issue !== null
      ) {
        let weeksBetween = 0

        if (current.year === previous.year) {
          // Calculate weeks in same year
          weeksBetween = current.issue - previous.issue

          // Adjust for double issues
          if (
            previous.issueEnd !== null &&
            previous.issueEnd > previous.issue
          ) {
            // Previous was a double issue, it already covered extra weeks
            weeksBetween -= previous.issueEnd - previous.issue
          }

          // Subtract 1 for the expected next issue
          weeksBetween -= 1

          // Check if there's an issue 53 in between and subtract it
          if (previous.issue < 53 && current.issue > 53) {
            weeksBetween -= 1
          }
        } else if (current.year === previous.year + 1) {
          // Year transition
          weeksBetween = 52 - previous.issue + current.issue

          // Adjust for double issues
          if (
            previous.issueEnd !== null &&
            previous.issueEnd > previous.issue
          ) {
            weeksBetween -= previous.issueEnd - previous.issue
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
            weeksBreak: weeksBetween,
          })
        }
      }
    }

    const longestStreakInfo =
      longestStreak > 0
        ? {
            chapters: longestStreak,
            fromChapter: sortedReleases[longestStreakStart].number,
            toChapter: sortedReleases[longestStreakEnd].number,
          }
        : null

    return {
      totalBreaks: totalBreaksCount,
      yearsCount: yearData.length,
      longestStreak,
      longestStreakInfo,
      uninterruptedBreaks: uninterruptedBreaksCount,
      breakChapters,
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
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link
            to="/analytics"
            className="hover:text-gray-900 transition-colors"
          >
            Analytics
          </Link>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-gray-900 font-medium">
            Release History by Jump Issue
          </span>
        </nav>
        {/* Hero Section */}
        <div className="relative mb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 opacity-60 rounded-2xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-amber-600 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 md:w-9 md:h-9 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-yellow-600">
                  Release History by Jump Issue
                </h1>
                <p className="text-gray-600 text-lg mt-2">
                  Chapter release schedule by year and Weekly Shonen Jump issue
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <StatCard
            label="Years Covered"
            value={stats.yearsCount}
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
            subtitle={
              stats.longestStreakInfo
                ? `Ch. ${stats.longestStreakInfo.fromChapter}-${stats.longestStreakInfo.toChapter}`
                : undefined
            }
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
              (b) =>
                `Chapter ${b.fromChapter} to ${b.toChapter} (${b.weeksBreak} weeks break)`
            )}
          />
        </div>

        {/* Next 5 Chapters — Jump Issue Forecast */}
        {predictedSchedule.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Next 5 Chapters — Jump Issue Forecast
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Based on {predStats.sampleSize} chapters over the last 3 years ·
              avg {predStats.avgDays.toFixed(1)} days/chapter ·{' '}
              {Math.round(predStats.breakRate * 100)}% break rate. Break weeks,
              double issues, and dates are estimates.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">
                      Chapter
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">
                      Jump Issue
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">
                      Est. Date
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">
                      Days Away
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {predictedSchedule.map((entry, idx) =>
                    entry.type === 'chapter' ? (
                      <tr
                        key={`ch-${entry.chapterNum}`}
                        className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold text-blue-700">
                          Ch. {entry.chapterNum}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {entry.year} Issue{' '}
                          {entry.issueEnd != null
                            ? `${entry.issue}–${entry.issueEnd}`
                            : entry.issue}
                          {entry.issueEnd != null && (
                            <span className="ml-2 inline-block px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                              double
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-800">
                          {formatDate(entry.date)}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {entry.daysAway <= 1
                            ? 'Tomorrow'
                            : `~${entry.daysAway}d`}
                        </td>
                      </tr>
                    ) : (
                      <tr
                        key={`break-${idx}`}
                        className="border-b border-gray-100 bg-gray-50/60"
                      >
                        <td className="px-4 py-2">
                          <span className="inline-block px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-500 rounded-full">
                            break
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-400 text-xs">
                          {entry.year} Issue{' '}
                          {entry.issueEnd != null
                            ? `${entry.issue}–${entry.issueEnd}`
                            : entry.issue}
                          {entry.issueEnd != null && (
                            <span className="ml-2 inline-block px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                              double
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-gray-400 text-xs">
                          {formatDate(entry.date)}
                        </td>
                        <td className="px-4 py-2 text-gray-400 text-xs">
                          ~{entry.daysAway}d
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Chart Card */}
        <ChartCard
          title="Release History by Jump Issue"
          downloadFileName={`one-piece-release-history-${theme}`}
          chartId="chapter-release-calendar"
          filters={
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Color Theme:
                </label>
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
                    active={theme === 'character'}
                    onClick={() => setTheme('character')}
                  >
                    Character
                  </FilterButton>
                </div>

                {/* Character search — visible always so users see the
                    feature, but disabled when a non-character theme is
                    active. */}
                <div
                  ref={characterSearchRef}
                  className={`relative mt-3 transition-opacity ${
                    theme === 'character'
                      ? 'opacity-100'
                      : 'opacity-50 pointer-events-none'
                  }`}
                  aria-disabled={theme !== 'character'}
                >
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {theme === 'character'
                      ? 'Search character:'
                      : 'Character search (switch to "Character" theme to enable)'}
                  </label>
                  <div className="relative">
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder={
                        selectedCharacter?.name
                          ? `Selected: ${selectedCharacter.name}`
                          : 'Type a character name…'
                      }
                      value={characterSearch}
                      onChange={(e) => {
                        setCharacterSearch(e.target.value)
                        setCharacterDropdownOpen(
                          e.target.value.trim().length > 0
                        )
                      }}
                      onFocus={() => {
                        if (characterSearch.trim())
                          setCharacterDropdownOpen(true)
                      }}
                      disabled={theme !== 'character'}
                      className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                    {characterSearch && (
                      <button
                        onClick={() => {
                          setCharacterSearch('')
                          setCharacterDropdownOpen(false)
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Clear search"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}

                    {/* Dropdown results */}
                    {characterDropdownOpen && characterSearch.trim() && (
                      <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
                        {filteredCharacters.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            No characters found for "{characterSearch}"
                          </div>
                        ) : (
                          filteredCharacters.map((character) => {
                            if (!character.name) return null
                            const isSelected =
                              effectiveCharacterId === character.id
                            return (
                              <button
                                key={character.id}
                                onClick={() => {
                                  setSelectedCharacterId(character.id)
                                  setCharacterSearch('')
                                  setCharacterDropdownOpen(false)
                                }}
                                className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between gap-2 transition-colors ${
                                  isSelected
                                    ? 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <span>{character.name}</span>
                                {isSelected && (
                                  <svg
                                    className="w-4 h-4 text-blue-600 shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </button>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Display Mode:
                </label>
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
          }
        >
          {/* Legend */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Legend:
            </h3>

            {theme === 'jump' && (
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded"
                    style={{
                      backgroundColor: '#22c55e',
                      border: '1px solid #d1d5db',
                    }}
                  ></div>
                  <span className="text-sm" style={{ color: '#4b5563' }}>
                    Chapter Released
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded"
                    style={{
                      backgroundColor: '#fca5a5',
                      border: '1px solid #d1d5db',
                    }}
                  ></div>
                  <span className="text-sm" style={{ color: '#4b5563' }}>
                    No Chapter (Planned Break/Holiday)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded"
                    style={{
                      backgroundColor: '#bfdbfe',
                      border: '1px solid #d1d5db',
                    }}
                  ></div>
                  <span className="text-sm" style={{ color: '#4b5563' }}>
                    Predicted Chapter
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded"
                    style={{
                      backgroundColor: '#9ca3af',
                      border: '1px solid #d1d5db',
                    }}
                  ></div>
                  <span className="text-sm" style={{ color: '#4b5563' }}>
                    Predicted Break
                  </span>
                </div>
              </div>
            )}

            {theme === 'saga' && (
              <div className="flex flex-wrap gap-4">
                {Array.from(sagaColorMap.entries()).map(([sagaId, color]) => {
                  const sagaTitle = releases?.find(
                    (r) => r.sagaId === sagaId
                  )?.sagaTitle
                  return (
                    <div key={sagaId} className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded"
                        style={{
                          backgroundColor: color,
                          border: '1px solid #d1d5db',
                        }}
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
                    style={{
                      backgroundColor: '#fca5a5',
                      border: '1px solid #d1d5db',
                    }}
                  ></div>
                  <span className="text-sm" style={{ color: '#4b5563' }}>
                    No Chapter
                  </span>
                </div>
              </div>
            )}

            {theme === 'arc' && (
              <div className="flex flex-wrap gap-4">
                {Array.from(arcColorMap.entries())
                  .slice(0, 10)
                  .map(([arcId, color]) => {
                    const arcTitle = releases?.find(
                      (r) => r.arcId === arcId
                    )?.arcTitle
                    return (
                      <div key={arcId} className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded"
                          style={{
                            backgroundColor: color,
                            border: '1px solid #d1d5db',
                          }}
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
                    style={{
                      backgroundColor: '#fca5a5',
                      border: '1px solid #d1d5db',
                    }}
                  ></div>
                  <span className="text-sm" style={{ color: '#4b5563' }}>
                    No Chapter
                  </span>
                </div>
              </div>
            )}

            {theme === 'character' && (
              <>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded"
                      style={{
                        backgroundColor: '#22c55e',
                        border: '1px solid #d1d5db',
                      }}
                    ></div>
                    <span className="text-sm" style={{ color: '#4b5563' }}>
                      {selectedCharacter?.name || 'Character'} Appears
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded"
                      style={{
                        backgroundColor: '#d1d5db',
                        border: '1px solid #d1d5db',
                      }}
                    ></div>
                    <span className="text-sm" style={{ color: '#4b5563' }}>
                      {selectedCharacter?.name || 'Character'} Does Not Appear
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded"
                      style={{
                        backgroundColor: '#fca5a5',
                        border: '1px solid #d1d5db',
                      }}
                    ></div>
                    <span className="text-sm" style={{ color: '#4b5563' }}>
                      No Chapter
                    </span>
                  </div>
                </div>

                {/* Streak / gap stats for the selected character */}
                {selectedCharacter && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                        Longest continuous appearance
                      </p>
                      {characterStreaks.longestStreak ? (
                        <p className="text-sm text-emerald-900 mt-1">
                          <span className="font-bold">
                            Ch. {characterStreaks.longestStreak.from} – Ch.{' '}
                            {characterStreaks.longestStreak.to}
                          </span>{' '}
                          <span className="text-emerald-700">
                            ({characterStreaks.longestStreak.length} chapters)
                          </span>
                        </p>
                      ) : (
                        <p className="text-sm text-emerald-900 mt-1 italic">
                          No appearances recorded.
                        </p>
                      )}
                    </div>
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                        Longest absence between appearances
                      </p>
                      {characterStreaks.longestGap ? (
                        <p className="text-sm text-rose-900 mt-1">
                          <span className="font-bold">
                            Ch. {characterStreaks.longestGap.from} – Ch.{' '}
                            {characterStreaks.longestGap.to}
                          </span>{' '}
                          <span className="text-rose-700">
                            ({characterStreaks.longestGap.length} chapters
                            missing)
                          </span>
                        </p>
                      ) : (
                        <p className="text-sm text-rose-900 mt-1 italic">
                          No gaps — appears in every chapter they were in.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            <p className="text-xs mt-2" style={{ color: '#6b7280' }}>
              * Double issues show multiple chapter numbers in the same cell.{' '}
              {!isCompact && 'Click on chapter numbers to view details.'}
              {isCompact &&
                'Compact mode shows only the pattern of releases. Hover over cells to see chapter numbers and details.'}
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
                      {isCompact
                        ? String(yearData.year).slice(-2)
                        : yearData.year}
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
                        const predKey = `${yearData.year}-${issueNum}`
                        const pred = predictedMap.get(predKey)
                        const predIssueEnd =
                          predictedDoubleMap.get(predKey) ?? null
                        const predRowSpan = predIssueEnd
                          ? predIssueEnd - issueNum + 1
                          : 1

                        if (pred?.type === 'chapter') {
                          return (
                            <td
                              key={predKey}
                              rowSpan={predRowSpan}
                              className="px-1 py-1 text-center align-middle"
                              style={{
                                border: '2px solid #d1d5db',
                                backgroundColor: '#bfdbfe', // blue-200
                              }}
                              title={`Predicted Ch. ${pred.chapterNum} — ${yearData.year} Issue ${predIssueEnd ? `${issueNum}–${predIssueEnd}` : issueNum}`}
                            >
                              {!isCompact && (
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    color: '#1e40af',
                                    fontWeight: 600,
                                  }}
                                >
                                  ~{pred.chapterNum}
                                </span>
                              )}
                            </td>
                          )
                        }

                        if (pred?.type === 'break') {
                          return (
                            <td
                              key={predKey}
                              rowSpan={predRowSpan}
                              className="px-1 py-1 text-center align-middle"
                              style={{
                                border: '2px solid #d1d5db',
                                backgroundColor: '#9ca3af', // gray-400
                              }}
                              title={`Predicted break — ${yearData.year} Issue ${predIssueEnd ? `${issueNum}–${predIssueEnd}` : issueNum}`}
                            >
                              {!isCompact && (
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    color: '#374151',
                                  }}
                                >
                                  -
                                </span>
                              )}
                            </td>
                          )
                        }

                        // Past break
                        return (
                          <td
                            key={predKey}
                            className="px-1 py-1 text-center"
                            style={{
                              border: '2px solid #d1d5db',
                              backgroundColor: '#fca5a5',
                            }}
                          >
                            {!isCompact && (
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  color: '#4b5563',
                                }}
                              >
                                -
                              </span>
                            )}
                          </td>
                        )
                      }

                      // Calculate rowspan for double issues
                      const rowSpan = issue.issueEnd
                        ? issue.issueEnd - issueNum + 1
                        : 1

                      // Get cell color based on theme
                      const cellColor = getCellColor(
                        issue.chapters,
                        theme,
                        sagaColorMap,
                        arcColorMap,
                        characterChapterSet
                      )

                      // Create tooltip for compact mode
                      const getTooltipText = () => {
                        if (!isCompact) return undefined

                        const chapterNumbers = issue.chapters
                          .map((ch) => ch.number)
                          .join(', ')
                        const firstChapter = issue.chapters[0]

                        let additionalInfo = ''
                        if (theme === 'saga' && firstChapter.sagaTitle) {
                          additionalInfo = `\nSaga: ${firstChapter.sagaTitle}`
                        } else if (theme === 'arc' && firstChapter.arcTitle) {
                          additionalInfo = `\nArc: ${firstChapter.arcTitle}`
                        } else if (
                          theme === 'character' &&
                          characterChapterSet
                        ) {
                          const appears = issue.chapters.some((ch) =>
                            characterChapterSet.has(ch.number)
                          )
                          const charName =
                            selectedCharacter?.name || 'Character'
                          additionalInfo = `\n${appears ? `${charName} appears` : `${charName} does not appear`}`
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
                                  <span
                                    style={{
                                      color: '#4b5563',
                                      fontSize: '0.75rem',
                                    }}
                                  >
                                    ,{' '}
                                  </span>
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
            This calendar shows the release schedule of One Piece chapters in
            Weekly Shonen Jump. Green cells indicate weeks with chapter
            releases, red cells show weeks without releases, and amber/gray
            cells show predicted future chapters and breaks based on 3-year
            historical patterns.
          </p>
        </div>
      </div>
    </main>
  )
}

export default ChapterReleaseCalendarPage
