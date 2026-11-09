import {
  SCOPE_TYPES,
  type NameThemAllScopeType,
} from '../../services/nameThemAllService'

export interface ScopeOption {
  id: string
  title: string
  count: number
}

interface NameThemAllIntroProps {
  scopeType: NameThemAllScopeType
  onScopeTypeChange: (type: NameThemAllScopeType) => void
  options: ScopeOption[]
  selectedId: string
  onSelect: (id: string) => void
  onStart: () => void
  isLoading: boolean
}

export default function NameThemAllIntro({
  scopeType,
  onScopeTypeChange,
  options,
  selectedId,
  onSelect,
  onStart,
  isLoading,
}: NameThemAllIntroProps) {
  const selected = options.find((o) => o.id === selectedId)
  const minutes = SCOPE_TYPES.find((t) => t.id === scopeType)?.minutes

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
        Name Them All
      </h1>
      <p className="text-gray-600 text-lg mb-6 max-w-md">
        Pick an arc, a saga, one side of the time skip or the whole story, then
        name every character who appears in it before the clock runs out.
      </p>

      <div
        role="group"
        aria-label="Choose what to play"
        className="inline-flex bg-gray-100 rounded-xl p-1 mb-4"
      >
        {SCOPE_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onScopeTypeChange(t.id)}
            aria-pressed={scopeType === t.id}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              scopeType === t.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <label className="w-full max-w-sm text-left mb-6">
        <span className="sr-only">Choose the round</span>
        <select
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
          disabled={isLoading}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.title} ({o.count})
            </option>
          ))}
        </select>
      </label>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 max-w-sm w-full text-left space-y-3">
        {[
          `Name all ${selected?.count ?? '…'} characters in ${selected?.title ?? 'the selection'}`,
          scopeType === 'all'
            ? 'No suggestions — type a name and press Enter (small typos are OK)'
            : 'Type to search — pick a name from the suggestions',
          `${minutes} minutes on the clock — give up any time`,
          'Wrong guesses are counted, so choose carefully',
        ].map((line, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="text-blue-600 font-bold text-sm mt-0.5">
              0{i + 1}
            </span>
            <p className="text-gray-700 text-sm">{line}</p>
          </div>
        ))}
      </div>

      <button
        onClick={onStart}
        disabled={isLoading || !selected || selected.count === 0}
        className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            Loading...
          </span>
        ) : (
          'Start Game'
        )}
      </button>
    </div>
  )
}
