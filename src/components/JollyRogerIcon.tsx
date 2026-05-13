/**
 * Inline SVG of the site's Jolly Roger mark — the same skull-and-crossbones
 * used in the favicon. Used as the Straw Hat Pirates identifier wherever a
 * pure-text emoji would render inconsistently (Unicode has no straw-hat
 * emoji, and 👒 reads as feminine on most platforms).
 */

interface Props {
  size?: number
  className?: string
  title?: string
}

import { JOLLY_ROGER_PATH, JOLLY_ROGER_VIEWBOX } from '../constants/jollyRoger'

function JollyRogerIcon({
  size = 14,
  className = '',
  title = 'Straw Hat Pirate',
}: Props) {
  return (
    <svg
      viewBox={JOLLY_ROGER_VIEWBOX}
      width={size}
      height={size}
      role="img"
      aria-label={title}
      className={className}
      fill="currentColor"
    >
      <path d={JOLLY_ROGER_PATH} />
    </svg>
  )
}

export default JollyRogerIcon
