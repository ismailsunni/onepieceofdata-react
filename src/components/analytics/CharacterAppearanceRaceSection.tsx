import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlay,
  faPause,
  faRotateLeft,
} from '@fortawesome/free-solid-svg-icons'
import { fetchInsightsRawData } from '../../services/analyticsService'
import { STRAW_HAT_IDS } from '../../constants/characters'
import { STRAW_HAT_MARKER, isLightColor } from '../../constants/strawHatColors'
import { ChartCard } from '../common/ChartCard'
import { wordColor } from '../../utils/wordCloud'
import {
  computeRaceFrames,
  type RaceFrame,
  type RaceScoringMode,
} from '../../utils/appearanceRace'

export type RaceSHPFilter = 'all' | 'hide' | 'only'
export type BarScale = 'absolute' | 'relative'

const ROW_HEIGHT = 42
// TOP_N is what's visible; we ask compute for a buffer of extra ranks so
// characters sliding in/out of the top 10 can animate from/to off-screen
// positions rather than popping in place.
const TOP_N = 10
const BUFFER = 5
const COMPUTE_TOP = TOP_N + BUFFER
const WINDOW_OPTIONS = [10, 20, 30, 50]
const SPEED_OPTIONS = [1, 2, 4, 8]
const FPS_AT_1X = 6
// Below this bar-width percentage, the name overflows the bar visually —
// we render it outside (to the right, dark text) instead of inside.
const NAME_INSIDE_THRESHOLD_PCT = 28

const BAR_SCALE_OPTIONS: { value: BarScale; label: string }[] = [
  { value: 'absolute', label: 'Absolute' },
  { value: 'relative', label: 'Relative' },
]

interface RaceChartProps {
  frames: RaceFrame[]
  minChapter: number
  currentChapter: number
  /** Bar-width denominator when `barScale === 'absolute'`. Comes from the
   *  compute result so 'count' and 'decay' scoring both pin at 100%. */
  maxScore: number
  barScale: BarScale
  /** Matches playback frame interval so transitions chain without restarting. */
  transitionMs: number
  linkCharacters: boolean
}

/**
 * Renders the race as a stack of absolutely-positioned rows keyed by
 * character id, so React keeps DOM nodes stable across frames. CSS
 * transitions on `transform` (rank → y offset) and bar `width` (score)
 * drive the reorder animation without us managing tweens manually.
 *
 * We render TOP_N + BUFFER rows and clip the container to TOP_N so that
 * characters sliding in/out of the top 10 animate from/to off-screen
 * positions instead of popping in place.
 */
function RaceChart({
  frames,
  minChapter,
  currentChapter,
  maxScore,
  barScale,
  transitionMs,
  linkCharacters,
}: RaceChartProps) {
  const navigate = useNavigate()
  // Direct O(1) index lookup — frames are dense, indexed from minChapter.
  const frame = frames[currentChapter - minChapter]
  const entries = frame?.entries ?? []
  const leaderScore = entries[0]?.score ?? 0
  const height = ROW_HEIGHT * TOP_N + 8

  return (
    <div
      className="relative bg-gray-50/40 border border-gray-100 rounded-lg overflow-hidden"
      style={{ height }}
      role="figure"
      aria-label={`Top ${TOP_N} characters by appearances — chapter ${currentChapter}`}
    >
      {entries.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
          No characters match the current filter.
        </div>
      )}
      {entries.map((entry, i) => (
        <RaceRow
          key={entry.id}
          rank={i + 1}
          entry={entry}
          barScale={barScale}
          maxScore={maxScore}
          leaderScore={leaderScore}
          transitionMs={transitionMs}
          linkCharacters={linkCharacters}
          onClick={
            linkCharacters
              ? () => navigate(`/characters/${entry.id}`)
              : undefined
          }
        />
      ))}
    </div>
  )
}

interface RaceRowProps {
  rank: number
  entry: { id: string; name: string; score: number; isSHP: boolean }
  barScale: BarScale
  maxScore: number
  leaderScore: number
  transitionMs: number
  linkCharacters: boolean
  onClick?: () => void
}

function RaceRow({
  rank,
  entry,
  barScale,
  maxScore,
  leaderScore,
  transitionMs,
  linkCharacters,
  onClick,
}: RaceRowProps) {
  // Two bar-length modes:
  //   absolute — score as a fraction of the theoretical maximum (window size
  //              in count mode, geometric-series ceiling in decay mode), so
  //              a bar only pins at 100% when a character appears in every
  //              chapter.
  //   relative — every frame normalised against the current leader, so bars
  //              always span the full width; changes look smaller frame-to-
  //              frame, giving a calmer race animation
  const pct =
    barScale === 'relative'
      ? leaderScore > 0
        ? (entry.score / leaderScore) * 100
        : 0
      : maxScore > 0
        ? (entry.score / maxScore) * 100
        : 0
  const nameInside = pct >= NAME_INSIDE_THRESHOLD_PCT
  // wordColor routes SHPs to the signature Oda palette, everyone else
  // to a deterministic hashed hue.
  const color = wordColor(entry.id, entry.isSHP)
  // Flip text to dark on light bars (Usopp's yellow, Franky's pale blue,
  // Brook's gray, Vivi's white) so labels stay legible.
  const lightBar = isLightColor(color)
  const insideTextColor = lightBar ? '#111827' : '#ffffff'
  const insideTextShadow = lightBar
    ? '0 1px 1px rgba(255, 255, 255, 0.55)'
    : '0 1px 2px rgba(0, 0, 0, 0.45)'
  // Rows outside the visible top-N still render (for smooth enter/exit) but
  // fade to invisible so the clipped band is clean.
  const fadeOut = rank > TOP_N
  // Linear easing + transition === frame interval = perfectly chained motion
  // during playback. When scrubbing we clamp to a sensible min so a big jump
  // still animates rather than snapping.
  const rowTransition = `transform ${transitionMs}ms linear, opacity ${Math.min(transitionMs, 300)}ms linear`
  const widthTransition = `width ${transitionMs}ms linear`
  const leftTransition = `left ${transitionMs}ms linear`

  return (
    <div
      className="absolute left-0 right-0 px-3"
      style={{
        top: 4,
        height: ROW_HEIGHT - 4,
        transform: `translateY(${(rank - 1) * ROW_HEIGHT}px)`,
        opacity: fadeOut ? 0 : 1,
        transition: rowTransition,
        pointerEvents: fadeOut ? 'none' : 'auto',
      }}
    >
      <div className="flex items-center gap-2 h-full">
        <span className="w-6 text-right text-xs tabular-nums font-medium text-gray-500 flex-shrink-0">
          {rank}
        </span>
        <div className="flex-1 h-full relative">
          {/* Bar */}
          <div
            className="absolute inset-y-0 left-0 rounded-md overflow-hidden flex items-center justify-end pr-2"
            style={{
              width: `${Math.max(pct, 1)}%`,
              background: color,
              transition: widthTransition,
              cursor: linkCharacters ? 'pointer' : 'default',
            }}
            onClick={onClick}
            title={`${entry.name} — score ${entry.score.toFixed(1)}`}
          >
            <span
              className="text-xs sm:text-sm font-semibold whitespace-nowrap truncate select-none"
              style={{
                color: insideTextColor,
                textShadow: insideTextShadow,
                opacity: nameInside ? 1 : 0,
                transition: 'opacity 200ms linear',
              }}
            >
              {entry.isSHP && (
                <span
                  aria-label="Straw Hat Pirate"
                  className="mr-1"
                  style={{ textShadow: 'none' }}
                >
                  {STRAW_HAT_MARKER}
                </span>
              )}
              {entry.name}
            </span>
          </div>
          {/* Name outside the bar — shown (crossfaded) when bar is too short
              to hold the label. Positioned at the bar's right edge so it
              tracks with bar growth. */}
          <span
            className="absolute text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap select-none"
            style={{
              top: '50%',
              left: `${Math.max(pct, 1)}%`,
              transform: 'translateY(-50%)',
              marginLeft: 6,
              opacity: nameInside ? 0 : 1,
              transition: `opacity 200ms linear, ${leftTransition}`,
              pointerEvents: nameInside || !linkCharacters ? 'none' : 'auto',
              cursor: linkCharacters ? 'pointer' : 'default',
            }}
            onClick={!nameInside ? onClick : undefined}
          >
            {entry.isSHP && (
              <span aria-label="Straw Hat Pirate" className="mr-1">
                {STRAW_HAT_MARKER}
              </span>
            )}
            {entry.name}
          </span>
        </div>
        <span className="w-10 text-right text-sm font-bold tabular-nums text-gray-900 flex-shrink-0">
          {Number.isInteger(entry.score) ? entry.score : entry.score.toFixed(1)}
        </span>
      </div>
    </div>
  )
}

interface CharacterAppearanceRaceProps {
  linkCharacters?: boolean
  compact?: boolean
}

/**
 * Animated race chart: characters ranked by appearance count in the trailing
 * N-chapter window, replayed across the entire series like a football league
 * table evolving over a season. Top 10 at each chapter.
 */
export function CharacterAppearanceRaceSection({
  linkCharacters = true,
  compact = false,
}: CharacterAppearanceRaceProps = {}) {
  const [windowSize, setWindowSize] = useState(20)
  const [barScale, setBarScale] = useState<BarScale>('absolute')
  const [shpFilter, setSHPFilter] = useState<RaceSHPFilter>('all')
  const [speed, setSpeed] = useState(2)
  const [playing, setPlaying] = useState(false)
  const [currentChapter, setCurrentChapter] = useState(1)
  // Smoothing on = EMA-decay scoring + rank hysteresis. Kills the two main
  // sources of visual chatter (discrete ±1 window steps, near-tie rank
  // flips) without changing what "recent appearances" means at the macro
  // level. Default on because the goal is a comfortable watch.
  const [smoothing, setSmoothing] = useState(true)

  const { data: raw, isLoading } = useQuery({
    queryKey: ['insights-raw-data'],
    queryFn: fetchInsightsRawData,
    staleTime: 10 * 60 * 1000,
  })

  const { frames, minChapter, maxChapter, maxScore } = useMemo(() => {
    const scoringMode: RaceScoringMode = smoothing ? 'decay' : 'window'
    // Margin of 1.0 prevents ties and ±1-step jitter from flipping ranks;
    // legitimate leads (> 1 appearance / decay unit) still overtake.
    const hysteresisMargin = smoothing ? 1.0 : 0
    if (!raw)
      return {
        frames: [],
        minChapter: 1,
        maxChapter: 0,
        maxScore: windowSize,
      }
    return computeRaceFrames({
      characters: raw.characters,
      shpIds: STRAW_HAT_IDS,
      windowSize,
      topN: COMPUTE_TOP,
      shpFilter,
      scoringMode,
      hysteresisMargin,
      // Top 5 stays score-truthful; hysteresis only calms the noisier
      // 6th-and-below slots where near-ties cause most flicker.
      hysteresisMinRank: 6,
    })
  }, [raw, windowSize, shpFilter, smoothing])

  // Arc lookup keyed by chapter — drives the "Currently in: ..." subtitle.
  const arcByChapter = useMemo(() => {
    if (!raw) return new Map<number, { title: string; id: string }>()
    const m = new Map<number, { title: string; id: string }>()
    for (const arc of raw.arcs) {
      for (let c = arc.start_chapter; c <= arc.end_chapter; c++) {
        m.set(c, { title: arc.title, id: arc.arc_id })
      }
    }
    return m
  }, [raw])

  // Clamp currentChapter whenever the valid range changes (e.g. after data
  // loads, or when toggling SHP filter changes the earliest appearance).
  const clampedChapter = Math.max(
    minChapter,
    Math.min(currentChapter, maxChapter || minChapter)
  )

  // Playback loop — advances currentChapter at FPS_AT_1X * speed.
  useEffect(() => {
    if (!playing || frames.length === 0) return
    let last = performance.now()
    let rafId = 0
    const msPerFrame = 1000 / (FPS_AT_1X * speed)
    const tick = (now: number) => {
      if (now - last >= msPerFrame) {
        setCurrentChapter((prev) => {
          const next = prev + 1
          if (next > maxChapter) {
            setPlaying(false)
            return maxChapter
          }
          return next
        })
        last = now
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [playing, frames.length, maxChapter, speed])

  const currentArc = arcByChapter.get(clampedChapter)

  // Match CSS transition to the playback frame interval so rows chain motion
  // without re-starting mid-tween. When paused (scrubbing), use a longer
  // duration so manual jumps still animate visibly.
  const msPerFrame = 1000 / (FPS_AT_1X * speed)
  const transitionMs = playing ? Math.max(80, msPerFrame) : 300

  const handlePlayToggle = () => {
    if (frames.length === 0) return
    if (clampedChapter >= maxChapter) {
      setCurrentChapter(minChapter)
      setPlaying(true)
      return
    }
    setPlaying((p) => !p)
  }

  const handleReset = () => {
    setPlaying(false)
    setCurrentChapter(minChapter)
  }

  const progressPct =
    maxChapter > minChapter
      ? ((clampedChapter - minChapter) / (maxChapter - minChapter)) * 100
      : 0

  return (
    <div className={compact ? '' : 'mb-6'}>
      <ChartCard
        title="Character Appearance Race"
        description={`Top ${TOP_N} characters ranked by ${smoothing ? `a ${windowSize}-chapter half-life decay` : `appearance count in the trailing ${windowSize}-chapter window`}. Press play to watch the race evolve across the series, or scrub to any chapter.`}
        downloadFileName="character-appearance-race"
        chartId="character-appearance-race"
        embedPath="/embed/insights/character-appearance-race"
        loading={isLoading}
        filters={
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2">
              <span className="text-gray-600">Window</span>
              <select
                value={windowSize}
                onChange={(e) => setWindowSize(parseInt(e.target.value, 10))}
                className="px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {WINDOW_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    last {v} chapters
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-gray-600">Bar scale</span>
              <select
                value={barScale}
                onChange={(e) => setBarScale(e.target.value as BarScale)}
                className="px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Absolute: bar width as fraction of window size. Relative: bars normalised against the current leader."
              >
                {BAR_SCALE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-gray-600">Smoothing</span>
              <select
                value={smoothing ? 'on' : 'off'}
                onChange={(e) => setSmoothing(e.target.value === 'on')}
                className="px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="On: old appearances fade (EMA) and near-tied ranks don't flip. Off: hard window count."
              >
                <option value="on">On</option>
                <option value="off">Off</option>
              </select>
            </label>
            <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
              {(['all', 'hide', 'only'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setSHPFilter(v)}
                  className={`px-3 py-1.5 transition-colors ${
                    shpFilter === v
                      ? 'bg-blue-600 text-white font-medium'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {v === 'all' ? 'All' : v === 'hide' ? 'Hide SHP' : 'Only SHP'}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2">
              <span className="text-gray-600">Speed</span>
              <select
                value={speed}
                onChange={(e) => setSpeed(parseInt(e.target.value, 10))}
                className="px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SPEED_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}×
                  </option>
                ))}
              </select>
            </label>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          {/* Chapter / arc header + play controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums leading-none">
                Chapter {clampedChapter}
              </div>
              {currentArc && (
                <div className="text-sm text-gray-600 mt-1 truncate">
                  {currentArc.title}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                disabled={frames.length === 0}
                aria-label="Reset to first chapter"
                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon icon={faRotateLeft} className="w-4 h-4" />
              </button>
              <button
                onClick={handlePlayToggle}
                disabled={frames.length === 0}
                aria-label={playing ? 'Pause' : 'Play'}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <FontAwesomeIcon
                  icon={playing ? faPause : faPlay}
                  className="w-4 h-4"
                />
                <span>
                  {playing
                    ? 'Pause'
                    : clampedChapter >= maxChapter && frames.length > 0
                      ? 'Replay'
                      : 'Play'}
                </span>
              </button>
            </div>
          </div>

          {/* Scrubber */}
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={minChapter}
              max={Math.max(minChapter, maxChapter)}
              value={clampedChapter}
              onChange={(e) => {
                setPlaying(false)
                setCurrentChapter(parseInt(e.target.value, 10))
              }}
              disabled={frames.length === 0}
              className="flex-1 accent-blue-600"
              aria-label="Scrub to chapter"
            />
            <span className="text-xs text-gray-500 tabular-nums w-24 text-right flex-shrink-0">
              {clampedChapter} / {maxChapter || '—'}
            </span>
          </div>

          {/* Race */}
          <RaceChart
            frames={frames}
            minChapter={minChapter}
            currentChapter={clampedChapter}
            maxScore={maxScore}
            barScale={barScale}
            transitionMs={transitionMs}
            linkCharacters={linkCharacters}
          />

          {/* Progress bar under the race — gives a glanceable sense of how far
              through the series the current frame sits. */}
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{
                width: `${progressPct}%`,
                transition: 'width 200ms linear',
              }}
            />
          </div>
        </div>
      </ChartCard>
    </div>
  )
}
