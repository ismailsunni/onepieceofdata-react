import { Link } from 'react-router-dom'
import Navigation from './Navigation'
import Search from './Search'

function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-6">
          {/* Logo/Brand */}
          <Link
            to="/"
            className="flex items-center gap-3 group flex-shrink-0"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">O</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-900 font-semibold text-base leading-tight group-hover:text-blue-600 transition-colors">
                One Piece of Data
              </span>
              <span className="text-gray-500 text-xs leading-tight hidden sm:block">
                Data exploration for One Piece
              </span>
            </div>
          </Link>

          {/* Search */}
          <div className="hidden md:block flex-1 max-w-md">
            <Search />
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-6">
            <Navigation />

            {/* Feedback Link */}
            <a
              href="https://github.com/ismailsunni/onepieceofdata-react/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm transition-colors"
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
