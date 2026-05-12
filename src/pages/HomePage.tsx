import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import HomeSpotlight from '../components/HomeSpotlight'
import { fetchDatabaseStats } from '../services/statsService'
import { supabase } from '../services/supabase'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faImage,
  faQuestion,
  faBookOpen,
  faSitemap,
  faChartLine,
  faAppleWhole,
  faFlag,
  faArrowRight,
  faCalendarDay,
} from '@fortawesome/free-solid-svg-icons'

interface LatestRelease {
  chapter: {
    number: number
    title: string | null
    date: string | null
    num_page: number | null
  } | null
  volume: number | null
  arc: { arc_id: string; title: string } | null
}

async function fetchLatestRelease(): Promise<LatestRelease> {
  if (!supabase) return { chapter: null, volume: null, arc: null }
  const [chapterRes, volumeRes] = await Promise.all([
    supabase
      .from('chapter')
      .select('number, title, date, num_page')
      .order('number', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('volume')
      .select('number')
      .order('number', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const chapter = chapterRes.data
    ? {
        number: chapterRes.data.number,
        title: chapterRes.data.title,
        date: chapterRes.data.date,
        num_page: chapterRes.data.num_page,
      }
    : null

  let arc: LatestRelease['arc'] = null
  if (chapter) {
    const arcRes = await supabase
      .from('arc')
      .select('arc_id, title')
      .lte('start_chapter', chapter.number)
      .gte('end_chapter', chapter.number)
      .limit(1)
      .maybeSingle()
    arc = arcRes.data
      ? { arc_id: arcRes.data.arc_id, title: arcRes.data.title }
      : null
  }

  return {
    chapter,
    volume: volumeRes.data?.number ?? null,
    arc,
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

function HomePage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchDatabaseStats,
  })

  const { data: latest } = useQuery({
    queryKey: ['latest-release-v2'],
    queryFn: fetchLatestRelease,
  })

  const publicationYears = stats?.publicationSpan
    ? Math.floor(parseInt(stats.publicationSpan.replace(/,/g, ''), 10) / 365)
    : null

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero — pitch on the left, live rankings on the right (above the fold) */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-emerald-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8 md:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-start">
            <div className="lg:col-span-2 lg:pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                Your Log Pose to Laugh Tale
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 leading-tight">
                Explore the One Piece universe
                <span className="block text-blue-600">through data.</span>
              </h1>
              <p className="text-base text-gray-600 leading-relaxed mb-4">
                Characters, arcs, chapters, devil fruits, bounties — all
                cross-linked and ready to dig into.
              </p>

              {/* Inline latest strip — what was the standalone card */}
              {latest?.chapter && (
                <div className="mb-5 flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Latest
                  </span>
                  <Link
                    to={`/chapters/${latest.chapter.number}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-gray-800 border border-gray-200 hover:border-gray-300 hover:text-blue-600 transition-colors"
                    title={
                      latest.chapter.date ? formatDate(latest.chapter.date) : ''
                    }
                  >
                    <FontAwesomeIcon
                      icon={faCalendarDay}
                      className="w-3 h-3 text-gray-400"
                    />
                    Ch. {latest.chapter.number}
                    {latest.chapter.title ? ` · ${latest.chapter.title}` : ''}
                  </Link>
                  {latest.arc && (
                    <Link
                      to={`/arcs/${latest.arc.arc_id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                    >
                      {latest.arc.title}
                    </Link>
                  )}
                  {latest.volume && (
                    <Link
                      to={`/volumes/${latest.volume}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      Vol. {latest.volume}
                    </Link>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-3 mb-6">
                <Link
                  to="/characters"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Browse characters
                  <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
                </Link>
                <Link
                  to="/analytics"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  See analytics
                </Link>
              </div>

              {/* Inline stat row — text-only so it fills the leftover vertical space without bulk */}
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 pt-5 border-t border-gray-200/70">
                <Link
                  to="/chapters"
                  className="group"
                  aria-label={`${stats?.chapters || 0} chapters`}
                >
                  <dt className="text-xs font-medium text-gray-500 group-hover:text-blue-600 transition-colors">
                    Chapters
                  </dt>
                  <dd className="text-xl font-bold text-gray-900 tabular-nums">
                    {statsLoading
                      ? '…'
                      : (stats?.chapters || 0).toLocaleString()}
                  </dd>
                </Link>
                <Link to="/characters" className="group">
                  <dt className="text-xs font-medium text-gray-500 group-hover:text-blue-600 transition-colors">
                    Characters
                  </dt>
                  <dd className="text-xl font-bold text-gray-900 tabular-nums">
                    {statsLoading
                      ? '…'
                      : (stats?.characters || 0).toLocaleString()}
                  </dd>
                </Link>
                <Link to="/arcs" className="group">
                  <dt className="text-xs font-medium text-gray-500 group-hover:text-blue-600 transition-colors">
                    Arcs
                  </dt>
                  <dd className="text-xl font-bold text-gray-900 tabular-nums">
                    {statsLoading ? '…' : (stats?.arcs || 0).toLocaleString()}
                  </dd>
                </Link>
                <Link to="/devil-fruits" className="group">
                  <dt className="text-xs font-medium text-gray-500 group-hover:text-blue-600 transition-colors">
                    Devil Fruits
                  </dt>
                  <dd className="text-xl font-bold text-gray-900 tabular-nums">
                    {statsLoading
                      ? '…'
                      : (stats?.devilFruits || 0).toLocaleString()}
                  </dd>
                </Link>
              </dl>
            </div>

            {/* Rankings carousel — promoted above the fold */}
            <div className="lg:col-span-3">
              <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-sm">
                <HomeSpotlight />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Games — promoted from the bottom */}
      <section className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Test your knowledge
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Two quick games built on the same data.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/games/guess-character"
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200 group flex items-start gap-4"
            >
              <div className="inline-flex shrink-0 items-center justify-center w-11 h-11 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FontAwesomeIcon icon={faImage} className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  Guess the Character
                </h3>
                <p className="text-sm text-gray-500">
                  Identify characters from portrait images. 5 questions, timed.
                </p>
              </div>
              <FontAwesomeIcon
                icon={faArrowRight}
                className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all mt-1"
              />
            </Link>

            <Link
              to="/games/who-am-i"
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200 group flex items-start gap-4"
            >
              <div className="inline-flex shrink-0 items-center justify-center w-11 h-11 bg-purple-100 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <FontAwesomeIcon icon={faQuestion} className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  Who Am I?
                </h3>
                <p className="text-sm text-gray-500">
                  Guess the character from progressive hints. Fewer hints, more
                  points.
                </p>
              </div>
              <FontAwesomeIcon
                icon={faArrowRight}
                className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all mt-1"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* Spotlight + Did you know */}
      {/* Did you know — wide strip of standout stats */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Did you know?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 rounded-xl p-4">
              <div className="text-3xl font-bold text-amber-900">
                {stats?.totalPages.toLocaleString() || '—'}
              </div>
              <div className="text-sm text-amber-800 mt-1">
                total pages of manga in the database
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-xl p-4">
              <div className="text-3xl font-bold text-emerald-900">
                {publicationYears !== null ? `${publicationYears}+` : '—'}
              </div>
              <div className="text-sm text-emerald-800 mt-1">
                years of publication covered
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-xl p-4">
              <div className="text-3xl font-bold text-purple-900">
                {stats?.sagas || '—'}
              </div>
              <div className="text-sm text-purple-800 mt-1">
                sagas spanning {stats?.arcs || 0} arcs
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compact "go deeper" grid — only entries not duplicated by the navbar's primary tabs */}
      <section className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Go deeper</h2>
          <p className="text-sm text-gray-600 mb-5">
            Cross-cutting views and analyses.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to="/devil-fruits"
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 bg-pink-100 text-pink-600 rounded-lg mb-3 group-hover:bg-pink-600 group-hover:text-white transition-colors">
                <FontAwesomeIcon icon={faAppleWhole} className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Devil Fruits
              </h3>
              <p className="text-xs text-gray-500">
                Paramecia, Zoan, Logia & users.
              </p>
            </Link>
            <Link
              to="/affiliations"
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 bg-amber-100 text-amber-600 rounded-lg mb-3 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <FontAwesomeIcon icon={faFlag} className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Affiliations
              </h3>
              <p className="text-xs text-gray-500">
                Crews, organizations, alliances.
              </p>
            </Link>
            <Link
              to="/analytics/network"
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-100 text-purple-600 rounded-lg mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <FontAwesomeIcon icon={faSitemap} className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Character Network
                <sup className="text-[10px] text-orange-500 ml-1">beta</sup>
              </h3>
              <p className="text-xs text-gray-500">
                Co-appearance graph across chapters.
              </p>
            </Link>
            <Link
              to="/sagas"
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <FontAwesomeIcon icon={faBookOpen} className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Sagas
              </h3>
              <p className="text-xs text-gray-500">
                The grand chapters of the journey.
              </p>
            </Link>
          </div>
          <div className="mt-6 text-center">
            <Link
              to="/analytics"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <FontAwesomeIcon icon={faChartLine} className="w-4 h-4" />
              Explore all analytics
              <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>Built with passion for the One Piece community</p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default HomePage
