import { ridgeContours, valleyContour } from '@/utils/contours'
import { RIDGES, VALLEYS } from './contourLayout'
import styles from './ContourTexture.module.css'

// The layout is fixed, so compute the paths once rather than on every render.
const RIDGE_LINES = RIDGES.flatMap((ridge, i) => ridgeContours(ridge, i + 1))
const INTERMEDIATE = [
  ...RIDGE_LINES.filter((line) => !line.index).map((line) => line.d),
  ...VALLEYS.map((valley, i) => valleyContour(valley, 100 + i))
]
const INDEX = RIDGE_LINES.filter((line) => line.index).map((line) => line.d)

/**
 * Faint Valley-and-Ridge topographic texture (DESIGN.md §8), modelled on the 1937 USGS
 * Millheim, PA quadrangle. Decorative only. It fills its nearest positioned ancestor,
 * and must never sit behind body text.
 */
export function ContourTexture() {
  return (
    <svg
      className={styles.contours}
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <g className={styles.intermediate}>
        {INTERMEDIATE.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g className={styles.index} data-testid="index-contours">
        {INDEX.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  )
}
