import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchCharacters } from '../services/characterService'
import { fetchArcs } from '../services/arcService'
import { fetchSagas } from '../services/sagaService'
import { fetchAllDevilFruits } from '../services/devilFruitService'
import { fetchAllAffiliations } from '../services/affiliationService'
import { getCharacterImageUrl } from '../services/quizService'
import {
  MAX_GUESSES,
  buildDb,
  compare,
  dailyAnswer,
  formatBounty,
  relation,
  todayKey,
  type Db,
  type Profile,
} from '../services/mysteryCharacterService'
import {
  loadMysteryStats,
  saveMysteryResult,
  type MysteryMode,
} from '../services/mysteryCharacterStatsService'
import { shareText } from '../utils/shareGame'
import { CACHE } from '../constants/cache'
import CharacterGuessInput from '../components/whoami/CharacterGuessInput'
import MysteryGuessCard from '../components/mystery/MysteryGuessCard'
import MysteryStatsPanel from '../components/mystery/MysteryStatsPanel'
import ErrorState from '../components/common/ErrorState'

const q = <T,>(key: string, fn: () => Promise<T>) => ({
  queryKey: [key],
  queryFn: fn,
  staleTime: CACHE.DEFAULT_STALE,
})

export default function MysteryCharacterPage() {
  const [mode, setMode] = useState<MysteryMode>('daily')
  const [seed, setSeed] = useState(() => Math.random())

  const characters = useQuery(q('characters', fetchCharacters))
  const arcs = useQuery(q('arcs', fetchArcs))
  const sagas = useQuery(q('sagas', fetchSagas))
  const fruits = useQuery(q('all-devil-fruits', fetchAllDevilFruits))
  const affiliations = useQuery(q('all-affiliations', fetchAllAffiliations))

  const db = useMemo(
    () =>
      characters.data &&
      arcs.data &&
      sagas.data &&
      fruits.data &&
      affiliations.data
        ? buildDb(
            characters.data,
            arcs.data,
            sagas.data,
            fruits.data,
            affiliations.data
          )
        : null,
    [characters.data, arcs.data, sagas.data, fruits.data, affiliations.data]
  )

  const date = todayKey()
  const answer = useMemo(() => {
    if (!db || db.answers.length === 0) return null
    return mode === 'daily'
      ? dailyAnswer(db.answers, date)
      : db.answers[Math.floor(seed * db.answers.length)]
  }, [db, mode, date, seed])

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
        Mystery Character
      </h1>
      <p className="text-gray-600 text-center mb-4">
        Guess the One Piece character in {MAX_GUESSES} tries. Each guess reveals
        how close you are.
      </p>

      <div
        role="group"
        aria-label="Mode"
        className="flex bg-gray-100 rounded-xl p-1 mb-6"
      >
        {(['daily', 'practice'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              mode === m
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {m === 'daily' ? `Daily · ${date}` : 'Practice'}
          </button>
        ))}
      </div>

      {characters.isError ? (
        <ErrorState
          message="Failed to load characters."
          onRetry={() => characters.refetch()}
        />
      ) : !db || !answer ? (
        <div className="flex justify-center py-12">
          <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <Game
          key={mode === 'daily' ? date : `p${seed}`}
          db={db}
          answer={answer}
          mode={mode}
          storageKey={mode === 'daily' ? `opod-mystery-daily-${date}` : null}
          shareTitle={mode === 'daily' ? date : 'Practice'}
          onPlayAgain={
            mode === 'practice' ? () => setSeed(Math.random()) : null
          }
        />
      )}
    </div>
  )
}

interface GameState {
  guesses: string[]
  gaveUp: boolean
  recorded?: boolean
}

function load(key: string | null): GameState {
  try {
    if (key) return JSON.parse(localStorage.getItem(key) ?? '')
  } catch {
    // no saved state
  }
  return { guesses: [], gaveUp: false }
}

function Game({
  db,
  answer,
  mode,
  storageKey,
  shareTitle,
  onPlayAgain,
}: {
  db: Db
  answer: Profile
  mode: MysteryMode
  storageKey: string | null
  shareTitle: string
  onPlayAgain: (() => void) | null
}) {
  const [state, setState] = useState(() => load(storageKey))
  const { guesses, gaveUp } = state
  const [stats, setStats] = useState(() => loadMysteryStats(mode))
  const [isNewBest, setIsNewBest] = useState(false)

  const update = (next: GameState) => {
    const win = next.guesses.includes(answer.id)
    if (
      !next.recorded &&
      (win || next.gaveUp || next.guesses.length >= MAX_GUESSES)
    ) {
      const r = saveMysteryResult(mode, win ? next.guesses.length : null)
      setStats(r.stats)
      setIsNewBest(r.isNewBest)
      next = { ...next, recorded: true }
    }
    setState(next)
  }

  useEffect(() => {
    if (!storageKey) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(state))
    } catch {
      // storage unavailable
    }
  }, [storageKey, state])

  const rows = useMemo(
    () =>
      guesses
        .filter((id) => db.profiles.has(id))
        .map((id) => {
          const p = db.profiles.get(id)!
          return { p, clues: compare(p, answer), rel: relation(db, p, answer) }
        }),
    [guesses, db, answer]
  )
  const won = guesses.includes(answer.id)
  const over = won || gaveUp || guesses.length >= MAX_GUESSES
  const options = useMemo(
    () => db.guessable.filter((c) => !guesses.includes(c.id)),
    [db, guesses]
  )

  const share = () => {
    const lines = rows.map(
      (r) =>
        r.clues.map((c) => (c.exact ? '🟩' : '⬜')).join('') +
        ('together' in r.rel && r.p.id !== answer.id ? ' 🤝' : '')
    )
    shareText(
      `🏴‍☠️ One Piece of Data — Mystery Character ${shareTitle}\n${won ? guesses.length : 'X'}/${MAX_GUESSES}\n${lines.join('\n')}\nhttps://onepieceofdata.com/#/games/mystery-character`
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {!over && (
        <>
          <CharacterGuessInput
            characters={options}
            onGuess={(id) => update({ ...state, guesses: [...guesses, id] })}
            disabled={false}
            dropDown
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>
              Guess {guesses.length + 1} of {MAX_GUESSES}
            </span>
            {guesses.length > 0 && (
              <button
                onClick={() => update({ ...state, gaveUp: true })}
                className="text-red-600 hover:underline"
              >
                Give up
              </button>
            )}
          </div>
        </>
      )}

      {over && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-lg font-semibold mb-3">
            {won ? `🎉 Got it in ${guesses.length}!` : 'The answer was…'}
          </p>
          <Link
            to={`/characters/${encodeURIComponent(answer.id)}`}
            className="inline-block group"
          >
            <img
              src={getCharacterImageUrl(answer.id)}
              alt={answer.name}
              className="w-24 h-24 rounded-full object-cover object-top mx-auto mb-2 bg-gray-100"
            />
            <p className="text-xl font-bold text-gray-900 group-hover:text-blue-600">
              {answer.name}
            </p>
          </Link>
          <p className="text-xs text-gray-600 mt-1">
            Debut: {answer.debutArc?.title ?? 'Unknown'} · {answer.chapters}{' '}
            chapters · Bounty {formatBounty(answer.bounty)}
          </p>
          <div className="flex gap-2 mt-4">
            <button
              onClick={share}
              className="flex-1 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Share
            </button>
            {onPlayAgain && (
              <button
                onClick={onPlayAgain}
                className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                Play again
              </button>
            )}
          </div>
          <div className="mt-4">
            <MysteryStatsPanel
              stats={stats}
              isNewBest={isNewBest}
              highlight={won ? guesses.length : undefined}
            />
          </div>
        </div>
      )}

      {[...rows].reverse().map((r) => (
        <MysteryGuessCard
          key={r.p.id}
          name={r.p.name}
          clues={r.clues}
          relation={r.rel}
          correct={r.p.id === answer.id}
        />
      ))}

      {!over && <MysteryStatsPanel stats={stats} />}
    </div>
  )
}
