import { Link } from 'react-router-dom'
import { StoryGraphView } from '../components/analytics/StoryGraphView'

export default function StoryGraphPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-500">
        <Link to="/analytics" className="hover:text-blue-600">
          Analytics
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">Story Graph</span>
        <sup className="text-xs text-orange-500 ml-1">beta</sup>
      </nav>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Story Graph</h1>
        <p className="mt-2 text-gray-600 max-w-3xl">
          A relationship network of characters, crews, organizations, sagas and
          arcs, built from LLM-extracted triples over the One Piece wiki. Use
          the controls to focus on a character, expand by hops, or filter by
          confidence and relation type.
        </p>
      </div>

      <StoryGraphView />
    </div>
  )
}
