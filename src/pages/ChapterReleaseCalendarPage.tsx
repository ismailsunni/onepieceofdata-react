import { useQuery } from '@tanstack/react-query'
import { fetchChapterReleases, ChapterRelease } from '../services/analyticsService'
import { Link } from 'react-router-dom'
import { useMemo } from 'react'

interface JumpIssue {
  jump: string
  chapters: number[]
  isDouble: boolean
  issueEnd: number | null // For merged cells in double issues
}

interface YearData {
  year: number
  issues: Map<number, JumpIssue>
  doubleIssueSpans: Set<number> // Track which issue numbers are part of a double issue span
}

function ChapterReleaseCalendarPage() {
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
        const chapters = issueReleases.map((r) => r.number)
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
          chapters,
          isDouble,
          issueEnd,
        })
      })

      years.push({ year, issues, doubleIssueSpans })
    })

    return years
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

      {/* Legend */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Legend:</h3>
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

                  return (
                    <td
                      key={`${yearData.year}-${issueNum}`}
                      rowSpan={rowSpan}
                      className="border-2 border-gray-300 bg-green-500 px-1 py-1 text-center align-middle"
                    >
                      {issue.chapters.map((chapterNum, idx) => (
                        <span key={chapterNum}>
                          <Link
                            to={`/chapters/${chapterNum}`}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            {chapterNum}
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
