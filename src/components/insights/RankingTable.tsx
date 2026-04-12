import { Link } from 'react-router-dom'
import { STRAW_HAT_IDS } from '../../constants/characters'

export interface RankingItem {
  id: string
  title: string
  totalChapters: number
  characters: { id: string; name: string; count: number }[]
}

export function RankingTable({
  items,
  linkPrefix,
  shpFilter,
  showPct,
}: {
  items: RankingItem[]
  linkPrefix: string
  shpFilter: 'all' | 'hide' | 'only'
  showPct: boolean
}) {
  const displayRows = 20
  const filtered = items.map((item) => ({
    ...item,
    characters: (shpFilter === 'hide'
      ? item.characters.filter((c) => !STRAW_HAT_IDS.has(c.id))
      : shpFilter === 'only'
        ? item.characters.filter((c) => STRAW_HAT_IDS.has(c.id))
        : item.characters
    ).slice(0, displayRows),
  }))

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="sticky left-0 z-20 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-700 min-w-[40px] border-r border-gray-200">
              #
            </th>
            {filtered.map((item) => (
              <th
                key={item.id}
                className="bg-gray-50 px-2 py-2 text-center font-medium text-gray-600 min-w-[140px]"
              >
                <Link
                  to={`${linkPrefix}${item.id}`}
                  target="_blank"
                  className="hover:text-blue-600 transition-colors text-xs"
                >
                  <div>{item.title}</div>
                  <div className="text-[10px] text-gray-400 font-normal">
                    {item.totalChapters} chapters
                  </div>
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: displayRows }, (_, rowIdx) => (
            <tr
              key={rowIdx}
              className={`border-b border-gray-100 ${rowIdx % 2 === 0 ? '' : 'bg-gray-50/30'}`}
            >
              <td className="sticky left-0 z-10 bg-white px-3 py-1.5 text-center font-medium text-gray-400 border-r border-gray-200 tabular-nums">
                {rowIdx + 1}
              </td>
              {filtered.map((item) => {
                const char = item.characters[rowIdx]
                if (!char) {
                  return (
                    <td
                      key={item.id}
                      className="px-2 py-1.5 text-center text-gray-300"
                    >
                      &ndash;
                    </td>
                  )
                }
                const isSHP = STRAW_HAT_IDS.has(char.id)
                const pct =
                  Math.round((char.count / item.totalChapters) * 1000) / 10
                const isOver50 = pct > 50
                return (
                  <td
                    key={item.id}
                    className={`px-2 py-1.5 text-xs ${isSHP ? 'bg-amber-50' : ''}`}
                  >
                    <Link
                      to={`/characters/${char.id}`}
                      target="_blank"
                      className={`hover:text-blue-600 transition-colors ${isSHP ? 'font-medium text-amber-700' : ''} ${isOver50 ? 'font-bold' : ''}`}
                    >
                      {char.name}
                    </Link>
                    <span
                      className={`ml-1 tabular-nums ${isOver50 ? 'font-bold text-gray-600' : 'text-gray-400'}`}
                    >
                      ({showPct ? `${pct}%` : char.count})
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default RankingTable
