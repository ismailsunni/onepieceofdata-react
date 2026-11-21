import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchAllDevilFruits } from '../services/devilFruitService'
import { fetchCharacters } from '../services/characterService'
import { devilFruitSlug } from '../data/buildData'

function DevilFruitDetailPage() {
  const { slug } = useParams<{ slug: string }>()

  const { data: fruits = [], isLoading: loadingFruits } = useQuery({
    queryKey: ['all-devil-fruits'],
    queryFn: fetchAllDevilFruits,
    staleTime: 10 * 60 * 1000,
  })
  const { data: characters = [], isLoading: loadingChars } = useQuery({
    queryKey: ['characters'],
    queryFn: fetchCharacters,
  })

  const rows = useMemo(
    () => fruits.filter((f) => devilFruitSlug(f.fruit_name) === slug),
    [fruits, slug]
  )
  const users = useMemo(() => {
    const byId = new Map(characters.map((c) => [c.id, c]))
    return rows.map((r) => ({
      id: r.character_id,
      name: byId.get(r.character_id)?.name ?? r.character_id,
      model: r.fruit_model,
    }))
  }, [rows, characters])

  const fruit = rows[0]
  const isLoading = loadingFruits || loadingChars
  const facts = fruit
    ? [
        ['Type', fruit.fruit_type],
        ['Sub-type', fruit.fruit_sub_type],
        ['English name', fruit.english_name],
        ['Meaning', fruit.meaning],
        ['Artificial', fruit.is_artificial ? 'Yes' : 'No'],
      ].filter((f): f is [string, string] => !!f[1])
    : []

  return (
    <main className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-gray-900 transition-colors">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            to="/devil-fruits"
            className="hover:text-gray-900 transition-colors"
          >
            Devil Fruits
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-gray-900 font-medium">
            {fruit?.fruit_name ?? slug}
          </span>
        </nav>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
        ) : !fruit ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500">
            Devil fruit not found.{' '}
            <Link to="/devil-fruits" className="text-blue-600 hover:underline">
              Browse all devil fruits
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-gray-900">
              {fruit.fruit_name}
            </h1>
            <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-8">
              <dl className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {facts.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-gray-500">{label}</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Users
              </h2>
              <ul className="space-y-2">
                {users.map((u) => (
                  <li key={u.id} className="text-sm">
                    <Link
                      to={`/characters/${u.id}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      {u.name}
                    </Link>
                    {u.model && (
                      <span className="text-gray-500"> ({u.model})</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default DevilFruitDetailPage
