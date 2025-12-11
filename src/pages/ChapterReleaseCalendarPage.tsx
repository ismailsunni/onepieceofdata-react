import { useQuery } from '@tanstack/react-query'
import { fetchChapterReleases, ChapterRelease } from '../services/analyticsService'
import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'

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
function getCellColor(
  chapters: ChapterRelease[],
  theme: VisualizationTheme,
  sagaColorMap: Map<string, string>,
  arcColorMap: Map<string, string>
): string {
  if (chapters.length === 0) return 'bg-red-300'

  const firstChapter = chapters[0]

  switch (theme) {
    case 'jump':
      return 'bg-green-500'

    case 'saga':
      if (firstChapter.sagaId && sagaColorMap.has(firstChapter.sagaId)) {
        return sagaColorMap.get(firstChapter.sagaId)!
      }
      return 'bg-gray-400'

    case 'arc':
      if (firstChapter.arcId && arcColorMap.has(firstChapter.arcId)) {
        return arcColorMap.get(firstChapter.arcId)!
      }
      return 'bg-gray-400'

    case 'luffy':
      // Check if Luffy appears in any of the chapters
      const luffyAppears = chapters.some((ch) => ch.luffyAppears)
      return luffyAppears ? 'bg-yellow-400' : 'bg-gray-300'

    default:
      return 'bg-green-500'
  }
}

function ChapterReleaseCalendarPage() {
  const [theme, setTheme] = useState<VisualizationTheme>('jump')

  const { data: releases, isLoading, error } = useQuery<ChapterRelease[]>({
    queryKey: ['analytics', 'chapter-releases'],
    queryFn: fetchChapterReleases,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Debug: Log the first few releases to see the data format
  if (releases && releases.length > 0) {
    console.log('Sample releases:', releases.slice(0, 5))
  }

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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading chapter release calendar...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          <p>Error loading chapter release data. Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Chapter Release Calendar</h1>
            <p className="text-lg text-gray-600">
              Visualize chapter releases by year and Weekly Shonen Jump issue
            </p>
            {releases && (
              <p className="text-sm text-gray-500 mt-2">
                Total chapters: {releases.length} | Years: {yearData.length} | Issues: {allIssues.length}
              </p>
            )}
          </div>

          {/* Theme Selector */}
          <div className="flex flex-col gap-2">
            <label htmlFor="theme-select" className="text-sm font-semibold text-gray-700">
              Visualization Theme:
            </label>
            <select
              id="theme-select"
              value={theme}
              onChange={(e) => setTheme(e.target.value as VisualizationTheme)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="jump">Jump Issue</option>
              <option value="saga">Saga</option>
              <option value="arc">Arc</option>
              <option value="luffy">Luffy Appears</option>
            </select>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Legend:</h3>

        {theme === 'jump' && (
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 border border-gray-300 rounded"></div>
              <span className="text-sm text-gray-600">Chapter Released</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-300 border border-gray-300 rounded"></div>
              <span className="text-sm text-gray-600">No Chapter (Planned Break/Holiday)</span>
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
                    className="w-8 h-8 border border-gray-300 rounded"
                    style={{ backgroundColor: color }}
                  ></div>
                  <span className="text-sm text-gray-600">{sagaTitle}</span>
                </div>
              )
            })}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-300 border border-gray-300 rounded"></div>
              <span className="text-sm text-gray-600">No Chapter</span>
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
                    className="w-8 h-8 border border-gray-300 rounded"
                    style={{ backgroundColor: color }}
                  ></div>
                  <span className="text-sm text-gray-600">{arcTitle}</span>
                </div>
              )
            })}
            {arcColorMap.size > 10 && (
              <span className="text-xs text-gray-500 italic">... and {arcColorMap.size - 10} more arcs</span>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-300 border border-gray-300 rounded"></div>
              <span className="text-sm text-gray-600">No Chapter</span>
            </div>
          </div>
        )}

        {theme === 'luffy' && (
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-400 border border-gray-300 rounded"></div>
              <span className="text-sm text-gray-600">Luffy Appears</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-300 border border-gray-300 rounded"></div>
              <span className="text-sm text-gray-600">Luffy Does Not Appear</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-300 border border-gray-300 rounded"></div>
              <span className="text-sm text-gray-600">No Chapter</span>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-2">
          * Double issues show multiple chapter numbers in the same cell. Click on chapter numbers to view details.
        </p>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-lg p-6 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border-2 border-gray-300 bg-gray-100 px-2 py-1 text-xs font-bold sticky left-0 z-10">
                Issue
              </th>
              {yearData.map((yearData) => (
                <th
                  key={yearData.year}
                  className="border-2 border-gray-300 bg-blue-100 px-2 py-1 text-xs font-bold min-w-[60px]"
                >
                  {yearData.year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allIssues.map((issueNum) => (
              <tr key={issueNum}>
                <td className="border-2 border-gray-300 bg-gray-100 px-2 py-1 text-xs font-semibold text-center sticky left-0 z-10">
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
                        className="border-2 border-gray-300 bg-red-300 px-1 py-1 text-center"
                      >
                        <span className="text-xs text-gray-600">-</span>
                      </td>
                    )
                  }

                  // Calculate rowspan for double issues
                  const rowSpan = issue.issueEnd ? issue.issueEnd - issueNum + 1 : 1

                  // Get cell color based on theme
                  const cellColor = getCellColor(issue.chapters, theme, sagaColorMap, arcColorMap)
                  const useTailwindClass = cellColor.startsWith('bg-')

                  return (
                    <td
                      key={`${yearData.year}-${issueNum}`}
                      rowSpan={rowSpan}
                      className={`border-2 border-gray-300 px-1 py-1 text-center align-middle ${
                        useTailwindClass ? cellColor : ''
                      }`}
                      style={!useTailwindClass ? { backgroundColor: cellColor } : undefined}
                    >
                      {issue.chapters.map((chapter, idx) => (
                        <span key={chapter.number}>
                          <Link
                            to={`/chapters/${chapter.number}`}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            {chapter.number}
                          </Link>
                          {idx < issue.chapters.length - 1 && <span className="text-gray-600 text-xs">, </span>}
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

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          This calendar shows the release schedule of One Piece chapters in Weekly Shonen Jump.
          Green cells indicate weeks with chapter releases, while red cells show weeks without releases.
        </p>
      </div>
    </main>
  )
}

export default ChapterReleaseCalendarPage
