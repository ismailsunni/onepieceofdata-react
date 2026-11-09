import type { Clue } from '../../services/mysteryCharacterService'

interface MysteryGuessCardProps {
  name: string
  clues: Clue[]
  relation: { together: number } | { steps: number | null }
  correct: boolean
}

const relationText = (r: MysteryGuessCardProps['relation']) =>
  'together' in r
    ? `🤝 Appeared together in ${r.together} chapter${r.together === 1 ? '' : 's'}`
    : r.steps
      ? `Never together · ${r.steps} steps apart via co-appearances`
      : 'Never together · not connected'

export default function MysteryGuessCard({
  name,
  clues,
  relation,
  correct,
}: MysteryGuessCardProps) {
  return (
    <div
      className={`bg-white border rounded-xl p-3 ${
        correct ? 'border-green-500 border-2' : 'border-gray-200'
      }`}
    >
      <p className="font-semibold text-gray-900 text-sm mb-2">
        {correct && '✅ '}
        {name}
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {clues.map((c) => (
          <div
            key={c.label}
            className={`rounded-lg px-2 py-1.5 text-center ${
              c.exact
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            <p className="text-[10px] uppercase tracking-wide opacity-70">
              {c.label}
            </p>
            <p className="text-xs font-semibold leading-tight break-words">
              {c.value}
              {!c.exact && c.dir && (
                <span
                  aria-label={
                    c.dir === 'up'
                      ? 'answer is higher or later'
                      : 'answer is lower or earlier'
                  }
                >
                  {c.dir === 'up' ? ' ↑' : ' ↓'}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>
      {!correct && (
        <p className="text-xs text-gray-600 mt-2">{relationText(relation)}</p>
      )}
    </div>
  )
}
