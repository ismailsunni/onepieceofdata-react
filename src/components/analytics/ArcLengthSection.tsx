import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchArcs } from '../../services/arcService'
import { fetchSagas } from '../../services/sagaService'
import ArcLengthChart, { type ArcMetric } from '../ArcLengthChart'
import { StatCard, FilterButton, SectionHeader } from '.'
import type { ArcPages } from '../../services/analytics/insightsAnalytics'

interface ArcLengthSectionProps {
  pagesPerArc?: ArcPages[]
}

export function ArcLengthSection({ pagesPerArc = [] }: ArcLengthSectionProps) {
  const [selectedSaga, setSelectedSaga] = useState<string | null>(null)
  const [metric, setMetric] = useState<ArcMetric>('chapters')

  const pagesByArcTitle = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of pagesPerArc) map.set(p.arc, p.totalPages)
    return map
  }, [pagesPerArc])

  // Fetch arcs and sagas data
  const { data: arcs = [], isLoading: arcsLoading } = useQuery({
    queryKey: ['arcs'],
    queryFn: fetchArcs,
  })

  const { data: sagas = [], isLoading: sagasLoading } = useQuery({
    queryKey: ['sagas'],
    queryFn: fetchSagas,
  })

  // Filter arcs by selected saga
  const filteredArcs = useMemo(() => {
    if (!selectedSaga) return arcs
    return arcs.filter((arc) => arc.saga?.title === selectedSaga)
  }, [arcs, selectedSaga])

  // Calculate statistics
  const stats = useMemo(() => {
    if (filteredArcs.length === 0) {
      return {
        totalArcs: 0,
        longestArc: { title: '-', chapters: 0 },
        shortestArc: { title: '-', chapters: 0 },
        averageLength: 0,
      }
    }

    const arcLengths = filteredArcs.map((arc) => ({
      title: arc.title,
      chapters: arc.end_chapter - arc.start_chapter + 1,
    }))

    const longest = arcLengths.reduce((max, arc) =>
      arc.chapters > max.chapters ? arc : max
    )
    const shortest = arcLengths.reduce((min, arc) =>
      arc.chapters < min.chapters ? arc : min
    )
    const average =
      arcLengths.reduce((sum, arc) => sum + arc.chapters, 0) / arcLengths.length

    return {
      totalArcs: filteredArcs.length,
      longestArc: longest,
      shortestArc: shortest,
      averageLength: Math.round(average),
    }
  }, [filteredArcs])

  const isLoading = arcsLoading || sagasLoading

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <>
      {/* Key Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <StatCard
          label="Total Story Arcs"
          value={stats.totalArcs}
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          }
          color="purple"
          loading={isLoading}
        />
        <StatCard
          label="Longest Arc"
          value={`${stats.longestArc.chapters} ch`}
          subtitle={stats.longestArc.title}
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
          color="blue"
          loading={isLoading}
        />
        <StatCard
          label="Shortest Arc"
          value={`${stats.shortestArc.chapters} ch`}
          subtitle={stats.shortestArc.title}
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
                d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
              />
            </svg>
          }
          color="green"
          loading={isLoading}
        />
        <StatCard
          label="Average Length"
          value={`${stats.averageLength} ch`}
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          }
          color="amber"
          loading={isLoading}
        />
      </div>

      {/* Saga Filter Section */}
      <SectionHeader
        title="Filter by Saga"
        description="Select a saga to focus on specific story arcs, or view all arcs"
        icon={
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
        }
      />

      <div className="flex flex-wrap gap-3 mb-8">
        <FilterButton
          active={selectedSaga === null}
          onClick={() => setSelectedSaga(null)}
          variant="primary"
          count={arcs.length}
        >
          All Sagas
        </FilterButton>
        {sagas.map((saga) => {
          const arcCount = arcs.filter(
            (arc) => arc.saga?.title === saga.title
          ).length
          return (
            <FilterButton
              key={saga.saga_id}
              active={selectedSaga === saga.title}
              onClick={() => setSelectedSaga(saga.title)}
              count={arcCount}
            >
              {saga.title}
            </FilterButton>
          )
        })}
      </div>

      {/* Metric toggle (chapters | pages) */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-medium text-gray-700">Show:</span>
        <button
          onClick={() => setMetric('chapters')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            metric === 'chapters'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Chapters
        </button>
        <button
          onClick={() => setMetric('pages')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            metric === 'pages'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          disabled={pagesByArcTitle.size === 0}
        >
          Pages
        </button>
      </div>

      {/* Arc Length Chart */}
      {filteredArcs.length > 0 ? (
        <div className="mb-8">
          <ArcLengthChart
            arcs={filteredArcs}
            showSeparateBars={selectedSaga !== null}
            allArcs={arcs}
            metric={metric}
            pagesByArcTitle={pagesByArcTitle}
          />
        </div>
      ) : (
        <div className="text-center py-20">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-gray-500 text-lg">
            No story arc data available for the selected filter
          </p>
        </div>
      )}
    </>
  )
}
