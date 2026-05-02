import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import {
  CHANGELOG,
  type ChangelogCategory,
  type ChangelogEntry,
} from '../data/changelog'

const CATEGORY_STYLES: Record<ChangelogCategory, string> = {
  feature: 'bg-blue-100 text-blue-700 border-blue-200',
  improvement: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  fix: 'bg-amber-100 text-amber-700 border-amber-200',
  chore: 'bg-gray-100 text-gray-700 border-gray-200',
}

const CATEGORY_LABELS: Record<ChangelogCategory, string> = {
  feature: 'Feature',
  improvement: 'Improvement',
  fix: 'Fix',
  chore: 'Chore',
}

const formatDate = (iso: string) => {
  // Parse as local date so a YYYY-MM-DD string isn't shifted by the user's timezone.
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, (month ?? 1) - 1, day ?? 1)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

interface DateGroup {
  date: string
  entries: ChangelogEntry[]
}

function ChangelogPage() {
  const groups = useMemo<DateGroup[]>(() => {
    const byDate = new Map<string, ChangelogEntry[]>()
    for (const entry of CHANGELOG) {
      const list = byDate.get(entry.date) ?? []
      list.push(entry)
      byDate.set(entry.date, list)
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
      .map(([date, entries]) => ({ date, entries }))
  }, [])

  return (
    <main className="container mx-auto px-4 py-6 md:py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
            Changelog
          </h2>
          <p className="mt-2 text-base md:text-lg text-gray-600">
            What's new on One Piece of Data, grouped by date.
          </p>
          <p className="mt-3 text-sm text-gray-500">
            Looking for project info?{' '}
            <Link
              to="/about"
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              Back to About
            </Link>
          </p>
        </div>

        {groups.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-gray-600">
            No changelog entries yet.
          </div>
        ) : (
          <ol className="space-y-6">
            {groups.map(({ date, entries }) => (
              <li
                key={date}
                className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 hover:border-gray-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-baseline justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                    <time dateTime={date}>{formatDate(date)}</time>
                  </h3>
                  <span className="text-xs text-gray-500">
                    {entries.length}{' '}
                    {entries.length === 1 ? 'change' : 'changes'}
                  </span>
                </div>
                <ul className="space-y-4">
                  {entries.map((entry, idx) => (
                    <li
                      key={`${date}-${idx}`}
                      className="flex gap-3 items-start"
                    >
                      {entry.category && (
                        <span
                          className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${
                            CATEGORY_STYLES[entry.category]
                          }`}
                        >
                          {CATEGORY_LABELS[entry.category]}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="text-gray-900 font-medium">
                          {entry.title}
                        </p>
                        {entry.description && (
                          <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                            {entry.description}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            Want to suggest something? Open an issue on{' '}
            <a
              href="https://github.com/ismailsunni/onepieceofdata-react/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  )
}

export default ChangelogPage
