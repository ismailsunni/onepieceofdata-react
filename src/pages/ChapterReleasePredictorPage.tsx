import { useQuery } from '@tanstack/react-query'
import {
  fetchChapterReleases,
  ChapterRelease,
} from '../services/analyticsService'
import { Link } from 'react-router-dom'
import { useMemo, useState, useCallback } from 'react'
import { StatCard } from '../components/analytics'

// ─── Prediction types & hooks ───────────────────────────────────────────────

interface ScheduleEntry {
  type: 'chapter' | 'break'
  chapter?: number
  issue: number
  issueEnd: number | null // non-null if historically a double issue
  year: number
  date: Date
  daysAway: number
}

interface JumpIssueStats {
  schedule: ScheduleEntry[]
  avgDays: number
  daysPerIssue: number
  breakRate: number
  sampleSize: number
  latestChapterNumber: number
}

function useJumpIssuePrediction(
  releases: ChapterRelease[] | undefined
): JumpIssueStats | null {
  return useMemo(() => {
    if (!releases || releases.length < 10) return null

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

    if (recent.length < 5) return null

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
      const yearsDiff = curr.year! - prev.year!
      const issueDiff = curr.issue! - prevEffective + yearsDiff * 52
      if (issueDiff > 0 && issueDiff < 20) issueGaps.push(issueDiff)
    }

    if (issueGaps.length < 5) return null

    const avgDays = dayGaps.reduce((s, g) => s + g, 0) / dayGaps.length
    const totalDays = dayGaps.reduce((s, g) => s + g, 0)
    const totalIssues = issueGaps.reduce((s, g) => s + g, 0)
    const daysPerIssue = totalDays / totalIssues
    const breakRate = issueGaps.filter((g) => g > 1).length / issueGaps.length

    // Map from issue number → issueEnd for historically double issues
    const doubleIssueMap = new Map<number, number>()
    recent.forEach((r) => {
      if (r.issueEnd != null && r.issueEnd > r.issue!) {
        doubleIssueMap.set(r.issue!, r.issueEnd)
      }
    })

    const latest = recent[recent.length - 1]
    const latestDate = new Date(latest.date!)
    const latestEffectiveIssue = latest.issueEnd ?? latest.issue!
    const latestYear = latest.year!

    // Use the last 10 actual gaps to replay the break pattern forward
    const patternGaps = issueGaps.slice(-10)

    const schedule: ScheduleEntry[] = []
    let chaptersFound = 0
    let gapIdx = 0
    let currentIssue = latestEffectiveIssue
    let currentYear = latestYear
    let currentDate = latestDate

    const advanceIssue = (
      issue: number,
      year: number
    ): { issue: number; year: number } => {
      issue++
      if (issue > 52) {
        issue = 1
        year++
      }
      return { issue, year }
    }

    while (chaptersFound < 5) {
      const gap = patternGaps[gapIdx % patternGaps.length]
      gapIdx++

      // Add break issues before the next chapter
      for (let b = 1; b < gap; b++) {
        ;({ issue: currentIssue, year: currentYear } = advanceIssue(
          currentIssue,
          currentYear
        ))
        const issueEnd = doubleIssueMap.get(currentIssue) ?? null
        const breakDate = new Date(
          currentDate.getTime() + daysPerIssue * 24 * 60 * 60 * 1000
        )
        schedule.push({
          type: 'break',
          issue: currentIssue,
          issueEnd,
          year: currentYear,
          date: breakDate,
          daysAway: Math.round(
            (breakDate.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24)
          ),
        })
        currentDate = breakDate
        // If double issue, skip to the end number
        if (issueEnd != null) currentIssue = issueEnd
      }

      // Advance to the chapter issue
      ;({ issue: currentIssue, year: currentYear } = advanceIssue(
        currentIssue,
        currentYear
      ))
      const chapterIssueEnd = doubleIssueMap.get(currentIssue) ?? null
      const chapterDate = new Date(
        currentDate.getTime() + daysPerIssue * 24 * 60 * 60 * 1000
      )
      schedule.push({
        type: 'chapter',
        chapter: latest.number + chaptersFound + 1,
        issue: currentIssue,
        issueEnd: chapterIssueEnd,
        year: currentYear,
        date: chapterDate,
        daysAway: Math.round(
          (chapterDate.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24)
        ),
      })
      if (chapterIssueEnd != null) currentIssue = chapterIssueEnd
      currentDate = chapterDate
      chaptersFound++
    }

    return {
      schedule,
      avgDays,
      daysPerIssue,
      breakRate,
      sampleSize: recent.length,
      latestChapterNumber: latest.number,
    }
  }, [releases])
}

interface PredictionResult {
  chapter: number
  estimatedDate: Date
  earliestDate: Date
  latestDate: Date
  chaptersAway: number
}

interface DatePredictionResult {
  date: Date
  estimatedChapter: number
  earliestChapter: number
  latestChapter: number
  daysAway: number
}

function useChapterPrediction(releases: ChapterRelease[] | undefined) {
  const cadenceStats = useMemo(() => {
    if (!releases || releases.length < 10) return null

    const withDates = releases
      .filter((r) => r.date)
      .sort((a, b) => a.number - b.number)

    if (withDates.length < 10) return null

    // Use last 52 chapters (roughly 1 year) for stats
    const recent = withDates.slice(-52)
    const gaps: number[] = []

    for (let i = 1; i < recent.length; i++) {
      const d1 = new Date(recent[i - 1].date!)
      const d2 = new Date(recent[i].date!)
      const diffDays = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)
      gaps.push(diffDays)
    }

    const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length
    const sortedGaps = [...gaps].sort((a, b) => a - b)
    const p10 = sortedGaps[Math.floor(gaps.length * 0.1)]
    const p90 = sortedGaps[Math.floor(gaps.length * 0.9)]

    const latestChapter = withDates[withDates.length - 1]

    return {
      avgDaysPerChapter: avgGap,
      optimisticDays: p10,
      pessimisticDays: p90,
      latestChapterNumber: latestChapter.number,
      latestChapterDate: new Date(latestChapter.date!),
      sampleSize: gaps.length,
    }
  }, [releases])

  const predict = useCallback(
    (targetChapter: number): PredictionResult | null => {
      if (!cadenceStats) return null
      const chaptersAway = targetChapter - cadenceStats.latestChapterNumber
      if (chaptersAway <= 0) return null

      const estimatedMs =
        cadenceStats.latestChapterDate.getTime() +
        chaptersAway * cadenceStats.avgDaysPerChapter * 24 * 60 * 60 * 1000
      const earliestMs =
        cadenceStats.latestChapterDate.getTime() +
        chaptersAway * cadenceStats.optimisticDays * 24 * 60 * 60 * 1000
      const latestMs =
        cadenceStats.latestChapterDate.getTime() +
        chaptersAway * cadenceStats.pessimisticDays * 24 * 60 * 60 * 1000

      return {
        chapter: targetChapter,
        estimatedDate: new Date(estimatedMs),
        earliestDate: new Date(earliestMs),
        latestDate: new Date(latestMs),
        chaptersAway,
      }
    },
    [cadenceStats]
  )

  const predictByDate = useCallback(
    (targetDate: Date): DatePredictionResult | null => {
      if (!cadenceStats) return null
      const daysAway =
        (targetDate.getTime() - cadenceStats.latestChapterDate.getTime()) /
        (1000 * 60 * 60 * 24)
      if (daysAway <= 0) return null

      const estimated = Math.floor(
        cadenceStats.latestChapterNumber +
          daysAway / cadenceStats.avgDaysPerChapter
      )
      const earliest = Math.floor(
        cadenceStats.latestChapterNumber +
          daysAway / cadenceStats.pessimisticDays
      )
      const latest = Math.floor(
        cadenceStats.latestChapterNumber +
          daysAway / cadenceStats.optimisticDays
      )

      return {
        date: targetDate,
        estimatedChapter: estimated,
        earliestChapter: earliest,
        latestChapter: latest,
        daysAway: Math.round(daysAway),
      }
    },
    [cadenceStats]
  )

  return { cadenceStats, predict, predictByDate }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

type ChapterResult =
  | { type: 'prediction'; data: PredictionResult }
  | { type: 'actual'; chapter: number; date: string; jump: string | null }

type DateResult =
  | { type: 'prediction'; data: DatePredictionResult }
  | { type: 'actual'; date: Date; latestChapter: ChapterRelease }

// ─── Page Component ─────────────────────────────────────────────────────────

function ChapterReleasePredictorPage() {
  const {
    data: releases,
    isLoading,
    error,
  } = useQuery<ChapterRelease[]>({
    queryKey: ['analytics', 'chapter-releases'],
    queryFn: fetchChapterReleases,
    staleTime: 5 * 60 * 1000,
  })

  const { cadenceStats, predict, predictByDate } =
    useChapterPrediction(releases)
  const jumpStats = useJumpIssuePrediction(releases)
  const [chapterInput, setChapterInput] = useState('')
  const [chapterResult, setChapterResult] = useState<ChapterResult | null>(null)
  const [dateInput, setDateInput] = useState('')
  const [dateResult, setDateResult] = useState<DateResult | null>(null)

  const sortedReleases = useMemo(
    () =>
      releases
        ? [...releases]
            .filter((r) => r.date)
            .sort((a, b) => a.number - b.number)
        : [],
    [releases]
  )

  const handleChapterPredict = () => {
    const num = parseInt(chapterInput)
    if (isNaN(num) || num < 1) {
      setChapterResult(null)
      return
    }
    const existing = sortedReleases.find((r) => r.number === num)
    if (existing) {
      setChapterResult({
        type: 'actual',
        chapter: num,
        date: existing.date!,
        jump: existing.jump,
      })
    } else {
      const prediction = predict(num)
      if (prediction) {
        setChapterResult({ type: 'prediction', data: prediction })
      } else {
        setChapterResult(null)
      }
    }
  }

  const handleDatePredict = () => {
    if (!dateInput) {
      setDateResult(null)
      return
    }
    const target = new Date(dateInput + 'T00:00:00')

    if (cadenceStats && target <= cadenceStats.latestChapterDate) {
      const chaptersBeforeDate = sortedReleases.filter(
        (r) => new Date(r.date!) <= target
      )
      if (chaptersBeforeDate.length > 0) {
        setDateResult({
          type: 'actual',
          date: target,
          latestChapter: chaptersBeforeDate[chaptersBeforeDate.length - 1],
        })
      } else {
        setDateResult(null)
      }
    } else {
      const prediction = predictByDate(target)
      if (prediction) {
        setDateResult({ type: 'prediction', data: prediction })
      } else {
        setDateResult(null)
      }
    }
  }

  // Milestone chapters
  const milestoneChapters = [1200, 1250, 1300, 1500, 2000]
  type MilestoneRow =
    | { chapter: number; type: 'actual'; date: string; jump: string | null }
    | { chapter: number; type: 'prediction'; prediction: PredictionResult }
  const milestoneRows: MilestoneRow[] = milestoneChapters
    .map((ch) => {
      const existing = sortedReleases.find((r) => r.number === ch)
      if (existing) {
        return {
          chapter: ch,
          type: 'actual' as const,
          date: existing.date!,
          jump: existing.jump,
        }
      }
      const prediction = predict(ch)
      if (prediction) {
        return {
          chapter: ch,
          type: 'prediction' as const,
          prediction,
        }
      }
      return null
    })
    .filter((r): r is MilestoneRow => r !== null)

  // Special dates
  const specialDateDefs = [
    { label: "Oda's 52nd Birthday (Jan 1, 2027)", date: '2027-01-01' },
    { label: 'OP 30th Anniversary (Jul 22, 2027)', date: '2027-07-22' },
    { label: "Oda's 53rd Birthday (Jan 1, 2028)", date: '2028-01-01' },
    { label: "Oda's 55th Birthday (Jan 1, 2030)", date: '2030-01-01' },
    { label: 'OP 33rd Anniversary (Jul 22, 2030)', date: '2030-07-22' },
  ]
  type SpecialDateRow =
    | {
        label: string
        date: string
        type: 'actual'
        latestChapter: ChapterRelease
      }
    | {
        label: string
        date: string
        type: 'prediction'
        prediction: DatePredictionResult
      }
  const specialDateRows: SpecialDateRow[] = specialDateDefs
    .map((d) => {
      const target = new Date(d.date + 'T00:00:00')
      if (cadenceStats && target <= cadenceStats.latestChapterDate) {
        const chaptersBeforeDate = sortedReleases.filter(
          (r) => new Date(r.date!) <= target
        )
        if (chaptersBeforeDate.length > 0) {
          return {
            ...d,
            type: 'actual' as const,
            latestChapter: chaptersBeforeDate[chaptersBeforeDate.length - 1],
          }
        }
        return null
      }
      const prediction = predictByDate(target)
      if (prediction) {
        return { ...d, type: 'prediction' as const, prediction }
      }
      return null
    })
    .filter((r): r is SpecialDateRow => r !== null)

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600"></div>
        </div>
      </main>
    )
  }

  if (error || !cadenceStats) {
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
            Chapter Release Predictor
          </span>
        </nav>

        {/* Hero */}
        <div className="relative mb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 opacity-60 rounded-2xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">
                  Chapter Release Predictor
                </h1>
                <p className="text-gray-600 text-lg mt-2">
                  Estimate future chapter release dates based on recent cadence
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <StatCard
            label="Latest Chapter"
            value={`Ch. ${cadenceStats.latestChapterNumber}`}
            subtitle={formatDate(cadenceStats.latestChapterDate)}
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            }
            color="blue"
          />
          <StatCard
            label="Avg Days/Chapter"
            value={cadenceStats.avgDaysPerChapter.toFixed(1)}
            subtitle={`Based on last ${cadenceStats.sampleSize} intervals`}
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
            color="amber"
          />
          <StatCard
            label="Confidence Range"
            value={`${cadenceStats.optimisticDays}–${cadenceStats.pessimisticDays}d`}
            subtitle="10th–90th percentile"
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
            color="emerald"
          />
        </div>

        {/* Next 5 Chapters — Jump Issue Forecast */}
        {jumpStats && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Next 5 Chapters — Jump Issue Forecast
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Based on {jumpStats.sampleSize} chapters over the last 3 years
                  · avg {jumpStats.avgDays.toFixed(1)} days/chapter ·{' '}
                  {Math.round(jumpStats.breakRate * 100)}% break rate ·{' '}
                  {jumpStats.daysPerIssue.toFixed(1)} days/issue
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">
                      Chapter
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">
                      Est. Date
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">
                      Jump Issue
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">
                      Days Away
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {jumpStats.schedule.map((entry, idx) =>
                    entry.type === 'chapter' ? (
                      <tr
                        key={`ch-${entry.chapter}`}
                        className="border-b border-gray-100 hover:bg-amber-50/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold text-amber-700">
                          Ch. {entry.chapter}
                        </td>
                        <td className="px-4 py-3 text-gray-800">
                          {formatDate(entry.date)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">
                            {entry.year} Issue{' '}
                            {entry.issueEnd != null
                              ? `${entry.issue}–${entry.issueEnd}`
                              : entry.issue}
                          </span>
                          {entry.issueEnd != null && (
                            <span className="ml-2 inline-block px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                              double
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {entry.daysAway === 0
                            ? 'Today'
                            : entry.daysAway === 1
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
                          {formatDate(entry.date)}
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
                          ~{entry.daysAway}d
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Break weeks and double issues are inferred from 3-year historical
              patterns. Dates are estimates.
            </p>
          </div>
        )}

        {/* Predictor Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Custom Prediction Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Predict by Chapter */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                When will chapter X be released?
              </h4>
              <div className="flex gap-2 mb-3">
                <input
                  id="chapter-predict"
                  type="number"
                  min={1}
                  placeholder={`e.g. ${cadenceStats.latestChapterNumber + 10}`}
                  value={chapterInput}
                  onChange={(e) => setChapterInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChapterPredict()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors"
                />
                <button
                  onClick={handleChapterPredict}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Look up
                </button>
              </div>
              {chapterResult?.type === 'actual' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Chapter {chapterResult.chapter}
                    <span className="ml-2 inline-block px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                      Already released
                    </span>
                  </p>
                  <p className="text-sm text-blue-800">
                    Released on{' '}
                    <span className="font-semibold">
                      {formatDate(new Date(chapterResult.date))}
                    </span>
                    {chapterResult.jump && (
                      <span className="text-blue-600 ml-1">
                        ({chapterResult.jump})
                      </span>
                    )}
                  </p>
                </div>
              )}
              {chapterResult?.type === 'prediction' && (
                <div className="bg-white border border-amber-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    Chapter {chapterResult.data.chapter}{' '}
                    <span className="text-gray-500">
                      (+{chapterResult.data.chaptersAway})
                    </span>
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <p className="text-green-600 font-medium">Earliest</p>
                      <p className="text-green-800">
                        {formatDate(chapterResult.data.earliestDate)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-amber-600 font-medium">Estimated</p>
                      <p className="font-semibold text-amber-900">
                        {formatDate(chapterResult.data.estimatedDate)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-red-600 font-medium">Latest</p>
                      <p className="text-red-800">
                        {formatDate(chapterResult.data.latestDate)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Predict by Date */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                What chapter will be out by a date?
              </h4>
              <div className="flex gap-2 mb-3">
                <input
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDatePredict()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors"
                />
                <button
                  onClick={handleDatePredict}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Look up
                </button>
              </div>
              {dateResult?.type === 'actual' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    {formatDate(dateResult.date)}
                    <span className="ml-2 inline-block px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                      Already passed
                    </span>
                  </p>
                  <p className="text-sm text-blue-800">
                    Latest chapter by that date:{' '}
                    <span className="font-semibold">
                      Ch. {dateResult.latestChapter.number}
                    </span>
                    <span className="text-blue-600 ml-1">
                      (released{' '}
                      {formatDate(new Date(dateResult.latestChapter.date!))})
                    </span>
                  </p>
                </div>
              )}
              {dateResult?.type === 'prediction' && (
                <div className="bg-white border border-amber-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    By {formatDate(dateResult.data.date)}{' '}
                    <span className="text-gray-500">
                      ({dateResult.data.daysAway} days away)
                    </span>
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <p className="text-green-600 font-medium">Min</p>
                      <p className="text-green-800 font-semibold text-base">
                        {dateResult.data.earliestChapter}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-amber-600 font-medium">Estimated</p>
                      <p className="font-bold text-amber-900 text-base">
                        {dateResult.data.estimatedChapter}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-red-600 font-medium">Max</p>
                      <p className="text-red-800 font-semibold text-base">
                        {dateResult.data.latestChapter}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Milestone Chapters Table */}
          {milestoneRows.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Milestone Chapters
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        Chapter
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        Earliest
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        Estimated / Actual
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        Latest
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {milestoneRows.map((row) =>
                      row.type === 'actual' ? (
                        <tr
                          key={row.chapter}
                          className="border-b border-gray-100 bg-blue-50/50"
                        >
                          <td className="px-4 py-2 font-semibold text-blue-700">
                            {row.chapter}
                          </td>
                          <td className="px-4 py-2">
                            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                              Released
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-400">—</td>
                          <td className="px-4 py-2 font-medium text-blue-900">
                            {formatDate(new Date(row.date))}
                            {row.jump && (
                              <span className="text-xs text-gray-400 ml-1">
                                ({row.jump})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-gray-400">—</td>
                        </tr>
                      ) : (
                        <tr
                          key={row.chapter}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="px-4 py-2 font-semibold text-amber-700">
                            {row.chapter}
                          </td>
                          <td className="px-4 py-2">
                            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                              +{row.prediction.chaptersAway}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-green-700">
                            {formatDate(row.prediction.earliestDate)}
                          </td>
                          <td className="px-4 py-2 font-medium text-amber-900">
                            {formatDate(row.prediction.estimatedDate)}
                          </td>
                          <td className="px-4 py-2 text-red-700">
                            {formatDate(row.prediction.latestDate)}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Special Dates Table */}
          {specialDateRows.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Chapter on Special Dates
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        Min Chapter
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        Est. / Actual Chapter
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        Max Chapter
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {specialDateRows.map((row) =>
                      row.type === 'actual' ? (
                        <tr
                          key={row.date}
                          className="border-b border-gray-100 bg-blue-50/50"
                        >
                          <td className="px-4 py-2 font-medium text-gray-900">
                            {row.label}
                          </td>
                          <td className="px-4 py-2">
                            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                              Past
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-400">—</td>
                          <td className="px-4 py-2 font-medium text-blue-900">
                            Ch. {row.latestChapter.number}
                            <span className="text-xs text-gray-400 ml-1">
                              (released{' '}
                              {formatDate(new Date(row.latestChapter.date!))})
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-400">—</td>
                        </tr>
                      ) : (
                        <tr
                          key={row.date}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="px-4 py-2 font-medium text-gray-900">
                            {row.label}
                          </td>
                          <td className="px-4 py-2">
                            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                              {row.prediction.daysAway}d away
                            </span>
                          </td>
                          <td className="px-4 py-2 text-green-700">
                            {row.prediction.earliestChapter}
                          </td>
                          <td className="px-4 py-2 font-medium text-amber-900">
                            {row.prediction.estimatedChapter}
                          </td>
                          <td className="px-4 py-2 text-red-700">
                            {row.prediction.latestChapter}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-4 text-center">
            Based on Ch. {cadenceStats.latestChapterNumber} released{' '}
            {formatDate(cadenceStats.latestChapterDate)}. Predictions use
            10th–90th percentile of recent chapter gaps.
          </p>
        </div>
      </div>
    </main>
  )
}

export default ChapterReleasePredictorPage
