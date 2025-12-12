import { TimeSkipData } from '../services/analyticsService'
import { ChartCard } from './common/ChartCard'

interface TimeSkipVennDiagramProps {
  data: TimeSkipData
}

function TimeSkipVennDiagram({ data }: TimeSkipVennDiagramProps) {
  const { preTimeSkipOnly, postTimeSkipOnly, both, total } = data

  // Calculate percentages
  const prePercentage = total > 0 ? ((preTimeSkipOnly / total) * 100).toFixed(1) : '0'
  const postPercentage = total > 0 ? ((postTimeSkipOnly / total) * 100).toFixed(1) : '0'
  const bothPercentage = total > 0 ? ((both / total) * 100).toFixed(1) : '0'

  return (
    <ChartCard
      title="Pre/Post Time Skip Characters"
      downloadFileName="time-skip-venn-diagram"
    >
      <p className="text-sm text-gray-600 mb-6">
        Distribution of characters before and after the 2-year time skip (Chapter 598)
      </p>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
        {/* Venn Diagram SVG */}
        <div className="relative w-full max-w-md">
          <svg viewBox="0 0 400 300" className="w-full h-auto">
            {/* Left circle (Pre-Time Skip) */}
            <circle
              cx="140"
              cy="150"
              r="100"
              fill="#3b82f6"
              opacity="0.6"
              stroke="#2563eb"
              strokeWidth="2"
            />

            {/* Right circle (Post-Time Skip) */}
            <circle
              cx="260"
              cy="150"
              r="100"
              fill="#10b981"
              opacity="0.6"
              stroke="#059669"
              strokeWidth="2"
            />

            {/* Labels */}
            <text
              x="90"
              y="140"
              textAnchor="middle"
              className="fill-white font-bold text-sm"
              style={{ fontSize: '14px' }}
            >
              Pre-Skip
            </text>
            <text
              x="90"
              y="160"
              textAnchor="middle"
              className="fill-white font-bold text-xl"
              style={{ fontSize: '24px' }}
            >
              {preTimeSkipOnly}
            </text>

            <text
              x="200"
              y="140"
              textAnchor="middle"
              className="fill-white font-bold text-sm"
              style={{ fontSize: '14px' }}
            >
              Both
            </text>
            <text
              x="200"
              y="160"
              textAnchor="middle"
              className="fill-white font-bold text-xl"
              style={{ fontSize: '24px' }}
            >
              {both}
            </text>

            <text
              x="310"
              y="140"
              textAnchor="middle"
              className="fill-white font-bold text-sm"
              style={{ fontSize: '14px' }}
            >
              Post-Skip
            </text>
            <text
              x="310"
              y="160"
              textAnchor="middle"
              className="fill-white font-bold text-xl"
              style={{ fontSize: '24px' }}
            >
              {postTimeSkipOnly}
            </text>
          </svg>
        </div>

        {/* Statistics */}
        <div className="flex flex-col gap-4 w-full lg:w-auto">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex items-center justify-between gap-8">
              <div>
                <p className="text-sm text-blue-700 font-medium">Pre-Time Skip Only</p>
                <p className="text-xs text-blue-600 mt-1">Before Chapter 598</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-700">{preTimeSkipOnly}</p>
                <p className="text-xs text-blue-600">{prePercentage}%</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
            <div className="flex items-center justify-between gap-8">
              <div>
                <p className="text-sm text-purple-700 font-medium">Both Periods</p>
                <p className="text-xs text-purple-600 mt-1">Appeared in both eras</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-700">{both}</p>
                <p className="text-xs text-purple-600">{bothPercentage}%</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <div className="flex items-center justify-between gap-8">
              <div>
                <p className="text-sm text-green-700 font-medium">Post-Time Skip Only</p>
                <p className="text-xs text-green-600 mt-1">From Chapter 598 onwards</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-700">{postTimeSkipOnly}</p>
                <p className="text-xs text-green-600">{postPercentage}%</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 border-l-4 border-gray-500 p-4 rounded">
            <div className="flex items-center justify-between gap-8">
              <div>
                <p className="text-sm text-gray-700 font-medium">Total Characters</p>
                <p className="text-xs text-gray-600 mt-1">With chapter data</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-700">{total}</p>
                <p className="text-xs text-gray-600">100%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Note:</span> The time skip occurs between chapters 597 and 598,
          after the Summit War of Marineford. The Straw Hat Pirates train separately for 2 years before reuniting at Sabaody Archipelago.
        </p>
      </div>
    </ChartCard>
  )
}

export default TimeSkipVennDiagram
