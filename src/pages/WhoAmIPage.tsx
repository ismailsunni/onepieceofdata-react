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

type Phase = 'intro' | 'playing' | 'result'

export default function WhoAmIPage() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [characters_, setCharacters] = useState<WhoAmICharacter[]>([])
  const [currentRound, setCurrentRound] = useState(0)
  const [roundResults, setRoundResults] = useState<WhoAmIRoundResult[]>([])
  const [totalScore, setTotalScore] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [stats, setStats] = useState<WhoAmIStats>(loadWhoAmIStats)

  const { data: allCharacters, isLoading: isLoadingCharacters } = useQuery({
    queryKey: ['characters'],
    queryFn: fetchCharacters,
    staleTime: CACHE.DEFAULT_STALE,
  })

  const { data: arcs, isLoading: isLoadingArcs } = useQuery({
    queryKey: ['arcs'],
    queryFn: fetchArcs,
    staleTime: CACHE.DEFAULT_STALE,
  })

  const { data: allAffiliations, isLoading: isLoadingAffiliations } = useQuery({
    queryKey: ['all-affiliations'],
    queryFn: fetchAllAffiliations,
    staleTime: CACHE.DEFAULT_STALE,
  })

  const { data: allDevilFruits, isLoading: isLoadingDevilFruits } = useQuery({
    queryKey: ['all-devil-fruits'],
    queryFn: fetchAllDevilFruits,
    staleTime: CACHE.DEFAULT_STALE,
  })

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
        // Short delay before advancing to next round
        setTimeout(() => {
          setCurrentRound((prev) => prev + 1)
        }, 2000)
      } else {
        // Game over
        const correctCount = newResults.filter((r) => r.guessedCorrectly).length
        const updated = saveWhoAmIGameResult(
          newScore,
          correctCount,
          newResults.length
        )
        setStats(updated)
        setTimeout(() => {
          setPhase('result')
        }, 2000)
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
      {phase === 'intro' && (
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
