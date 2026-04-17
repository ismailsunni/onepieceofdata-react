interface QuizIntroProps {
  onStart: () => void
  isLoading: boolean
}

export default function QuizIntro({ onStart, isLoading }: QuizIntroProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
        Who's That Character?
      </h1>
      <p className="text-gray-600 text-lg mb-8 max-w-md">
        Guess the One Piece character from their image. 5 questions, each harder
        than the last!
      </p>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 max-w-sm w-full text-left space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-blue-600 font-bold text-sm mt-0.5">01</span>
          <p className="text-gray-700 text-sm">
            5 questions with 4 options each
          </p>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-blue-600 font-bold text-sm mt-0.5">02</span>
          <p className="text-gray-700 text-sm">
            10 seconds per question — faster answers earn more points
          </p>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-blue-600 font-bold text-sm mt-0.5">03</span>
          <p className="text-gray-700 text-sm">
            Difficulty increases with each question
          </p>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-blue-600 font-bold text-sm mt-0.5">04</span>
          <p className="text-gray-700 text-sm">
            Max score: 5000 points — can you reach Pirate King?
          </p>
        </div>
      </div>

      <button
        onClick={onStart}
        disabled={isLoading}
        className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            Loading...
          </span>
        ) : (
          'Start Quiz'
        )}
      </button>
    </div>
  )
}
