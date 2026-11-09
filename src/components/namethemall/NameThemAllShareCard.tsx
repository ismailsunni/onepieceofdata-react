import { forwardRef } from 'react'
import { CHART_COLORS } from '../../constants/chartColors'

export type ShareFormat = 'square' | 'story'

interface NameThemAllShareCardProps {
  format: ShareFormat
  scopeTitle: string
  correct: number
  total: number
  wrong: number
  timeUsed: string
  logoUrl: string
}

const NameThemAllShareCard = forwardRef<
  HTMLDivElement,
  NameThemAllShareCardProps
>(({ format, scopeTitle, correct, total, wrong, timeUsed, logoUrl }, ref) => {
  const isStory = format === 'story'
  const s = (story: number, square: number) => `${isStory ? story : square}px`
  const pct = total ? Math.round((correct / total) * 100) : 0

  return (
    <div
      ref={ref}
      style={{
        width: '1080px',
        height: isStory ? '1920px' : '1080px',
        background:
          'linear-gradient(135deg, #0a0a0a 0%, #1e3a8a 50%, #0a0a0a 100%)',
        color: CHART_COLORS.white,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: isStory ? '120px 80px' : '80px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <img
          src={logoUrl}
          alt=""
          crossOrigin="anonymous"
          style={{
            width: s(120, 96),
            height: s(120, 96),
            borderRadius: '20px',
          }}
        />
        <div>
          <p
            style={{
              fontSize: s(36, 28),
              fontWeight: 600,
              margin: 0,
              opacity: 0.8,
            }}
          >
            One Piece of Data
          </p>
          <p style={{ fontSize: s(48, 40), fontWeight: 800, margin: 0 }}>
            Name Them All
          </p>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            fontSize: s(44, 34),
            fontWeight: 600,
            margin: 0,
            opacity: 0.8,
          }}
        >
          {scopeTitle}
        </p>
        <p
          style={{
            fontSize: s(240, 180),
            fontWeight: 900,
            margin: '16px 0 0 0',
            lineHeight: 1,
            color: CHART_COLORS.amber400,
          }}
        >
          {correct}
          <span style={{ fontSize: s(96, 72), opacity: 0.8 }}> / {total}</span>
        </p>
        <p
          style={{
            fontSize: s(48, 36),
            fontWeight: 600,
            margin: '24px 0 0 0',
          }}
        >
          characters named · {pct}%
        </p>
        <p
          style={{
            fontSize: s(40, 30),
            fontWeight: 500,
            margin: '24px 0 0 0',
            opacity: 0.75,
          }}
        >
          ❌ {wrong} wrong · ⏱ {timeUsed}
        </p>
      </div>

      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            fontSize: s(32, 24),
            fontWeight: 500,
            margin: 0,
            opacity: 0.6,
          }}
        >
          Play at
        </p>
        <p
          style={{
            fontSize: s(44, 32),
            fontWeight: 700,
            margin: 0,
            color: CHART_COLORS.amber400,
          }}
        >
          onepieceofdata.com
        </p>
      </div>
    </div>
  )
})

NameThemAllShareCard.displayName = 'NameThemAllShareCard'

export default NameThemAllShareCard
