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

          {/* GitHub & Credits */}
          <section>
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">
              Open Source
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              This project is open source and available on GitHub. We welcome contributions,
              bug reports, and feature suggestions from the community.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://github.com/ismailsunni/onepieceofdata-react"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors duration-300"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                View on GitHub
              </a>
              <a
                href="https://github.com/ismailsunni/onepieceofdata-react/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Report Issue / Suggest Feature
              </a>
            </div>
          </section>

          {/* Credits */}
          <section>
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">
              Credits
            </h3>
            <div className="space-y-3 text-gray-700">
              <div>
                <p className="font-semibold">Created by:</p>
                <a
                  href="https://github.com/ismailsunni"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 hover:underline"
                >
                  @ismailsunni
                </a>
              </div>
              <div>
                <p className="font-semibold">Data Sources:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>
                    <a
                      href="https://onepiece.fandom.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      One Piece Wiki (Fandom)
                    </a>
                  </li>
                  <li>Official One Piece materials and community contributions</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold">Special Thanks:</p>
                <p className="ml-2">The One Piece community for their continued support and passion</p>
              </div>
            </div>
          </section>

          {/* Contact/Feedback */}
          <section className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              Feedback & Contributions
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Found a bug? Have a feature request? Want to contribute to the project?
              We'd love to hear from you!
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>
                  Report bugs or suggest features via{' '}
                  <a
                    href="https://github.com/ismailsunni/onepieceofdata-react/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                  >
                    GitHub Issues
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>
                  Contribute code via{' '}
                  <a
                    href="https://github.com/ismailsunni/onepieceofdata-react/pulls"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                  >
                    Pull Requests
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Star the project on GitHub if you find it useful!</span>
              </li>
            </ul>
          </section>
        </div>

        {/* Footer note */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Made with ❤️ and passion for the One Piece community</p>
          <p className="mt-2">Set sail and explore the data! 🏴‍☠️</p>
          <p className="mt-4 text-xs">
            <a
              href="https://github.com/ismailsunni/onepieceofdata-react"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-700 hover:underline"
            >
              View source code on GitHub
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}

export default AboutPage
