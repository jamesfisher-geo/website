const DEG = Math.PI / 180
/** Earth's axial tilt, in degrees. */
const OBLIQUITY = 23.44

const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december'
]
/** Day of the year in the middle of each month (non-leap year). */
const MID_MONTH_DAY = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349]
/** The March equinox: the sun over the equator. */
const EQUINOX_DAY = 80

/**
 * Day of the year for a free-text date such as "August, 2026": the middle of the month it names,
 * or the March equinox when it names none.
 */
export function dayOfYearFromDate(text: string): number {
  const lower = text.toLowerCase()
  const month = MONTHS.findIndex((name) => lower.includes(name) || lower.includes(name.slice(0, 3)))
  return MID_MONTH_DAY[month] ?? EQUINOX_DAY
}

export interface SunPosition {
  /** Radians above the horizon. */
  elevation: number
  /** Radians clockwise from north. */
  azimuth: number
}

/**
 * Where the sun stands in the sky, from the standard declination and hour-angle formulas. Good to
 * about a degree, which is plenty for lighting a sky: it ignores the equation of time and
 * refraction.
 *
 * @param latDeg the observer's latitude, in degrees
 * @param dayOfYear 1 to 365
 * @param solarHour local solar time, in hours: 12 is solar noon
 */
export function sunPosition(latDeg: number, dayOfYear: number, solarHour: number): SunPosition {
  const declination = OBLIQUITY * DEG * Math.sin((2 * Math.PI * (284 + dayOfYear)) / 365)
  const hourAngle = (solarHour - 12) * 15 * DEG
  const lat = latDeg * DEG

  const elevation = Math.asin(
    Math.sin(lat) * Math.sin(declination) +
      Math.cos(lat) * Math.cos(declination) * Math.cos(hourAngle)
  )
  const azimuth = Math.atan2(
    -Math.cos(declination) * Math.sin(hourAngle),
    Math.sin(declination) * Math.cos(lat) -
      Math.cos(declination) * Math.sin(lat) * Math.cos(hourAngle)
  )
  return { elevation, azimuth: (azimuth + 2 * Math.PI) % (2 * Math.PI) }
}
