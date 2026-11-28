import { dayOfYearFromDate, sunPosition } from './solarPosition'

const toDeg = (radians: number) => (radians * 180) / Math.PI

describe('dayOfYearFromDate', () => {
  it('reads the month from a free-text date', () => {
    expect(dayOfYearFromDate('August, 2026')).toBe(227)
    expect(dayOfYearFromDate('May, 2024')).toBe(135)
    expect(dayOfYearFromDate('3 Jan 2025')).toBe(15)
  })

  it('falls back to the March equinox', () => {
    expect(dayOfYearFromDate('2026-01-01')).toBe(80)
  })
})

describe('sunPosition', () => {
  it('puts the noon sun due south at 90° − latitude on the equinox', () => {
    const { elevation, azimuth } = sunPosition(40, 80, 12)
    expect(toDeg(elevation)).toBeCloseTo(50, 0)
    expect(toDeg(azimuth)).toBeCloseTo(180, 0)
  })

  it('puts the noon sun at its summer height over Crete in mid-August', () => {
    // Declination about +14°, so 90 − 35.1 + 14 ≈ 69°.
    expect(toDeg(sunPosition(35.1, 227, 12).elevation)).toBeCloseTo(69, 0)
  })

  it('has the morning sun in the east and the afternoon sun in the west', () => {
    const morning = toDeg(sunPosition(38.7, 135, 9).azimuth)
    const afternoon = toDeg(sunPosition(38.7, 135, 15).azimuth)
    expect(morning).toBeGreaterThan(90)
    expect(morning).toBeLessThan(180)
    expect(afternoon).toBeGreaterThan(180)
    expect(afternoon).toBeLessThan(270)
  })

  it('has the noon sun due north in the southern hemisphere', () => {
    expect(toDeg(sunPosition(-35, 80, 12).azimuth)).toBeCloseTo(0, 0)
  })
})
