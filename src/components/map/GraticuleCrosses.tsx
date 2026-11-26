import styles from './GraticuleCrosses.module.css'

export interface GraticuleCrossesProps {
  /** Grid steps across each axis. 3 gives four crosses at the ⅓ / ⅔ intersections. */
  divisions?: number
}

const pct = (at: number) => `${(at * 100).toFixed(3)}%`

/**
 * Faint graticule crosses at the interior grid intersections, like the 5′ marks on a
 * 1930s USGS quadrangle (DESIGN.md §8). Decorative only. It fills its nearest positioned
 * ancestor.
 *
 * Positions use nested <svg> elements, because SVG accepts percentage x/y. That keeps
 * the crosses on the grid at any size without inline styles.
 */
export function GraticuleCrosses({ divisions = 3 }: GraticuleCrossesProps) {
  const steps = Array.from({ length: divisions - 1 }, (_, i) => (i + 1) / divisions)
  const points = steps.flatMap((x) => steps.map((y) => [x, y] as const))

  return (
    <svg
      className={styles.graticule}
      width="100%"
      height="100%"
      aria-hidden="true"
      focusable="false"
      data-testid="graticule-crosses"
    >
      {points.map(([x, y]) => (
        <svg key={`${x}-${y}`} x={pct(x)} y={pct(y)} className={styles.cross}>
          <path d="M-7 0H7M0 -7V7" />
        </svg>
      ))}
    </svg>
  )
}
