import { ChartCard } from '../common/ChartCard'
import {
  CumulativeDebutChartBody,
  CumulativeDebutControls,
} from './CumulativeDebutChart'
import { useCumulativeDebuts } from './useCumulativeDebuts'
import type { Character } from '../../types/character'
import type { Arc, Saga } from '../../types/arc'

interface Props {
  characters: Character[]
  arcs: Arc[]
  sagas: Saga[]
}

export function CumulativeDebutSection({ characters, arcs, sagas }: Props) {
  const { granularity, setGranularity, filterOn, setFilterOn, series } =
    useCumulativeDebuts(characters, arcs, sagas)

  return (
    <div className="mb-6">
      <ChartCard
        title="Cumulative Character Debuts"
        description="Cumulative number of distinct characters that have debuted by each chapter, arc, or saga."
        downloadFileName="cumulative-debuts"
        chartId="cumulative-debuts"
        embedPath="/embed/insights/cumulative-debuts"
        isEmpty={series.total === 0}
        emptyMessage="No characters match the current filter."
        filters={
          <CumulativeDebutControls
            granularity={granularity}
            setGranularity={setGranularity}
            filterOn={filterOn}
            setFilterOn={setFilterOn}
            hiddenCount={series.hiddenCount}
          />
        }
      >
        <CumulativeDebutChartBody series={series} granularity={granularity} />
      </ChartCard>
    </div>
  )
}
