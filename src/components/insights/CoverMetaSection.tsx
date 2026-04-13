import { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts'
import { ChartCard } from '../common/ChartCard'
import { STRAW_HAT_IDS } from '../../constants/characters'
import type {
  CoverStar,
  CoverVsMain,
} from '../../services/analytics/insightsAnalytics'

interface CoverMetaSectionProps {
  coverStars: CoverStar[]
  coverVsMain: CoverVsMain[]
}

export function CoverMetaSection({
  coverStars,
  coverVsMain,
}: CoverMetaSectionProps) {
  const [hideStrawHats, setHideStrawHats] = useState(true)

  const filteredCoverVsMain = useMemo(
    () =>
      hideStrawHats
        ? coverVsMain.filter((c) => !STRAW_HAT_IDS.has(c.id))
        : coverVsMain,
    [coverVsMain, hideStrawHats]
  )

  return (
    <>
      {/* Volume Cover Stars */}
      <div className="mb-6">
        <ChartCard
          title="Top Volume Cover Stars"
          description="Top 20 characters by tankōbon (volume) cover appearances"
          downloadFileName="cover-stars"
          chartId="cover-stars"
          embedPath="/embed/insights/cover-stars"
        >
          <ResponsiveContainer width="100%" height={500}>
            <BarChart
              data={coverStars}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#6b7280" />
              <YAxis
                dataKey="name"
                type="category"
                width={110}
                tick={{ fontSize: 10 }}
                stroke="#6b7280"
              />
              <Tooltip />
              <Bar
                dataKey="coverAppearances"
                fill="#f59e0b"
                name="Cover Appearances"
                radius={[0, 8, 8, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Volume Cover vs Main Story */}
      <div className="mb-6">
        <ChartCard
          title="Volume Cover vs Main Story Appearances"
          description="How do tankōbon (volume) cover appearances relate to chapter appearances? Scatter plot comparing both"
          downloadFileName="cover-vs-main"
          chartId="cover-vs-main"
          embedPath="/embed/insights/cover-vs-main"
          filters={
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideStrawHats}
                onChange={(e) => setHideStrawHats(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Hide Straw Hat Pirates
            </label>
          }
        >
          <style>
            {`
              .recharts-scatter-symbol:focus { outline: none !important; }
              .recharts-scatter-symbol:focus-visible { outline: none !important; }
            `}
          </style>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                dataKey="main"
                name="Main Story Appearances"
                tick={{ fontSize: 11 }}
                stroke="#6b7280"
              />
              <YAxis
                type="number"
                dataKey="cover"
                name="Volume Cover Appearances"
                tick={{ fontSize: 11 }}
                stroke="#6b7280"
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as CoverVsMain
                    return (
                      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                        <p className="font-semibold text-gray-900 mb-2">
                          {data.name}
                        </p>
                        <div className="space-y-1 text-sm">
                          <p className="text-gray-600">
                            <span className="font-medium">
                              Main Story Appearances:
                            </span>{' '}
                            <span className="text-emerald-600 font-semibold">
                              {data.main}
                            </span>
                          </p>
                          <p className="text-gray-600">
                            <span className="font-medium">
                              Volume Cover Appearances:
                            </span>{' '}
                            <span className="text-purple-600 font-semibold">
                              {data.cover}
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
                data={filteredCoverVsMain}
                fill="#8b5cf6"
                fillOpacity={0.6}
                stroke="#7c3aed"
                strokeWidth={1.5}
                isAnimationActive={false}
              />
            </ScatterChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center text-sm text-gray-500">
            Each point represents a character. Hover over a point to see
            details.
          </div>
        </ChartCard>
      </div>
    </>
  )
}
