import { INDEX_EVERY, ridgeContours, seededRandom, smoothPath, valleyContour } from './contours'
import type { Ridge } from './contours'

const ridge: Ridge = { cx: 400, cy: 300, length: 300, width: 40, angle: -17, levels: 12 }

describe('seededRandom', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = seededRandom(7)
    const b = seededRandom(7)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('stays within [0, 1)', () => {
    const rand = seededRandom(3)
    for (let i = 0; i < 100; i++) {
      const n = rand()
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(1)
    }
  })
})

describe('ridgeContours', () => {
  it('is deterministic for a given seed', () => {
    expect(ridgeContours(ridge, 1)).toEqual(ridgeContours(ridge, 1))
    expect(ridgeContours(ridge, 1)).not.toEqual(ridgeContours(ridge, 2))
  })

  it('returns one closed path per level', () => {
    const lines = ridgeContours(ridge, 1)
    expect(lines).toHaveLength(ridge.levels)
    for (const line of lines) {
      expect(line.d).toMatch(/^M/)
      expect(line.d).toMatch(/Z$/)
    }
  })

  it(`marks every ${INDEX_EVERY}th contour as an index contour`, () => {
    const indexes = ridgeContours(ridge, 1)
      .map((line, i) => (line.index ? i + 1 : null))
      .filter((n) => n !== null)
    expect(indexes).toEqual([5, 10])
  })

  it('nests inner contours inside outer ones', () => {
    const span = (d: string) => {
      const xs = [...d.matchAll(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]))
      return Math.max(...xs) - Math.min(...xs)
    }
    const lines = ridgeContours(ridge, 1)
    const outer = lines.at(0)?.d ?? ''
    const inner = lines.at(-1)?.d ?? ''
    expect(span(inner)).toBeLessThan(span(outer))
  })
})

describe('valleyContour', () => {
  it('returns an open path', () => {
    const d = valleyContour({ x: 0, y: 300, length: 400, angle: -17 }, 1)
    expect(d).toMatch(/^M/)
    expect(d).not.toMatch(/Z$/)
  })
})

describe('smoothPath', () => {
  it('passes through every point', () => {
    const d = smoothPath(
      [
        [0, 0],
        [10, 5],
        [20, 0]
      ],
      false
    )
    expect(d).toBe('M0 0 C3.3 1.7, 6.7 5, 10 5 C13.3 5, 16.7 1.7, 20 0')
  })

  it('keeps handles shorter than a very short segment, so it never loops', () => {
    const d = smoothPath(
      [
        [0, 0],
        [50, 0],
        [50.5, 0],
        [100, 0]
      ],
      false
    )
    // The middle segment is 0.5 long; its control points must stay between its ends.
    const middle = d.split(' C')[2] ?? ''
    const xs = [...middle.matchAll(/(-?\d+(?:\.\d+)?) /g)].map((m) => Number(m[1]))
    for (const x of xs) {
      expect(x).toBeGreaterThanOrEqual(50)
      expect(x).toBeLessThanOrEqual(50.5)
    }
  })
})
