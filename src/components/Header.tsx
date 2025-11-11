import Navigation from './Navigation'

function Header() {
  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">One Piece of Data</h1>
            <p className="text-blue-100 mt-2">
              Explore the world of One Piece through data
            </p>
          </div>
          <Navigation />
        </div>
      </div>
    </header>
  )
}

export default Header
