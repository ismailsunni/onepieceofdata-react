import { EmbedFooter } from './EmbedFooter'
import type { SagaPacing } from '../../services/analytics/insightsAnalytics'

// ── Saga Pacing ─────────────────────────────────────────────────────────────

export function EmbedSagaPacing({ data }: { data: SagaPacing[] }) {
  return (
    <div className="p-4 font-sans">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Saga Pacing Comparison
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-3 font-semibold text-gray-900">
                Saga
              </th>
              <th className="text-right py-3 px-3 font-semibold text-gray-900">
                Arcs
              </th>
              <th className="text-right py-3 px-3 font-semibold text-gray-900">
                Chapters
              </th>
              <th className="text-right py-3 px-3 font-semibold text-gray-900">
                Pages
              </th>
              <th className="text-right py-3 px-3 font-semibold text-gray-900">
                Active Characters
              </th>
              <th className="text-right py-3 px-3 font-semibold text-gray-900">
                New Characters
              </th>
              <th className="text-right py-3 px-3 font-semibold text-gray-900">
                Chars/Ch.
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((s, i) => (
              <tr
                key={s.saga}
                className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}
              >
                <td className="py-2 px-3 font-medium text-gray-900">
                  {s.saga}
                </td>
                <td className="py-2 px-3 text-right text-gray-600">
                  {s.arcCount}
                </td>
                <td className="py-2 px-3 text-right text-gray-600">
                  {s.totalChapters}
                </td>
                <td className="py-2 px-3 text-right text-gray-600">
                  {s.totalPages.toLocaleString()}
                </td>
                <td className="py-2 px-3 text-right font-medium text-blue-600">
                  {s.characterCount}
                </td>
                <td className="py-2 px-3 text-right font-medium text-emerald-600">
                  {s.newCharacters}
                </td>
                <td className="py-2 px-3 text-right font-medium text-purple-600">
                  {s.density}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <EmbedFooter />
    </div>
  )
}
