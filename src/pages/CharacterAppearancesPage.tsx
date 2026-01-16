import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  fetchAppearanceDistribution,
  fetchSagaAppearanceDistribution,
  fetchSagaAppearanceCountDistribution,
  fetchTimeSkipDistribution,
} from '../services/analyticsService'
import { fetchCharacters } from '../services/characterService'
import CharacterAppearanceChart from '../components/CharacterAppearanceChart'
import { SagaAppearanceChart } from '../components/SagaAppearanceChart'
import { SagaAppearanceCountChart } from '../components/SagaAppearanceCountChart'
import TimeSkipVennDiagram from '../components/TimeSkipVennDiagram'
import { StatCard, SectionHeader } from '../components/analytics'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
} from 'recharts'

function CharacterAppearancesPage() {

  // Fetch appearance analytics data
  const { data: appearanceData = [], isLoading: appearanceLoading } = useQuery({
    queryKey: ['analytics', 'appearance-distribution'],
    queryFn: fetchAppearanceDistribution,
  })

  const { data: sagaAppearanceData = [], isLoading: sagaAppearanceLoading } = useQuery({
    queryKey: ['analytics', 'saga-appearance-distribution'],
    queryFn: fetchSagaAppearanceDistribution,
  })

  const { data: sagaAppearanceCountData = [], isLoading: sagaAppearanceCountLoading } = useQuery({
    queryKey: ['analytics', 'saga-appearance-count-distribution'],
    queryFn: fetchSagaAppearanceCountDistribution,
  })

  const { data: timeSkipData, isLoading: timeSkipLoading } = useQuery({
    queryKey: ['analytics', 'time-skip-distribution'],
    queryFn: fetchTimeSkipDistribution,
  })

  const { data: allCharacters = [], isLoading: charactersLoading } = useQuery({
    queryKey: ['characters'],
    queryFn: fetchCharacters,
  })

  const isLoading =
    appearanceLoading ||
    sagaAppearanceLoading ||
    sagaAppearanceCountLoading ||
    timeSkipLoading ||
    charactersLoading

  // Calculate statistics
  const stats = useMemo(() => {
    if (!sagaAppearanceData.length) {
      return {
        highestDensitySaga: '-',
        highestDensityRate: '0',
        mostActiveSaga: '-',
        mostActiveSagaCount: 0,
        totalSagas: 0,
        debutRate: '0',
      }
    }

    const totalCharacters = sagaAppearanceData.reduce((sum, saga) => sum + saga.characterCount, 0)
    const avgPerSaga = totalCharacters / sagaAppearanceData.length

    const mostActive = sagaAppearanceData.reduce((max, saga) =>
      saga.characterCount > max.characterCount ? saga : max
    )

    // Find saga with highest character density (characters per chapter)
    const sagaWithDensity = sagaAppearanceData.map(saga => ({
      ...saga,
      density: saga.chapterCount > 0 ? saga.characterCount / saga.chapterCount : 0
    }))

    const highestDensity = sagaWithDensity.reduce((max, saga) =>
      saga.density > max.density ? saga : max
    )

    return {
      highestDensitySaga: highestDensity.sagaName,
      highestDensityRate: highestDensity.density.toFixed(2),
      mostActiveSaga: mostActive.sagaName,
      mostActiveSagaCount: mostActive.characterCount,
      totalSagas: sagaAppearanceData.length,
      debutRate: avgPerSaga.toFixed(1),
    }
  }, [sagaAppearanceData])

  // Calculate era statistics
  const eraStats = useMemo(() => {
    if (!sagaAppearanceData.length) {
      return {
        paradiseChars: 0,
        newWorldChars: 0,
        paradiseArcs: 0,
        newWorldArcs: 0,
      }
    }

    // Paradise Era: East Blue through Summit War (first 6 sagas)
    // New World Era: Return to Sabaody onwards (sagas 7+)
    const paradiseSagas = sagaAppearanceData.filter(s => s.sagaOrder <= 6)
    const newWorldSagas = sagaAppearanceData.filter(s => s.sagaOrder > 6)

    return {
      paradiseChars: paradiseSagas.reduce((sum, s) => sum + s.characterCount, 0),
      newWorldChars: newWorldSagas.reduce((sum, s) => sum + s.characterCount, 0),
      paradiseArcs: paradiseSagas.length,
      newWorldArcs: newWorldSagas.length,
    }
  }, [sagaAppearanceData])

  // Prepare scatter plot data for cover appearances vs chapter appearances
  const coverAppearanceScatterData = useMemo(() => {
    return allCharacters
      .filter(char =>
        char.cover_appearance_count &&
        char.cover_appearance_count > 0 &&
        char.appearance_count &&
        char.appearance_count > 0
      )
      .map(char => ({
        name: char.name || 'Unknown',
        chapterAppearances: char.appearance_count || 0,
        coverAppearances: char.cover_appearance_count || 0,
      }))
  }, [allCharacters])



  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Section */}
        <div className="relative mb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 opacity-60 rounded-2xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
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
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                  Character Appearances
                </h1>
                <p className="text-gray-600 text-lg mt-2">
                  Explore how characters appear and are introduced throughout the story
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600"></div>
          </div>
        )}

        {/* Content */}
        {!isLoading && (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
              <StatCard
                label={`Highest Density (${stats.highestDensityRate}/ch)`}
                value={stats.highestDensitySaga}
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
                color="emerald"
                loading={isLoading}
                tooltip="The saga with the highest rate of character introductions per chapter"
              />
              <StatCard
                label="Debut Rate"
                value={`${stats.debutRate}/saga`}
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
                tooltip="Average number of new characters introduced per saga"
              />
              <StatCard
                label="Most Active Saga"
                value={stats.mostActiveSaga}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                }
                color="green"
                loading={isLoading}
                tooltip="The saga that introduced the most new characters"
              />
              <StatCard
                label="Character Debuts"
                value={stats.mostActiveSagaCount}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                }
                color="blue"
                loading={isLoading}
                tooltip="Number of characters introduced in the most active saga"
              />
            </div>

            {/* Time Skip Distribution */}
            {timeSkipData && timeSkipData.total > 0 && (
              <>
                <SectionHeader
                  title="Time Skip Character Distribution"
                  description="Character appearances before, after, and across the 2-year time skip"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  }
                />
                <div className="mb-8">
                  <TimeSkipVennDiagram data={timeSkipData} />
                </div>
              </>
            )}

            {/* Saga Appearance Count Distribution */}
            {sagaAppearanceCountData.length > 0 && (
              <div className="mb-8">
                <SagaAppearanceCountChart data={sagaAppearanceCountData} />
              </div>
            )}

            {/* Characters Introduced per Saga */}
            {sagaAppearanceData.length > 0 && (
              <div className="mb-8">
                <SagaAppearanceChart data={sagaAppearanceData} />
              </div>
            )}

            {/* Character Appearances by Chapter Range */}
            {appearanceData.length > 0 && (
              <div className="mb-8">
                <CharacterAppearanceChart data={appearanceData} />
              </div>
            )}

            {/* Era Comparison Section */}
            {sagaAppearanceData.length > 0 && (
              <>
                <SectionHeader
                  title="Era Comparison"
                  description="Character introductions in Paradise Era vs New World Era"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  }
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">Paradise Era</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Characters Introduced</p>
                        <p className="text-3xl font-bold text-blue-600">{eraStats.paradiseChars}</p>
                      </div>
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Number of Sagas</p>
                        <p className="text-2xl font-semibold text-gray-900">{eraStats.paradiseArcs}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          ~{eraStats.paradiseArcs > 0 ? Math.round(eraStats.paradiseChars / eraStats.paradiseArcs) : 0} characters per saga
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">New World Era</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Characters Introduced</p>
                        <p className="text-3xl font-bold text-purple-600">{eraStats.newWorldChars}</p>
                      </div>
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Number of Sagas</p>
                        <p className="text-2xl font-semibold text-gray-900">{eraStats.newWorldArcs}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          ~{eraStats.newWorldArcs > 0 ? Math.round(eraStats.newWorldChars / eraStats.newWorldArcs) : 0} characters per saga
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Cover Appearances vs Chapter Appearances Scatter Plot */}
            {coverAppearanceScatterData.length > 0 && (
              <>
                <SectionHeader
                  title="Cover Appearances vs Chapter Appearances"
                  description="Relationship between volume cover appearances and total chapter appearances for characters featured on covers"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  }
                />
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
                  <ResponsiveContainer width="100%" height={500}>
                    <ScatterChart
                      margin={{ top: 20, right: 30, bottom: 60, left: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        type="number"
                        dataKey="chapterAppearances"
                        name="Chapter Appearances"
                        stroke="#6b7280"
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                      >
                        <Label
                          value="Chapter Appearances"
                          position="bottom"
                          offset={40}
                          style={{ fill: '#374151', fontSize: 14, fontWeight: 600 }}
                        />
                      </XAxis>
                      <YAxis
                        type="number"
                        dataKey="coverAppearances"
                        name="Cover Appearances"
                        stroke="#6b7280"
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                      >
                        <Label
                          value="Cover Appearances"
                          angle={-90}
                          position="left"
                          offset={40}
                          style={{ fill: '#374151', fontSize: 14, fontWeight: 600 }}
                        />
                      </YAxis>
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                                <p className="font-semibold text-gray-900 mb-2">
                                  {data.name}
                                </p>
                                <div className="space-y-1 text-sm">
                                  <p className="text-gray-600">
                                    <span className="font-medium">Chapter Appearances:</span>{' '}
                                    <span className="text-emerald-600 font-semibold">
                                      {data.chapterAppearances}
                                    </span>
                                  </p>
                                  <p className="text-gray-600">
                                    <span className="font-medium">Cover Appearances:</span>{' '}
                                    <span className="text-purple-600 font-semibold">
                                      {data.coverAppearances}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Scatter
                        name="Characters"
                        data={coverAppearanceScatterData}
                        fill="#8b5cf6"
                        fillOpacity={0.6}
                        stroke="#7c3aed"
                        strokeWidth={1.5}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Each point represents a character. Hover over a point to see details.
                  </div>
                </div>
              </>
            )}

            {/* Empty State */}
            {appearanceData.length === 0 &&
              sagaAppearanceData.length === 0 &&
              sagaAppearanceCountData.length === 0 &&
              (!timeSkipData || timeSkipData.total === 0) && (
                <div className="text-center py-20">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <p className="text-gray-500 text-lg">
                    No character appearance data available at the moment.
                  </p>
                </div>
              )}
          </>
        )}
      </div>
    </main>
  )
}

export default CharacterAppearancesPage
