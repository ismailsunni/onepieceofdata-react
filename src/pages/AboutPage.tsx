function AboutPage() {
  return (
    <main className="container mx-auto px-4 py-6 md:py-12">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
          About One Piece of Data
        </h2>

        <div className="bg-white rounded-lg shadow-md p-6 md:p-8 space-y-6">
          {/* Introduction */}
          <section>
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">
              What is One Piece of Data?
            </h3>
            <p className="text-gray-700 leading-relaxed">
              One Piece of Data is a comprehensive data exploration platform dedicated to the
              One Piece universe. This website provides an interactive way to explore characters,
              story arcs, chapters, and statistical insights from Eiichiro Oda's legendary manga series.
            </p>
          </section>

          {/* Features */}
          <section>
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">
              Features
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>
                <strong>Character Database:</strong> Browse detailed information about characters
                including their status, bounties, origins, and appearance history
              </li>
              <li>
                <strong>Story Arcs:</strong> Explore all major story arcs and their connections
                to sagas, with chapter ranges and character appearances
              </li>
              <li>
                <strong>Chapter Information:</strong> Access comprehensive chapter data including
                release dates, volumes, and character counts
              </li>
              <li>
                <strong>Analytics Dashboard:</strong> Visualize data through interactive charts
                and statistics about the One Piece world
              </li>
            </ul>
          </section>

          {/* Tech Stack */}
          <section>
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">
              Technology
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              Built with modern web technologies for a fast and responsive experience:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Frontend</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• React 18+ with TypeScript</li>
                  <li>• Vite for fast builds</li>
                  <li>• TailwindCSS for styling</li>
                  <li>• React Router for navigation</li>
                  <li>• Recharts for visualizations</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Backend & Data</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Supabase (PostgreSQL)</li>
                  <li>• React Query for data fetching</li>
                  <li>• GitHub Pages hosting</li>
                  <li>• Umami for analytics</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Source */}
          <section>
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">
              Data Sources
            </h3>
            <p className="text-gray-700 leading-relaxed">
              The data is carefully curated and sourced from official One Piece materials and
              the One Piece community. We strive to keep information accurate and up-to-date
              with the latest chapters and official announcements.
            </p>
          </section>

          {/* Disclaimer */}
          <section className="border-t pt-6">
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">
              Disclaimer
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              One Piece of Data is a fan-made project and is not affiliated with, endorsed by,
              or connected to Eiichiro Oda, Shueisha, Toei Animation, or any official One Piece
              entities. All One Piece characters, stories, and related content are the property
              of their respective owners. This website is created purely for educational and
              informational purposes for fans of the series.
            </p>
          </section>

          {/* Contact/Feedback */}
          <section className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              Feedback & Contributions
            </h3>
            <p className="text-gray-700 leading-relaxed">
              This is an open-source project. If you find any errors in the data or have
              suggestions for improvements, please feel free to contribute or report issues
              on our GitHub repository.
            </p>
          </section>
        </div>

        {/* Footer note */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Made with passion for the One Piece community</p>
          <p className="mt-2">Set sail and explore the data! 🏴‍☠️</p>
        </div>
      </div>
    </main>
  )
}

export default AboutPage
