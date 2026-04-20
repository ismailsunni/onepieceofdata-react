import { forwardRef } from 'react'
import type { QuizAnswer } from '../../types/quiz'

export type ShareFormat = 'square' | 'story'

interface QuizShareCardProps {
  format: ShareFormat
  answers: QuizAnswer[]
  totalScore: number
  rating: string
  logoUrl: string
}

const QuizShareCard = forwardRef<HTMLDivElement, QuizShareCardProps>(
  ({ format, answers, totalScore, rating, logoUrl }, ref) => {
    const isStory = format === 'story'
    const width = 1080
    const height = isStory ? 1920 : 1080
    const correctCount = answers.filter((a) => a.isCorrect).length

    return (
      <div
        ref={ref}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          background:
            'linear-gradient(135deg, #0a0a0a 0%, #1e3a8a 50%, #0a0a0a 100%)',
          color: '#ffffff',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: isStory ? '120px 80px' : '80px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: isStory ? 'center' : 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            marginBottom: isStory ? '80px' : '40px',
          }}
        >
          <img
            src={logoUrl}
            alt=""
            crossOrigin="anonymous"
            style={{
              width: isStory ? '120px' : '96px',
              height: isStory ? '120px' : '96px',
              borderRadius: '20px',
            }}
          />
          <div>
            <p
              style={{
                fontSize: isStory ? '36px' : '28px',
                fontWeight: 600,
                margin: 0,
                opacity: 0.8,
              }}
            >
              One Piece of Data
            </p>
            <p
              style={{
                fontSize: isStory ? '48px' : '40px',
                fontWeight: 800,
                margin: 0,
              }}
            >
              Guess the Character
            </p>
          </div>
        </div>

        {/* Score block */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: isStory ? '80px' : '40px',
          }}
        >
          <p
            style={{
              fontSize: isStory ? '48px' : '36px',
              fontWeight: 500,
              margin: 0,
              opacity: 0.7,
            }}
          >
            I scored
          </p>
          <p
            style={{
              fontSize: isStory ? '280px' : '200px',
              fontWeight: 900,
              margin: '0',
              lineHeight: 1,
              background: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {totalScore}
          </p>
          <p
            style={{
              fontSize: isStory ? '48px' : '36px',
              fontWeight: 500,
              margin: 0,
              opacity: 0.7,
            }}
          >
            out of 5000
          </p>
          <p
            style={{
              fontSize: isStory ? '72px' : '56px',
              fontWeight: 800,
              margin: '32px 0 0 0',
              color: '#fbbf24',
            }}
          >
            {rating}
          </p>
          <p
            style={{
              fontSize: isStory ? '40px' : '32px',
              fontWeight: 500,
              margin: '16px 0 0 0',
              opacity: 0.8,
            }}
          >
            {correctCount} / {answers.length} correct
          </p>
        </div>

        {/* Answers recap */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isStory ? '18px' : '12px',
            marginBottom: isStory ? '80px' : '40px',
          }}
        >
          {answers.map((a, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '24px',
                padding: isStory ? '24px 36px' : '16px 28px',
                borderRadius: '16px',
                background: a.isCorrect
                  ? 'rgba(34, 197, 94, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
                border: `2px solid ${
                  a.isCorrect
                    ? 'rgba(34, 197, 94, 0.4)'
                    : 'rgba(239, 68, 68, 0.4)'
                }`,
              }}
            >
              <p
                style={{
                  fontSize: isStory ? '32px' : '24px',
                  fontWeight: 600,
                  margin: 0,
                  flex: 1,
                }}
              >
                {a.correctCharacter.name}
              </p>
              <p
                style={{
                  fontSize: isStory ? '28px' : '22px',
                  fontWeight: 500,
                  margin: 0,
                  opacity: 0.7,
                }}
              >
                {a.isCorrect ? `+${a.pointsEarned}` : '—'}
              </p>
              <span style={{ fontSize: isStory ? '44px' : '32px' }}>
                {a.isCorrect ? '✅' : '❌'}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              fontSize: isStory ? '32px' : '24px',
              fontWeight: 500,
              margin: 0,
              opacity: 0.6,
            }}
          >
            Play at
          </p>
          <p
            style={{
              fontSize: isStory ? '44px' : '32px',
              fontWeight: 700,
              margin: 0,
              color: '#fbbf24',
            }}
          >
            onepieceofdata.com
          </p>
        </div>
      </div>
    )
  }
)

QuizShareCard.displayName = 'QuizShareCard'

export default QuizShareCard
