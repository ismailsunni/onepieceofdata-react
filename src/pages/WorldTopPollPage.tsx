import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts'
import { fetchCharacterPoll } from '../services/characterPollService'
import {
  CharacterPollEntry,
  LATEST_POLL_ID,
  POLL_EDITIONS,
  PREVIOUS_POLL_ID,
} from '../types/characterPoll'
import SortableTable, { Column } from '../components/common/SortableTable'
import SkeletonTable from '../components/common/SkeletonTable'
import ErrorState from '../components/common/ErrorState'
import StatCard from '../components/common/StatCard'
import { ChartCard } from '../components/common/ChartCard'

interface PollRow extends CharacterPollEntry {
  displayName: string
  /** Rank in the other edition, for characters present in both. */
  otherRank: number | null
  /** Positive = moved up since the previous poll. */
  rankChange: number | null
  isTied: boolean
}

/** 2026 names are stored ALL CAPS; 2021 names already use normal casing. */
function displayName(name: string): string {
  if (name !== name.toUpperCase()) return name
  return name.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase())
}

const MOVER_SCOPE = 200
const MOVER_COUNT = 8

function WorldTopPollPage() {
  const [pollId, setPollId] = useState(LATEST_POLL_ID)
  const [search, setSearch] = useState('')
  const [charactersOnly, setCharactersOnly] = useState(false)
  const [hideVariants, setHideVariants] = useState(false)

  const {
    data: entries = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['character-poll'],
    queryFn: fetchCharacterPoll,
    staleTime: 30 * 60 * 1000,
  })

  const edition = POLL_EDITIONS.find((e) => e.id === pollId)
  const isLatest = pollId === LATEST_POLL_ID

  /** character_id -> rank, per edition. Variants are excluded so a base
   *  character maps to exactly one rank. */
  const rankMaps = useMemo(() => {
    const maps = new Map<string, Map<string, number>>()
    for (const e of entries) {
      if (!e.character_id || e.is_variant) continue
      let m = maps.get(e.poll_id)
      if (!m) maps.set(e.poll_id, (m = new Map()))
      m.set(e.character_id, e.rank)
    }
    return maps
  }, [entries])

  const rows = useMemo<PollRow[]>(() => {
    const current = entries.filter((e) => e.poll_id === pollId)
    const otherId = isLatest ? PREVIOUS_POLL_ID : LATEST_POLL_ID
    const otherMap = rankMaps.get(otherId)

    const tieCounts = new Map<number, number>()
    for (const e of current)
      tieCounts.set(e.rank, (tieCounts.get(e.rank) ?? 0) + 1)

    return current.map((e) => {
      const otherRank =
        e.character_id && !e.is_variant
          ? (otherMap?.get(e.character_id) ?? null)
          : null
      return {
        ...e,
        displayName: displayName(e.name),
        otherRank,
        rankChange: otherRank === null ? null : otherRank - e.rank,
        isTied: (tieCounts.get(e.rank) ?? 0) > 1,
      }
    })
  }, [entries, pollId, isLatest, rankMaps])

  const stats = useMemo(() => {
    const linked = rows.filter((r) => r.character_id).length
    const variants = rows.filter((r) => r.is_variant).length
    const scored = rows.filter((r) => r.points !== null)
    const newToTop100 = rows.filter(
      (r) => r.rank <= 100 && r.character_id && !r.is_variant && !r.otherRank
    ).length
    return {
      total: rows.length,
      linked,
      unlinked: rows.length - linked,
      variants,
      topVotes: scored.length ? Math.max(...scored.map((r) => r.points!)) : 0,
      newToTop100,
    }
  }, [rows])

  const votesChartData = useMemo(
    () =>
      rows
        .filter((r) => r.points !== null)
        .sort((a, b) => b.points! - a.points!)
        .slice(0, 15)
        .map((r) => ({ name: r.displayName, votes: r.points! })),
    [rows]
  )

  const movers = useMemo(() => {
    const eligible = rows.filter(
      (r) =>
        r.rankChange !== null &&
        (r.rank <= MOVER_SCOPE || r.otherRank! <= MOVER_SCOPE)
    )
    const byChange = [...eligible].sort((a, b) => b.rankChange! - a.rankChange!)
    return {
      up: byChange.filter((r) => r.rankChange! > 0).slice(0, MOVER_COUNT),
      down: byChange
        .filter((r) => r.rankChange! < 0)
        .slice(-MOVER_COUNT)
        .reverse(),
    }
  }, [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (charactersOnly && !r.character_id) return false
      if (hideVariants && r.is_variant) return false
      if (q && !r.displayName.toLowerCase().includes(q)) return false
      return true
    })
  }, [rows, search, charactersOnly, hideVariants])

  const columns: Column<PollRow>[] = [
    {
      key: 'rank',
      label: 'Rank',
      sortValue: (row) => row.rank,
      render: (row) => (
        <span className="font-bold text-gray-900 whitespace-nowrap">
          #{row.rank}
          {row.isTied && (
            <span className="ml-1 text-xs font-normal text-gray-600">=</span>
          )}
        </span>
      ),
    },
    {
      key: 'face',
      label: '',
      sortable: false,
      render: (row) =>
        row.image_url ? (
          <img
            src={row.image_url}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="w-10 h-10 rounded-lg object-cover bg-gray-100"
            onError={(e) => {
              e.currentTarget.style.visibility = 'hidden'
            }}
          />
        ) : (
          <div
            className="w-10 h-10 rounded-lg bg-gray-100"
            aria-hidden="true"
          />
        ),
    },
    {
      key: 'name',
      label: 'Character',
      sortValue: (row) => row.displayName,
      render: (row) => (
        <div className="flex items-center gap-2 flex-wrap">
          {row.character_id ? (
            <Link
              to={`/characters/${row.character_id}`}
              className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
            >
              {row.displayName}
            </Link>
          ) : (
            <span className="font-medium text-gray-900">{row.displayName}</span>
          )}
          {row.is_variant && (
            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-xs font-medium">
              alt form
            </span>
          )}
          {!row.character_id && (
            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-medium">
              unmatched
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'points',
      label: 'Votes',
      sortValue: (row) => row.points,
      render: (row) =>
        row.points === null ? (
          <span className="text-gray-400">—</span>
        ) : (
          <span className="font-semibold text-gray-900">
            {row.points.toLocaleString()}
          </span>
        ),
    },
    {
      key: 'otherRank',
      label: isLatest ? '2021 Rank' : '2026 Rank',
      sortValue: (row) => row.otherRank,
      render: (row) => (
        <span className="text-gray-600">
          {row.otherRank === null ? '—' : `#${row.otherRank}`}
        </span>
      ),
    },
    {
      key: 'rankChange',
      label: 'Change',
      sortValue: (row) => row.rankChange,
      render: (row) => <RankChange value={row.rankChange} />,
    },
  ]

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-gray-900 transition-colors">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-gray-900 font-medium">World Top 100</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            World Top 100 Popularity Poll
          </h1>
          <p className="text-lg text-gray-600">
            Fan-voted global character rankings from the official{' '}
            <em>One Piece</em> World Top 100 polls, with movement between the
            2021 and 2026 editions.
          </p>
        </div>

        {/* Edition switcher */}
        <div
          className="inline-flex gap-1 p-1 bg-white border border-gray-200 rounded-xl mb-6"
          role="group"
          aria-label="Poll edition"
        >
          {POLL_EDITIONS.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setPollId(e.id)}
              aria-pressed={pollId === e.id}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pollId === e.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>

        {isError ? (
          <ErrorState
            message="Failed to load the popularity poll. Please try again."
            onRetry={() => refetch()}
          />
        ) : isLoading ? (
          <SkeletonTable rows={10} cols={6} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Ranked entries"
                value={stats.total.toLocaleString()}
                color="blue"
                subtitle={`${edition?.shortLabel} edition`}
              />
              <StatCard
                label="Votes for #1"
                value={stats.topVotes.toLocaleString()}
                color="amber"
                subtitle={`Vote counts published for the top ${edition?.pointsUpTo}`}
              />
              <StatCard
                label="Matched to characters"
                value={stats.linked.toLocaleString()}
                color="emerald"
                subtitle={`${stats.unlinked} unmatched (ships, animals, groups)`}
              />
              <StatCard
                label={isLatest ? 'New to the top 100' : 'Alternate forms'}
                value={isLatest ? stats.newToTop100 : stats.variants}
                color="purple"
                subtitle={
                  isLatest
                    ? 'Top-100 entries absent from the 2021 poll'
                    : 'Entries voted as a variant of another character'
                }
              />
            </div>

            <div className="mb-8">
              <ChartCard
                title={`Top ${votesChartData.length} by votes (${edition?.shortLabel})`}
                description={`The official site published vote counts only for the top ${edition?.pointsUpTo} of this edition.`}
                downloadFileName={`world-top-100-votes-${edition?.shortLabel}`}
              >
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(240, votesChartData.length * 34)}
                >
                  <BarChart
                    data={votesChartData}
                    layout="vertical"
                    margin={{ top: 8, right: 72, bottom: 8, left: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                      horizontal={false}
                    />
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={190}
                      tick={{ fontSize: 12, fill: '#4b5563' }}
                    />
                    <Tooltip
                      formatter={(v: number) => [v.toLocaleString(), 'Votes']}
                    />
                    <Bar dataKey="votes" fill="#2563eb" radius={[0, 4, 4, 0]}>
                      <LabelList
                        dataKey="votes"
                        position="right"
                        formatter={(v: unknown) => Number(v).toLocaleString()}
                        style={{ fontSize: 11, fill: '#4b5563' }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Movers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <MoverList
                title={`Biggest climbers into ${edition?.shortLabel}`}
                rows={movers.up}
                positive
              />
              <MoverList
                title={`Biggest drops in ${edition?.shortLabel}`}
                rows={movers.down}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <input
                type="search"
                aria-label="Search poll entries"
                placeholder="Search entries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-80 px-4 py-2.5 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={charactersOnly}
                  onChange={(e) => setCharactersOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Matched characters only
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={hideVariants}
                  onChange={(e) => setHideVariants(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Hide alternate forms
              </label>
              <span className="text-sm text-gray-600">
                {filtered.length.toLocaleString()} of{' '}
                {stats.total.toLocaleString()} entries
              </span>
            </div>

            <SortableTable
              columns={columns}
              data={filtered}
              defaultSortField="rank"
              defaultSortDirection="asc"
              rowKey={(row) => `${row.poll_id}-${row.rank}-${row.name}`}
              pageSize={50}
            />

            <section className="mt-8 bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Reading this data
              </h2>
              <ul className="space-y-2 text-sm text-gray-600 list-disc pl-5">
                <li>
                  Vote counts are only published for the top{' '}
                  {edition?.pointsUpTo} of the {edition?.shortLabel} edition —
                  every other entry has a rank but no score. A score of{' '}
                  <span className="font-medium">0</span> is a real result (a few
                  entries at the bottom of the 2021 list drew no votes at all)
                  and is not the same as a missing one, shown as{' '}
                  <span className="font-medium">—</span>.
                </li>
                <li>
                  The 2026 edition ranked more entries than 2021 (1,567 vs
                  1,178), and rank changes deep in the list are noisy for that
                  reason. The climber and drop lists above are limited to
                  entries inside the top {MOVER_SCOPE} of at least one edition,
                  where the movement is meaningful.
                </li>
                <li>
                  Ranks marked <span className="font-semibold">=</span> are
                  shared by several entries that finished on equal votes — in
                  2026 the bottom ranks are shared by 30+ entries each.
                </li>
                <li>
                  Entries tagged <span className="font-medium">alt form</span>{' '}
                  were voted as a variant of another character (for example
                  Fish-Woman Nami or the Seraphim). They are excluded from
                  cross-edition rank comparisons so each character maps to one
                  rank.
                </li>
                <li>
                  Entries tagged <span className="font-medium">unmatched</span>{' '}
                  have no character record to link to — ships, animals and
                  groups such as the Thousand Sunny or the Kung-Fu Dugongs.
                </li>
              </ul>
              {edition?.siteUrl && (
                <p className="mt-4 text-sm text-gray-600">
                  Source:{' '}
                  <a
                    href={edition.siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {edition.siteUrl}
                  </a>
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}

function RankChange({ value }: { value: number | null }) {
  if (value === null) return <span className="text-gray-400">new</span>
  if (value === 0) return <span className="text-gray-500">—</span>
  const up = value > 0
  return (
    <span
      className={`font-semibold ${up ? 'text-emerald-600' : 'text-red-600'}`}
    >
      {up ? '▲' : '▼'} {Math.abs(value)}
    </span>
  )
}

function MoverList({
  title,
  rows,
  positive = false,
}: {
  title: string
  rows: PollRow[]
  positive?: boolean
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-600">No comparable entries.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={`${row.rank}-${row.name}`}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="truncate">
                {row.character_id ? (
                  <Link
                    to={`/characters/${row.character_id}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {row.displayName}
                  </Link>
                ) : (
                  <span className="font-medium text-gray-900">
                    {row.displayName}
                  </span>
                )}
                <span className="ml-2 text-gray-500">
                  #{row.otherRank} → #{row.rank}
                </span>
              </span>
              <span
                className={`font-semibold whitespace-nowrap ${
                  positive ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {positive ? '▲' : '▼'} {Math.abs(row.rankChange!)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default WorldTopPollPage
