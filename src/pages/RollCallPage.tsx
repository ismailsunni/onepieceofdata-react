import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCharacters } from '../services/characterService'
import { fetchArcs } from '../services/arcService'
import { fetchSagas } from '../services/sagaService'
import {
  buildScopes,
  charactersInScope,
  isGuessable,
  type RollCallGuess,
  type RollCallScopeType,
} from '../services/rollCallService'
import { CACHE } from '../constants/cache'
import RollCallIntro from '../components/rollcall/RollCallIntro'
import RollCallRound from '../components/rollcall/RollCallRound'
import RollCallResult from '../components/rollcall/RollCallResult'
import ErrorState from '../components/common/ErrorState'

type Phase = 'intro' | 'playing' | 'result'

export default function RollCallPage() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [scopeType, setScopeType] = useState<RollCallScopeType>('arc')
  const [selectedId, setSelectedId] = useState('')
  const [guesses, setGuesses] = useState<RollCallGuess[]>([])
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [round, setRound] = useState(0)

  const characters = useQuery({
    queryKey: ['characters'],
    queryFn: fetchCharacters,
    staleTime: CACHE.DEFAULT_STALE,
  })
  const arcs = useQuery({
    queryKey: ['arcs'],
    queryFn: fetchArcs,
    staleTime: CACHE.DEFAULT_STALE,
  })
  const sagas = useQuery({
    queryKey: ['sagas'],
    queryFn: fetchSagas,
    staleTime: CACHE.DEFAULT_STALE,
  })

  const pool = useMemo(
    () => (characters.data ?? []).filter(isGuessable),
    [characters.data]
  )

  const options = useMemo(
    () =>
      buildScopes(scopeType, arcs.data ?? [], sagas.data ?? []).map((s) => ({
        ...s,
        count: charactersInScope(pool, s).length,
      })),
    [scopeType, sagas.data, arcs.data, pool]
  )

  const scope = options.find((o) => o.id === selectedId) ?? options[0] ?? null

  const targets = useMemo(
    () => (scope ? charactersInScope(pool, scope) : []),
    [pool, scope]
  )
  const targetIds = useMemo(() => new Set(targets.map((c) => c.id)), [targets])

  const start = () => {
    setGuesses([])
    setRound((r) => r + 1)
    setPhase('playing')
  }

  const finish = useCallback((left: number) => {
    setSecondsLeft(left)
    setPhase('result')
  }, [])

  const handleGuess = (id: string, name: string) =>
    setGuesses((prev) => [...prev, { id, name, correct: targetIds.has(id) }])

  if (characters.isError) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <ErrorState
          message="Failed to load characters. Please try again."
          onRetry={() => characters.refetch()}
        />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {phase === 'intro' && (
        <RollCallIntro
          scopeType={scopeType}
          onScopeTypeChange={(t) => {
            setScopeType(t)
            setSelectedId('')
          }}
          options={options}
          selectedId={scope?.id ?? ''}
          onSelect={setSelectedId}
          onStart={start}
          isLoading={characters.isLoading || arcs.isLoading || sagas.isLoading}
        />
      )}

      {phase === 'playing' && scope && (
        <RollCallRound
          key={round}
          scope={scope}
          total={targets.length}
          pool={pool}
          guesses={guesses}
          onGuess={handleGuess}
          onFinish={finish}
        />
      )}

      {phase === 'result' && scope && (
        <RollCallResult
          scope={scope}
          targets={targets}
          guesses={guesses}
          secondsLeft={secondsLeft}
          onPlayAgain={start}
          onChangeScope={() => setPhase('intro')}
        />
      )}
    </div>
  )
}
