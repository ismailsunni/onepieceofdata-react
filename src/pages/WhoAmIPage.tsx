import { useState, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCharacters } from '../services/characterService'
import { fetchArcs } from '../services/arcService'
import { fetchAllAffiliations } from '../services/affiliationService'
import { fetchAllDevilFruits } from '../services/devilFruitService'
import type { CharacterAffiliation } from '../types/affiliation'
import type { CharacterDevilFruit } from '../types/devilFruit'
import { generateWhoAmIRound } from '../services/whoAmIService'
import {
  loadWhoAmIStats,
  saveWhoAmIGameResult,
  type WhoAmIStats,
} from '../services/whoAmIStatsService'
import { CACHE } from '../constants/cache'
import type { Arc } from '../types/arc'
import type { WhoAmICharacter, WhoAmIRoundResult } from '../types/whoAmI'
import WhoAmIIntro from '../components/whoami/WhoAmIIntro'
import WhoAmIRound from '../components/whoami/WhoAmIRound'
import WhoAmIResult from '../components/whoami/WhoAmIResult'
import ErrorState from '../components/common/ErrorState'

type Phase = 'intro' | 'playing' | 'result'

export default function WhoAmIPage() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [characters_, setCharacters] = useState<WhoAmICharacter[]>([])
  const [currentRound, setCurrentRound] = useState(0)
  const [roundResults, setRoundResults] = useState<WhoAmIRoundResult[]>([])
  const [totalScore, setTotalScore] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [stats, setStats] = useState<WhoAmIStats>(loadWhoAmIStats)

  const charactersQuery = useQuery({
    queryKey: ['characters'],
    queryFn: fetchCharacters,
    staleTime: CACHE.DEFAULT_STALE,
  })
  const arcsQuery = useQuery({
    queryKey: ['arcs'],
    queryFn: fetchArcs,
    staleTime: CACHE.DEFAULT_STALE,
  })
  const affiliationsQuery = useQuery({
    queryKey: ['all-affiliations'],
    queryFn: fetchAllAffiliations,
    staleTime: CACHE.DEFAULT_STALE,
  })
  const devilFruitsQuery = useQuery({
    queryKey: ['all-devil-fruits'],
    queryFn: fetchAllDevilFruits,
    staleTime: CACHE.DEFAULT_STALE,
  })

  const allCharacters = charactersQuery.data
  const arcs = arcsQuery.data
  const allAffiliations = affiliationsQuery.data
  const allDevilFruits = devilFruitsQuery.data
  const isLoadingCharacters = charactersQuery.isLoading
  const isLoadingArcs = arcsQuery.isLoading
  const isLoadingAffiliations = affiliationsQuery.isLoading
  const isLoadingDevilFruits = devilFruitsQuery.isLoading
  const isAnyError =
    charactersQuery.isError ||
    arcsQuery.isError ||
    affiliationsQuery.isError ||
    devilFruitsQuery.isError
  const retryFailed = () => {
    if (charactersQuery.isError) charactersQuery.refetch()
    if (arcsQuery.isError) arcsQuery.refetch()
    if (affiliationsQuery.isError) affiliationsQuery.refetch()
    if (devilFruitsQuery.isError) devilFruitsQuery.refetch()
  }

  const arcMap = useMemo(() => {
    const map = new Map<string, Arc>()
    arcs?.forEach((a) => map.set(a.arc_id, a))
    return map
  }, [arcs])

  const affiliationMap = useMemo(() => {
    const map = new Map<string, CharacterAffiliation[]>()
    allAffiliations?.forEach((a) => {
      const existing = map.get(a.character_id) ?? []
      existing.push(a)
      map.set(a.character_id, existing)
    })
    return map
  }, [allAffiliations])

  const devilFruitMap = useMemo(() => {
    const map = new Map<string, CharacterDevilFruit[]>()
    allDevilFruits?.forEach((f) => {
      const existing = map.get(f.character_id) ?? []
      existing.push(f)
      map.set(f.character_id, existing)
    })
    return map
  }, [allDevilFruits])

  const isLoading =
    isLoadingCharacters ||
    isLoadingArcs ||
    isLoadingAffiliations ||
    isLoadingDevilFruits

  const startGame = useCallback(async () => {
    if (!allCharacters || allCharacters.length === 0) return

    setIsGenerating(true)
    const generated = await generateWhoAmIRound(
      allCharacters,
      arcMap,
      affiliationMap,
      devilFruitMap
    )
    setIsGenerating(false)

    if (!generated) return

    setCharacters(generated)
    setRoundResults([])
    setTotalScore(0)
    setCurrentRound(0)
    setPhase('playing')
  }, [allCharacters, arcMap, affiliationMap, devilFruitMap])

  const handleRoundComplete = useCallback(
    (result: WhoAmIRoundResult) => {
      const newResults = [...roundResults, result]
      const newScore = totalScore + result.pointsEarned

      setRoundResults(newResults)
      setTotalScore(newScore)

      if (currentRound < characters_.length - 1) {
        setCurrentRound((prev) => prev + 1)
      } else {
        // Game over
        const correctCount = newResults.filter((r) => r.guessedCorrectly).length
        const updated = saveWhoAmIGameResult(
          newScore,
          correctCount,
          newResults.length
        )
        setStats(updated)
        setPhase('result')
      }
    },
    [currentRound, characters_, roundResults, totalScore]
  )

  const handlePlayAgain = useCallback(() => {
    setPhase('intro')
    setCharacters([])
    setRoundResults([])
    setTotalScore(0)
    setCurrentRound(0)
  }, [])

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {isAnyError ? (
        <ErrorState
          message="Failed to load game data. Please try again."
          onRetry={retryFailed}
        />
      ) : null}

      {!isAnyError && phase === 'intro' && (
        <WhoAmIIntro
          onStart={startGame}
          isLoading={isLoading || isGenerating}
          stats={stats}
        />
      )}

      {phase === 'playing' && characters_[currentRound] && allCharacters && (
        <WhoAmIRound
          key={currentRound}
          character={characters_[currentRound]}
          roundIndex={currentRound}
          totalRounds={characters_.length}
          allCharacters={allCharacters}
          onRoundComplete={handleRoundComplete}
        />
      )}

      {phase === 'result' && (
        <WhoAmIResult
          roundResults={roundResults}
          totalScore={totalScore}
          onPlayAgain={handlePlayAgain}
          stats={stats}
        />
      )}
    </div>
  )
}
