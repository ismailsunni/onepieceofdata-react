import Header from './components/Header'
import Card from './components/Card'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Welcome to One Piece of Data
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your comprehensive data exploration platform for the One Piece
            universe. Dive into character stats, story arcs, and devil fruit
            abilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <Card
            icon="👤"
            title="Characters"
            description="Explore detailed information about your favorite One Piece characters, their abilities, and bounties."
          />
          <Card
            icon="📖"
            title="Story Arcs"
            description="Journey through the various story arcs and discover key events that shaped the One Piece world."
          />
          <Card
            icon="🍎"
            title="Devil Fruits"
            description="Learn about the mysterious Devil Fruits and the incredible powers they grant to their users."
          />
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-500">
            Built with React, TypeScript, and TailwindCSS
          </p>
        </div>
      </main>
    </div>
  )
}

export default App
