import { useQuery } from '@tanstack/react-query'
import { fetchChapterReleases, ChapterRelease } from '../services/analyticsService'
import { Link } from 'react-router-dom'
import { useMemo, useState, useRef } from 'react'
import html2canvas from 'html2canvas'

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
  const [isCopying, setIsCopying] = useState(false)
  const [isCompact, setIsCompact] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)

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

  // Handle copying table as image
  const handleCopyAsImage = async () => {
    if (!calendarRef.current) {
      console.error('Calendar ref is not available')
      alert('Calendar not ready. Please try again.')
      return
    }

    try {
      setIsCopying(true)

      // Find the overflow container
      const overflowContainer = calendarRef.current.querySelector('.overflow-x-auto') as HTMLElement

      // Store original styles
      const originalOverflow = overflowContainer?.style.overflow
      const originalMaxWidth = calendarRef.current.style.maxWidth

      // Temporarily remove scroll restrictions to capture full width
      if (overflowContainer) {
        overflowContainer.style.overflow = 'visible'
      }
      calendarRef.current.style.maxWidth = 'none'

      // Wait for layout to update
      await new Promise(resolve => setTimeout(resolve, 100))

      // Capture the calendar element as a canvas with better options
      const canvas = await html2canvas(calendarRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: true, // Enable logging for debugging
        useCORS: true,
        allowTaint: true,
        removeContainer: true,
        imageTimeout: 0,
        scrollX: 0,
        scrollY: 0,
        width: calendarRef.current.scrollWidth,
        height: calendarRef.current.scrollHeight,
      })

      // Restore original styles
      if (overflowContainer) {
        overflowContainer.style.overflow = originalOverflow || ''
      }
      calendarRef.current.style.maxWidth = originalMaxWidth || ''

      // Convert canvas to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob)
        }, 'image/png')
      })

      if (!blob) {
        throw new Error('Failed to create image blob')
      }

      // Try to copy to clipboard (modern browsers)
      if (navigator.clipboard && ClipboardItem) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob,
            }),
          ])
          alert('✅ Calendar copied to clipboard! You can now paste it anywhere.')
          return
        } catch (clipboardError) {
          console.warn('Clipboard API failed:', clipboardError)
          // Continue to download fallback
        }
      }

      // Fallback: download as file
      const url = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `one-piece-calendar-${theme}-${new Date().toISOString().split('T')[0]}.png`
      link.href = url
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      alert('📥 Calendar downloaded as an image!')
    } catch (error) {
      console.error('Error capturing calendar as image:', error)
      alert(`❌ Failed to copy calendar: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsCopying(false)
    }
  }

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

      {/* Calendar Container (for image export) */}
      <div ref={calendarRef} className="p-6 rounded-lg" style={{ backgroundColor: '#ffffff' }}>
        {/* Title for exported image */}
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold" style={{ color: '#1f2937' }}>
            One Piece Chapter Release Calendar
          </h2>
          <p className="text-sm mt-1" style={{ color: '#4b5563' }}>
            Theme: {theme.charAt(0).toUpperCase() + theme.slice(1)} | Mode: {isCompact ? 'Compact' : 'Detail'}
          </p>
        </div>

        {/* Controls Section - Below Chart Title, Above Legend */}
        <div className="mb-6 flex flex-wrap gap-4 items-end justify-center">
          <div className="flex flex-col gap-2">
            <label htmlFor="theme-select" className="text-sm font-semibold" style={{ color: '#374151' }}>
              Visualization Theme:
            </label>
            <select
              id="theme-select"
              value={theme}
              onChange={(e) => setTheme(e.target.value as VisualizationTheme)}
              className="px-4 py-2 rounded-lg text-sm font-medium focus:outline-none"
              style={{
                border: '1px solid #d1d5db',
                backgroundColor: '#ffffff',
                color: '#374151',
              }}
            >
              <option value="jump">Jump Issue</option>
              <option value="saga">Saga</option>
              <option value="arc">Arc</option>
              <option value="luffy">Luffy Appears</option>
            </select>
          </div>

          {/* Display Mode Toggle */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold" style={{ color: '#374151' }}>
              Display Mode:
            </label>
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #d1d5db' }}>
              <button
                onClick={() => setIsCompact(false)}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: !isCompact ? '#2563eb' : '#ffffff',
                  color: !isCompact ? '#ffffff' : '#374151',
                }}
              >
                Detail
              </button>
              <button
                onClick={() => setIsCompact(true)}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: isCompact ? '#2563eb' : '#ffffff',
                  color: isCompact ? '#ffffff' : '#374151',
                }}
              >
                Compact
              </button>
            </div>
          </div>

          {/* Copy as Image Button */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold" style={{ color: '#374151' }}>
              Share:
            </label>
            <button
              onClick={handleCopyAsImage}
              disabled={isCopying}
              className="px-4 py-2 text-sm font-medium rounded-lg focus:outline-none transition-colors"
              style={{
                backgroundColor: isCopying ? '#93c5fd' : '#2563eb',
                color: '#ffffff',
                cursor: isCopying ? 'not-allowed' : 'pointer',
                opacity: isCopying ? 0.5 : 1,
              }}
              title="Copy calendar as image to clipboard or download"
            >
              {isCopying ? 'Copying...' : '📸 Copy as Image'}
            </button>
          </div>
        </div>

        {/* Legend */}
        <div
          className="mb-6 p-4 rounded-lg"
          style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#374151' }}>
            Legend:
          </h3>

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
