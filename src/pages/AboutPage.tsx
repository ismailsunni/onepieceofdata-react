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
                <p className="font-semibold">Powered by:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>
                    <a
                      href="https://pages.github.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      GitHub Pages
                    </a>
                    {' '}for hosting
                  </li>
                  <li>
                    <a
                      href="https://supabase.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Supabase
                    </a>
                    {' '}for database
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-semibold">Special Thanks:</p>
                <p className="ml-2">The One Piece community for their continued support and passion</p>
              </div>
            </div>
          </section>

          {/* Data Source */}
          <section>
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">
              Data Source
            </h3>
            <div className="text-gray-700 space-y-2">
              <p>
                Data is sourced from{' '}
                <a
                  href="https://one-piece.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                >
                  One Piece
                </a>
                {' '}manga and{' '}
                <a
                  href="https://onepiece.fandom.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                >
                  One Piece Wiki (Fandom)
                </a>
              </p>
              <p>
                Support the official release! Read One Piece on{' '}
                <a
                  href="https://mangaplus.shueisha.co.jp/titles/100020"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                >
                  Manga Plus
                </a>
                {' '}or buy the official comics.
              </p>
            </div>
          </section>

          {/* Support the Project */}
          <section className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>☕</span>
              Support the Project
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Currently, this project runs on free tiers of GitHub Pages and Supabase.
              If you find this project useful and would like to support its development,
              you can buy me a coffee or help me subscribe to Agentic AI tools to improve this project!
            </p>
            <a
              href="https://buymeacoffee.com/ismailsunni"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg transition-colors duration-300 font-medium"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 00-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 00-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.284 1.123.366 1.075.238 2.189.331 3.287.37 1.218.05 2.437.01 3.65-.118.299-.033.598-.073.896-.119.352-.054.578-.513.474-.834-.124-.383-.457-.531-.834-.473-.466.074-.96.108-1.382.146-1.177.08-2.358.082-3.536.006a22.228 22.228 0 01-1.157-.107c-.086-.01-.18-.025-.258-.036-.243-.036-.484-.08-.724-.13-.111-.027-.111-.185 0-.212h.005c.277-.06.557-.108.838-.147h.002c.131-.009.263-.032.394-.048a25.076 25.076 0 013.426-.12c.674.019 1.347.067 2.017.144l.228.031c.267.04.533.088.798.145.392.085.895.113 1.07.542.055.137.08.288.111.431l.319 1.484a.237.237 0 01-.199.284h-.003c-.037.006-.075.01-.112.015a36.704 36.704 0 01-4.743.295 37.059 37.059 0 01-4.699-.304c-.14-.017-.293-.042-.417-.06-.326-.048-.649-.108-.973-.161-.393-.065-.768-.032-1.123.161-.29.16-.527.404-.675.701-.154.316-.199.66-.267 1-.069.34-.176.707-.135 1.056.087.753.613 1.365 1.37 1.502a39.69 39.69 0 0011.343.376.483.483 0 01.535.53l-.071.697-1.018 9.907c-.041.41-.047.832-.125 1.237-.122.637-.553 1.028-1.182 1.171-.577.131-1.165.2-1.756.205-.656.004-1.31-.025-1.966-.022-.699.004-1.556-.06-2.095-.58-.475-.458-.54-1.174-.605-1.793l-.731-7.013-.322-3.094c-.037-.351-.286-.695-.678-.678-.336.015-.718.3-.678.679l.228 2.185.949 9.112c.147 1.344 1.174 2.068 2.446 2.272.742.12 1.503.144 2.257.156.966.016 1.942.053 2.892-.122 1.408-.258 2.465-1.198 2.616-2.657.34-3.332.683-6.663 1.024-9.995l.215-2.087a.484.484 0 01.39-.426c.402-.078.787-.212 1.074-.518.455-.488.546-1.124.385-1.766zm-1.478.772c-.145.137-.363.201-.578.233-2.416.359-4.866.54-7.308.46-1.748-.06-3.477-.254-5.207-.498-.17-.024-.353-.055-.47-.18-.22-.236-.111-.71-.054-.995.052-.26.152-.609.463-.646.484-.057 1.046.148 1.526.22.577.088 1.156.159 1.737.212 2.48.226 5.002.19 7.472-.14.45-.06.899-.13 1.345-.21.399-.072.84-.206 1.08.206.166.281.188.657.162.974a.544.544 0 01-.169.364zm-6.159 3.9c-.862.37-1.84.788-3.109.788a5.884 5.884 0 01-1.569-.217l.877 9.004c.065.78.717 1.38 1.5 1.38 0 0 1.243.065 1.658.065.447 0 1.786-.065 1.786-.065.783 0 1.434-.6 1.499-1.38l.94-9.95a3.996 3.996 0 00-1.322-.238c-.826 0-1.491.284-2.26.613z"/>
              </svg>
              Buy me a coffee
            </a>
            <p className="text-sm text-gray-600 mt-3">
              Your support helps keep this project running and enables me to use better AI tools for development. Thank you! 🙏
            </p>
          </section>

          {/* Contact/Feedback */}
          <section className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              Feedback
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Found a bug? Have a feature request? We'd love to hear from you!
            </p>
            <p className="text-gray-700">
              Report bugs or suggest features via{' '}
              <a
                href="https://github.com/ismailsunni/onepieceofdata-react/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
              >
                GitHub Issues
              </a>
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
        </div>

        {/* Footer note */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Made with ❤️ and passion for the One Piece community</p>
          <p className="mt-2">Set sail and explore the data! 🏴‍☠️</p>
        </div>
      </div>
    </main>
  )
}

export default AboutPage
