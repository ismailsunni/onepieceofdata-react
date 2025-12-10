import { Link } from 'react-router-dom'
import Navigation from './Navigation'

function Header() {
  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <h1 className="text-2xl md:text-3xl font-bold">One Piece of Data</h1>
            <p className="text-blue-100 mt-1 md:mt-2 text-sm md:text-base">
              Explore the world of One Piece through data
            </p>
          </Link>
          <div className="flex items-center gap-4">
            <Navigation />
            <a
              href="https://github.com/ismailsunni/onepieceofdata-react/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors duration-300 text-sm"
              title="Report an issue or suggest a feature"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <span>Feedback</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
