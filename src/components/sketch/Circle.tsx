import styles from './Circle.module.css'

/**
 * Loose, hand-drawn loops. Each one is unclosed: the stroke overshoots its start
 * the way a pen does when circling a word. Pick one deterministically so repeats differ.
 */
const PATHS = [
  'M18 9 C 45 2, 95 3, 112 16 C 122 25, 108 42, 70 45 C 35 48, 6 41, 5 27 C 4 15, 22 7, 48 5',
  'M104 8 C 75 1, 22 4, 9 17 C 0 28, 16 44, 58 46 C 95 48, 117 37, 115 24 C 113 11, 92 5, 66 4',
  'M30 6 C 62 1, 104 5, 113 20 C 121 33, 96 45, 60 44 C 26 43, 3 36, 6 22 C 8 12, 26 5, 56 7'
] as const

export interface CircleProps {
  /** Which loop variant to draw (wraps around). */
  variant?: number
  className?: string
}

export function Circle({ variant = 0, className }: CircleProps) {
  const d = PATHS[Math.abs(variant) % PATHS.length]
  return (
    <svg
      className={[styles.circle, className].filter(Boolean).join(' ')}
      viewBox="0 0 120 50"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      data-testid="sketch-circle"
    >
      <path className={styles.stroke} d={d} pathLength={1} />
    </svg>
  )
}
