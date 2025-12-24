import { useQuery } from '@tanstack/react-query'
import { fetchChapterReleases, ChapterRelease } from '../services/analyticsService'
import { useMemo } from 'react'
import { StatCard } from '../components/analytics'
import { ChartCard } from '../components/common/ChartCard'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

function PublicationRatePage() {
  const { data: releases, isLoading, error } = useQuery<ChapterRelease[]>({
    queryKey: ['analytics', 'chapter-releases'],
    queryFn: fetchChapterReleases,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Calculate yearly statistics (chapters and breaks per year)
  const yearlyStats = useMemo(() => {
    if (!releases) return []

    const sortedReleases = [...releases].sort((a, b) => a.number - b.number)
    const yearlyData = new Map<number, {
      chapters: number
      breaks: number
      firstIssue: number
      lastIssue: number
      issuesWithChapters: Set<number> // Track unique issues that had chapters
      firstChapter: number | null
      lastChapter: number | null
    }>()

    // Initialize all years with chapter count and track first/last issues
    sortedReleases.forEach((release) => {
      if (release.year && release.issue !== null) {
        if (!yearlyData.has(release.year)) {
          yearlyData.set(release.year, {
            chapters: 0,
            breaks: 0,
            firstIssue: release.issue,
            lastIssue: release.issue,
            issuesWithChapters: new Set(),
            firstChapter: null,
            lastChapter: null
          })
        }
        const yearData = yearlyData.get(release.year)!
        yearData.chapters++
        // Update first and last issue numbers
        yearData.firstIssue = Math.min(yearData.firstIssue, release.issue)
        yearData.lastIssue = Math.max(yearData.lastIssue, release.issue)

        // Track first and last chapter numbers
        if (yearData.firstChapter === null || release.number < yearData.firstChapter) {
          yearData.firstChapter = release.number
        }
        if (yearData.lastChapter === null || release.number > yearData.lastChapter) {
          yearData.lastChapter = release.number
        }

        // Track which issues had chapters (for calculating weeks)
        // For double issues, mark all spanned issue numbers
        yearData.issuesWithChapters.add(release.issue)
        if (release.issueEnd !== null && release.issueEnd > release.issue) {
          for (let i = release.issue + 1; i <= release.issueEnd; i++) {
            yearData.issuesWithChapters.add(i)
          }
        }
      }
    })

    // Calculate breaks per year using the same logic as total breaks
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
            weeksBetween -= (previous.issueEnd - previous.issue)
          }

          // Subtract 1 for the expected next issue
          weeksBetween -= 1

          // Check if there's an issue 53 in between and subtract it
          if (previous.issue < 53 && current.issue > 53) {
            weeksBetween -= 1
          }

          // Add breaks to the current year
          if (weeksBetween > 0) {
            yearlyData.get(current.year)!.breaks += weeksBetween
          }
        } else if (current.year === previous.year + 1) {
          // Year transition - distribute breaks between years
          // Calculate total weeks between
          let totalWeeksBetween = (52 - previous.issue) + current.issue

          // Adjust for double issues
          if (previous.issueEnd !== null && previous.issueEnd > previous.issue) {
            totalWeeksBetween -= (previous.issueEnd - previous.issue)
          }

          // Subtract 1 for expected next issue
          totalWeeksBetween -= 1

          // Issue 53 is always excluded
          totalWeeksBetween -= 1

          if (totalWeeksBetween > 0) {
            // Calculate breaks before end of previous year
            const breaksInPreviousYear = 52 - previous.issue - (previous.issueEnd ? (previous.issueEnd - previous.issue) : 0) - 1

            // Calculate breaks in current year
            const breaksInCurrentYear = current.issue - 1

            // Add breaks to respective years
            if (breaksInPreviousYear > 0 && yearlyData.has(previous.year)) {
              yearlyData.get(previous.year)!.breaks += breaksInPreviousYear
            }
            if (breaksInCurrentYear > 0 && yearlyData.has(current.year)) {
              yearlyData.get(current.year)!.breaks += breaksInCurrentYear
            }
          }
        }
      }
    }

    // Convert to array and sort by year
    return Array.from(yearlyData.entries())
      .map(([year, data]) => {
        // Calculate available weeks = chapters + breaks
        // This is the simplest and most accurate way
        const availableWeeks = data.chapters + data.breaks

        return {
          year,
          chapters: data.chapters,
          breaks: data.breaks,
          availableWeeks,
          firstChapter: data.firstChapter,
          lastChapter: data.lastChapter,
        }
      })
      .sort((a, b) => a.year - b.year)
  }, [releases])

  // Calculate overall statistics
  const stats = useMemo(() => {
    if (yearlyStats.length === 0 || !releases) {
      return {
        totalYears: 0,
        totalChapters: 0,
        totalBreaks: 0,
        averagePublicationRate: 0,
        last5YearsRate: 0,
        mostPublishedYear: null,
        leastPublishedYear: null,
        mostBreaksYear: null,
        leastBreaksYear: null,
        longestStreak: 0,
        longestStreakInfo: null,
      }
    }

    const totalChapters = yearlyStats.reduce((sum, year) => sum + year.chapters, 0)
    const totalBreaks = yearlyStats.reduce((sum, year) => sum + year.breaks, 0)
    const totalWeeks = yearlyStats.reduce((sum, year) => sum + year.availableWeeks, 0)
    const averagePublicationRate = (totalChapters / totalWeeks) * 100

    // Calculate last 5 years average publication rate
    const last5Years = yearlyStats.slice(-5)
    const last5YearsChapters = last5Years.reduce((sum, year) => sum + year.chapters, 0)
    const last5YearsWeeks = last5Years.reduce((sum, year) => sum + year.availableWeeks, 0)
    const last5YearsRate = last5YearsWeeks > 0 ? (last5YearsChapters / last5YearsWeeks) * 100 : 0

    // Find extreme years (excluding first and last year)
    const validYears = yearlyStats.length >= 3 ? yearlyStats.slice(1, -1) : []

    let mostPublishedYear = null
    let leastPublishedYear = null
    let mostBreaksYear = null
    let leastBreaksYear = null

    if (validYears.length > 0) {
      mostPublishedYear = validYears.reduce((max, year) =>
        year.chapters > max.chapters ? year : max
      , validYears[0])
      leastPublishedYear = validYears.reduce((min, year) =>
        year.chapters < min.chapters ? year : min
      , validYears[0])
      mostBreaksYear = validYears.reduce((max, year) =>
        year.breaks > max.breaks ? year : max
      , validYears[0])
      leastBreaksYear = validYears.reduce((min, year) =>
        year.breaks < min.breaks ? year : min
      , validYears[0])
    }

    // Calculate longest streak without break
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
      }
    }

    const longestStreakInfo = longestStreak > 0 ? {
      chapters: longestStreak,
      fromChapter: sortedReleases[longestStreakStart].number,
      toChapter: sortedReleases[longestStreakEnd].number
    } : null

    return {
      totalYears: yearlyStats.length,
      totalChapters,
      totalBreaks,
      averagePublicationRate: parseFloat(averagePublicationRate.toFixed(1)),
      last5YearsRate: parseFloat(last5YearsRate.toFixed(1)),
      mostPublishedYear,
      leastPublishedYear,
      mostBreaksYear,
      leastBreaksYear,
      longestStreak,
      longestStreakInfo,
    }
  }, [yearlyStats, releases])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
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
            <p>Error loading publication rate data. Please try again later.</p>
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
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 opacity-60 rounded-2xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 md:w-9 md:h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                  Publication Rate Analytics
                </h1>
                <p className="text-gray-600 text-lg mt-2">
                  Track One Piece's publication consistency year by year
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
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
            color="blue"
            loading={isLoading}
          />
          <StatCard
            label="Least Published Year"
            value={stats.leastPublishedYear ? String(stats.leastPublishedYear.year) : '-'}
            subtitle={stats.leastPublishedYear ? `${stats.leastPublishedYear.chapters} published, ${stats.leastPublishedYear.breaks} breaks` : undefined}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                />
              </svg>
            }
            color="purple"
            loading={isLoading}
          />
          <StatCard
            label="Total Break Weeks"
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
            label="Average Publication Rate"
            value={`${stats.averagePublicationRate}% (~${Math.round(stats.averagePublicationRate * 0.48)} ch/yr)`}
            subtitle={`Last 5 years: ${stats.last5YearsRate}% (~${Math.round(stats.last5YearsRate * 0.48)} ch/yr)`}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            }
            color="green"
            loading={isLoading}
          />
        </div>

        {/* Stacked Bar Chart */}
        <ChartCard
          title="Yearly Publication Statistics"
          downloadFileName="publication-rate-by-year"
        >
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={yearlyStats}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="year"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <YAxis
                label={{ value: 'Weeks', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px',
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'chapters') return [value, 'Chapters']
                  if (name === 'breaks') return [value, 'Breaks']
                  return [value, name]
                }}
                labelFormatter={(label: number) => `Year ${label}`}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    const publicationRate = ((data.chapters / data.availableWeeks) * 100).toFixed(1)
                    return (
                      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                        <p className="font-semibold text-gray-900 mb-2">Year {label}</p>
                        <p className="text-sm text-gray-700">
                          <span className="inline-block w-3 h-3 bg-green-500 rounded mr-2"></span>
                          Chapters: <span className="font-medium">{data.chapters}</span>
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="inline-block w-3 h-3 bg-red-500 rounded mr-2"></span>
                          Breaks: <span className="font-medium">{data.breaks}</span>
                        </p>
                        <div className="border-t border-gray-200 my-2"></div>
                        <p className="text-sm text-gray-700">
                          Available Weeks: <span className="font-medium">{data.availableWeeks}</span>
                        </p>
                        <p className="text-sm text-gray-700">
                          Publication Rate: <span className="font-medium">{publicationRate}%</span>
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value: string) => {
                  if (value === 'chapters') return 'Chapters Published'
                  if (value === 'breaks') return 'Break Weeks'
                  return value
                }}
              />
              <Bar dataKey="chapters" stackId="a" fill="#10b981" name="chapters" />
              <Bar dataKey="breaks" stackId="a" fill="#ef4444" name="breaks" />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-500 mt-4">
            Each bar represents the total available weeks for that year. Green shows weeks with chapters published, red shows break weeks.
          </p>
        </ChartCard>

        {/* Yearly Statistics Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Yearly Statistics</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border border-gray-200">
                    Year
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 border border-gray-200">
                    Chapter Range
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 border border-gray-200">
                    Chapters Published
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 border border-gray-200">
                    Break Weeks
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 border border-gray-200">
                    Available Weeks
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 border border-gray-200">
                    Publication Rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {yearlyStats.map((yearStat, index) => {
                  const publicationRate = ((yearStat.chapters / yearStat.availableWeeks) * 100).toFixed(1)

                  // Find min/max for chapters and breaks (excluding first and last years)
                  const validYearsForComparison = yearlyStats.slice(1, -1)
                  const maxChapters = validYearsForComparison.length > 0
                    ? Math.max(...validYearsForComparison.map(y => y.chapters))
                    : 0
                  const minChapters = validYearsForComparison.length > 0
                    ? Math.min(...validYearsForComparison.map(y => y.chapters))
                    : 0
                  const maxBreaks = validYearsForComparison.length > 0
                    ? Math.max(...validYearsForComparison.map(y => y.breaks))
                    : 0
                  const minBreaks = validYearsForComparison.length > 0
                    ? Math.min(...validYearsForComparison.map(y => y.breaks))
                    : 0

                  // Check if current year should be highlighted (not first or last)
                  const isFirstYear = index === 0
                  const isLastYear = index === yearlyStats.length - 1
                  const shouldHighlight = !isFirstYear && !isLastYear

                  const isMaxChapters = shouldHighlight && yearStat.chapters === maxChapters
                  const isMinChapters = shouldHighlight && yearStat.chapters === minChapters
                  const isMaxBreaks = shouldHighlight && yearStat.breaks === maxBreaks
                  const isMinBreaks = shouldHighlight && yearStat.breaks === minBreaks

                  return (
                    <tr
                      key={yearStat.year}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-200">
                        {yearStat.year}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border border-gray-200">
                        {yearStat.firstChapter !== null && yearStat.lastChapter !== null
                          ? `${yearStat.firstChapter} - ${yearStat.lastChapter}`
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right border border-gray-200">
                        <span className={isMaxChapters ? 'font-bold text-green-600' : isMinChapters ? 'font-bold text-red-600' : 'text-gray-700'}>
                          {yearStat.chapters}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right border border-gray-200">
                        <span className={isMaxBreaks ? 'font-bold text-red-600' : isMinBreaks ? 'font-bold text-green-600' : 'text-gray-700'}>
                          {yearStat.breaks}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700 border border-gray-200">
                        {yearStat.availableWeeks}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold border border-gray-200"
                        style={{
                          color: parseFloat(publicationRate) === 100 ? '#10b981' : // green
                                 parseFloat(publicationRate) >= 95 ? '#3b82f6' : // blue
                                 parseFloat(publicationRate) >= 90 ? '#f59e0b' : // amber
                                 '#ef4444' // red
                        }}
                      >
                        {publicationRate}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50 font-semibold">
                  <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">
                    Total
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-900 border border-gray-200">
                    {yearlyStats.length > 0 && yearlyStats[0].firstChapter !== null && yearlyStats[yearlyStats.length - 1].lastChapter !== null
                      ? `${yearlyStats[0].firstChapter} - ${yearlyStats[yearlyStats.length - 1].lastChapter}`
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 border border-gray-200">
                    {yearlyStats.reduce((sum, year) => sum + year.chapters, 0)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 border border-gray-200">
                    {yearlyStats.reduce((sum, year) => sum + year.breaks, 0)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 border border-gray-200">
                    {yearlyStats.reduce((sum, year) => sum + year.availableWeeks, 0)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 border border-gray-200">
                    {stats.averagePublicationRate}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-xs text-gray-500">
              <strong>Publication Rate:</strong> (Chapters Published / Available Weeks) × 100%
            </p>
            <p className="text-xs text-gray-500">
              <strong>Available Weeks:</strong> The total number of weeks in the publishing period = Chapters Published + Break Weeks. This represents all weeks from the first to last chapter of that year.
            </p>
            <p className="text-xs text-gray-500">
              <strong>Note:</strong> Break weeks account for planned breaks, holidays, and Jump's annual breaks (typically around Issue 4-5 combined issue and year-end combined issues). When there are no breaks, the rate is 100%.
            </p>
            <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
                <span className="text-xs text-gray-600">100% (Perfect)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
                <span className="text-xs text-gray-600">95-99% (Excellent)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
                <span className="text-xs text-gray-600">90-94% (Good)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
                <span className="text-xs text-gray-600">&lt;90% (Many Breaks)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default PublicationRatePage
