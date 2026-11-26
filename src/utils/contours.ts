/**
 * Deterministic topographic contour generator, modelled on Valley-and-Ridge quadrangles
 * (e.g. USGS Millheim, PA 1937): long parallel ridges built from nested, elongated
 * contours that pinch to noses at each end. Pure functions; no Math.random.
 */

export interface Ridge {
  /** Centre of the ridge in viewBox units. */
  cx: number
  cy: number
  /** Half-length of the outermost contour, along the ridge axis. */
  length: number
  /** Half-width of the outermost contour, across the ridge axis. */
  width: number
  /** Axis angle in degrees. Negative rises to the right (SVG y points down). */
  angle: number
  /** Number of nested contours, outermost first. */
  levels: number
  /** Gentle bow of the crest line, in viewBox units (+ bows down). */
  bend?: number
  /** Taper sharpness of the west / east noses: higher = blunter. Defaults to 2.4. */
  noseWest?: number
  noseEast?: number
}

export interface ContourLine {
  d: string
  /** Every fifth contour is an index contour, drawn heavier. */
  index: boolean
}

export interface ValleyLine {
  /** Start point; the line runs along `angle` for `length` units. */
  x: number
  y: number
  length: number
  angle: number
}

export const INDEX_EVERY = 5

/** Small seeded PRNG (mulberry32). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Point = [x: number, y: number]

interface Wave {
  amp: number
  freq: number
  phase: number
}

function makeWaves(rand: () => number, count: number, amp: number, minFreq: number): Wave[] {
  return Array.from({ length: count }, (_, i) => ({
    amp: amp / (i + 1),
    freq: minFreq * (i + 1) * (0.8 + rand() * 0.5),
    phase: rand() * Math.PI * 2
  }))
}

function waveAt(waves: Wave[], u: number): number {
  return waves.reduce((sum, w) => sum + w.amp * Math.sin(w.freq * u + w.phase), 0)
}

const round = (n: number) => Math.round(n * 10) / 10

function fmt([x, y]: Point): string {
  return `${round(x)} ${round(y)}`
}

const dist = (a: Point, b: Point) => Math.hypot(b[0] - a[0], b[1] - a[1])

/**
 * Smooth path through points: Catmull-Rom style cubic Béziers with chord-length
 * weighted tangents. Evenly spaced points give the classic (p2 − p0) / 6 handles;
 * unevenly spaced points (e.g. extra samples around a gully) get proportionally shorter
 * handles, so short segments never overshoot into jogs or loops.
 */
export function smoothPath(points: Point[], closed: boolean): string {
  const n = points.length
  if (n === 0) return ''
  const at = (i: number): Point => {
    const point = closed ? points[((i % n) + n) % n] : points[Math.max(0, Math.min(n - 1, i))]
    // Indices are wrapped or clamped into range above, so a point always exists.
    return point as Point
  }
  /** Tangent at point i, scaled to the length of the adjoining segment. */
  const handle = (i: number, segment: number): Point => {
    const prev = at(i - 1)
    const next = at(i + 1)
    const span = dist(prev, at(i)) + dist(at(i), next)
    if (span === 0) return [0, 0]
    const k = segment / (3 * span)
    return [(next[0] - prev[0]) * k, (next[1] - prev[1]) * k]
  }
  const segments = closed ? n : n - 1
  let d = `M${fmt(at(0))}`
  for (let i = 0; i < segments; i++) {
    const p1 = at(i)
    const p2 = at(i + 1)
    const segment = dist(p1, p2)
    const t1 = handle(i, segment)
    const t2 = handle(i + 1, segment)
    const c1: Point = [p1[0] + t1[0], p1[1] + t1[1]]
    const c2: Point = [p2[0] - t2[0], p2[1] - t2[1]]
    d += ` C${fmt(c1)}, ${fmt(c2)}, ${fmt(p2)}`
  }
  return closed ? `${d} Z` : d
}

const SAMPLES_PER_SIDE = 26
const MAX_GULLY_DEPTH = 0.28

interface Gully {
  /** Position along the ridge axis, in viewBox units from the centre. */
  at: number
  /** Half-width of the notch, in viewBox units. */
  spread: number
  /** Depth as a fraction of the ridge width. Kept ≤ MAX_GULLY_DEPTH so contours never cross. */
  depth: number
}

/**
 * Uneven contour spacing: cumulative random steps, so some slopes bunch up and others
 * open into benches. Returns t in [0, 1), increasing, one per level.
 */
function levelSpacing(rand: () => number, levels: number): number[] {
  const steps = Array.from({ length: levels }, () => 0.5 + rand())
  const total = steps.reduce((a, b) => a + b, 0)
  let sum = 0
  return steps.map((step) => {
    const t = sum / total
    sum += step
    return t
  })
}

function makeGullies(rand: () => number, length: number, width: number): Gully[] {
  const count = 1 + Math.floor(rand() * 3)
  return Array.from({ length: count }, () => ({
    at: (rand() * 1.3 - 0.65) * length,
    spread: width * (0.5 + rand() * 0.5),
    depth: 0.12 + rand() * (MAX_GULLY_DEPTH - 0.12)
  }))
}

/**
 * Nested closed contours for one ridge, outermost first. Width shrinks faster than
 * length, so the flanks read steep and the crest stays long and narrow. Spacing is
 * uneven, one flank is steeper than the other, and drainage gullies notch the lower
 * contours, as on the 1937 sheet.
 */
export function ridgeContours(ridge: Ridge, seed: number): ContourLine[] {
  const { cx, cy, length, width, angle, levels, bend = 0 } = ridge
  const noseWest = ridge.noseWest ?? 2.4
  const noseEast = ridge.noseEast ?? 2.4
  const rand = seededRandom(seed)
  const rad = (angle * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)

  // Shared waves keep neighbouring contours roughly parallel, so they never cross.
  const crestWaves = makeWaves(rand, 3, width * 0.14, 1.6)
  const flankNorth = makeWaves(rand, 4, width * 0.1, 4)
  const flankSouth = makeWaves(rand, 4, width * 0.1, 4)
  // A scarp on one side and a gentler dip slope on the other.
  const asymmetry = 0.8 + rand() * 0.4
  const gullies = { 1: makeGullies(rand, length, width), [-1]: makeGullies(rand, length, width) }
  const spacing = levelSpacing(rand, levels)

  const lines: ContourLine[] = []
  spacing.forEach((t, k) => {
    const halfLength = length * (1 - 0.62 * t)
    const halfWidth = width * (1 - 0.9 * Math.pow(t, 0.85))
    // Slide inner rings a little along the axis so the noses are not symmetric.
    const shift = length * 0.08 * t * (noseEast - noseWest)
    // Gullies cut deepest into the lowest contours and fade out toward the crest.
    const gullyFade = Math.pow(1 - t, 1.5)

    const outline = (u: number, side: 1 | -1): Point => {
      const p = u < 0 ? noseWest : noseEast
      const profile = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), p)), 0.6)
      const flank = side === 1 ? flankSouth : flankNorth
      const along = u * halfLength + shift
      // Overlapping gullies saturate smoothly (tanh) below the single-gully maximum, so
      // they deepen without a flat-bottomed kink and contours never cross.
      const rawNotch = gullies[side].reduce(
        (sum, g) => sum + g.depth * Math.exp(-(((along - g.at) / g.spread) ** 2)),
        0
      )
      const notch = MAX_GULLY_DEPTH * Math.tanh(rawNotch / MAX_GULLY_DEPTH)
      const flankWidth =
        halfWidth *
          profile *
          (side === 1 ? asymmetry : 2 - asymmetry) *
          (1 + waveAt(flank, u) / width) -
        width * notch * gullyFade * profile * profile
      const across = bend * (1 - u * u) + waveAt(crestWaves, u) + side * flankWidth
      return [cx + along * cos - across * sin, cy + along * sin + across * cos]
    }

    // Cosine spacing crowds samples near the noses, where curvature is highest. Extra
    // samples sit on each gully so the notch keeps its shape.
    const samples = (side: 1 | -1) => {
      // South flank runs west→east from the west nose; north flank east→west from the east nose.
      const us = Array.from(
        { length: SAMPLES_PER_SIDE },
        (_, i) => -side * Math.cos((Math.PI * i) / SAMPLES_PER_SIDE)
      )
      for (const g of gullies[side]) {
        for (const offset of [-1.2, -0.5, 0, 0.5, 1.2]) {
          const u = (g.at + offset * g.spread - shift) / halfLength
          if (Math.abs(u) < 0.9) us.push(u)
        }
      }
      return us.sort((a, b) => side * (a - b)).map((u) => outline(u, side))
    }

    const points: Point[] = [...samples(1), ...samples(-1)]
    lines.push({ d: smoothPath(points, true), index: (k + 1) % INDEX_EVERY === 0 })
  })
  return lines
}

/** A long open contour that follows the valley floor between ridges. */
export function valleyContour(line: ValleyLine, seed: number): string {
  const rand = seededRandom(seed)
  // Gentle enough (≤ ±7 units in total) that parallel valley lines 18+ units apart never cross.
  const waves = makeWaves(rand, 3, 3.8, 3)
  const rad = (line.angle * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const steps = 18
  const points: Point[] = []
  for (let i = 0; i <= steps; i++) {
    const along = (line.length * i) / steps
    const across = waveAt(waves, (i / steps) * 2 - 1)
    points.push([line.x + along * cos - across * sin, line.y + along * sin + across * cos])
  }
  return smoothPath(points, false)
}
