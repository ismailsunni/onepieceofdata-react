import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Saga, Arc } from '../../types/arc'
import type { Chapter } from '../../types/chapter'
import type { Character } from '../../types/character'

export type TimelineSelection =
  | { type: 'saga'; saga: Saga }
  | { type: 'arc'; arc: Arc }
  | { type: 'chapter'; chapter: Chapter }

const TYPE_META: Record<
  TimelineSelection['type'],
  { label: string; color: string; bg: string }
> = {
  saga: { label: 'Saga', color: 'text-violet-700', bg: 'bg-violet-100' },
  arc: { label: 'Arc', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  chapter: { label: 'Chapter', color: 'text-blue-700', bg: 'bg-blue-100' },
}

function CharacterChip({
  character,
  appearances,
  onNavigate,
}: {
  character: Character
  appearances: number
  onNavigate: () => void
}) {
  const [imgError, setImgError] = useState(false)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
  const imageUrl = `${supabaseUrl}/storage/v1/object/public/character-images/${encodeURIComponent(
    character.id
  )}.png`

  return (
    <Link
      to={`/characters/${character.id}`}
      onClick={onNavigate}
      className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors group"
      title={`${character.name} — ${appearances} appearance${appearances === 1 ? '' : 's'} here`}
    >
      <span className="w-7 h-7 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
        {imgError ? (
          <svg
            className="w-4 h-4 text-gray-300"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        ) : (
          <img
            src={imageUrl}
            alt={character.name || 'Character'}
            className="w-full h-full object-cover object-top"
            onError={() => setImgError(true)}
          />
        )}
      </span>
      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 whitespace-nowrap">
        {character.name || 'Unknown'}
      </span>
      <span className="text-xs text-gray-400">{appearances}</span>
    </Link>
  )
}

function formatDate(date: string | null): string | null {
  if (!date) return null
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

interface TimelineModalProps {
  selection: TimelineSelection
  characters: Character[]
  onClose: () => void
}

/**
 * Detail modal for a saga / arc / chapter selected on the Story Timeline.
 * Shows the entity's title, chapter range, description and the characters that
 * appear in it, plus a link to the full detail page.
 */
export default function TimelineModal({
  selection,
  characters,
  onClose,
}: TimelineModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const meta = TYPE_META[selection.type]

  const { title, subtitle, romanized, description, range, detailPath, extra } =
    useMemo(() => {
      if (selection.type === 'saga') {
        const s = selection.saga
        return {
          title: s.title,
          subtitle: s.japanese_title,
          romanized: s.romanized_title,
          description: s.description,
          range: `Chapters ${s.start_chapter}–${s.end_chapter}`,
          detailPath: `/sagas/${s.saga_id}`,
          extra: `${s.end_chapter - s.start_chapter + 1} chapters`,
        }
      }
      if (selection.type === 'arc') {
        const a = selection.arc
        return {
          title: a.title,
          subtitle: a.japanese_title,
          romanized: a.romanized_title,
          description: a.description,
          range: `Chapters ${a.start_chapter}–${a.end_chapter}`,
          detailPath: `/arcs/${a.arc_id}`,
          extra: `${a.end_chapter - a.start_chapter + 1} chapters`,
        }
      }
      const c = selection.chapter
      return {
        title: c.title
          ? `Chapter ${c.number}: ${c.title}`
          : `Chapter ${c.number}`,
        subtitle: null,
        romanized: null,
        description: null,
        range: c.volume != null ? `Volume ${c.volume}` : `Chapter ${c.number}`,
        detailPath: `/chapters/${c.number}`,
        extra: formatDate(c.date),
      }
    }, [selection])

  // Top characters appearing in this entity, ranked by appearances within range.
  const topCharacters = useMemo(() => {
    if (selection.type === 'chapter') {
      const n = selection.chapter.number
      return characters
        .filter((c) => c.chapter_list?.includes(n))
        .map((c) => ({ character: c, appearances: 1 }))
        .sort(
          (a, b) =>
            (b.character.appearance_count ?? 0) -
            (a.character.appearance_count ?? 0)
        )
        .slice(0, 16)
    }
    const start =
      selection.type === 'saga'
        ? selection.saga.start_chapter
        : selection.arc.start_chapter
    const end =
      selection.type === 'saga'
        ? selection.saga.end_chapter
        : selection.arc.end_chapter
    return characters
      .map((c) => ({
        character: c,
        appearances:
          c.chapter_list?.filter((ch) => ch >= start && ch <= end).length ?? 0,
      }))
      .filter((x) => x.appearances > 0)
      .sort((a, b) => b.appearances - a.appearances)
      .slice(0, 16)
  }, [selection, characters])

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${meta.label} details: ${title}`}
    >
      {/* Overlay */}
      <button
        className="absolute inset-0 bg-black/40"
        aria-label="Close details"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span
              className={`inline-block text-xs font-semibold uppercase tracking-wide ${meta.color} ${meta.bg} px-2 py-0.5 rounded mb-2`}
            >
              {meta.label}
            </span>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
            {romanized && <p className="text-xs text-gray-400">{romanized}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-5">
          {/* Meta row */}
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-gray-700 font-medium">
              {range}
            </span>
            {extra && (
              <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-gray-700">
                {extra}
              </span>
            )}
          </div>

          {/* Description */}
          {description ? (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Description
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm bg-gray-50 rounded-lg p-4">
                {description}
              </p>
            </div>
          ) : null}

          {/* Characters */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              {selection.type === 'chapter'
                ? 'Characters in this chapter'
                : 'Top characters'}
              {topCharacters.length > 0 && (
                <span className="ml-2 text-gray-400 font-normal">
                  ({topCharacters.length})
                </span>
              )}
            </h3>
            {topCharacters.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {topCharacters.map(({ character, appearances }) => (
                  <CharacterChip
                    key={character.id}
                    character={character}
                    appearances={appearances}
                    onNavigate={onClose}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                No character data available.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-end">
          <Link
            to={detailPath}
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            View full {meta.label.toLowerCase()} page →
          </Link>
        </div>
      </div>
    </div>
  )
}
