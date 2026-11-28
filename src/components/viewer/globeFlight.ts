import type { Ellipsoid } from '3d-tiles-renderer'
import { MathUtils, Matrix4, Quaternion, Vector3 } from 'three'

/** A camera placement in globe (ECEF) coordinates. */
export interface GlobePose {
  position: Vector3
  quaternion: Quaternion
}

/** How long a flight between two views takes, in seconds. */
export const FLIGHT_SECONDS = 2.5

/**
 * Smooth start and stop. A flight crosses thousands of kilometres, so it can't use the site's
 * ease-out curve: that would set off at full speed.
 */
function smootherstep(t: number) {
  const x = MathUtils.clamp(t, 0, 1)
  return x * x * x * (x * (x * 6 - 15) + 10)
}

/** Progress of `t` within the window [from, to], eased. */
function windowed(t: number, from: number, to: number) {
  return smootherstep((t - from) / (to - from))
}

interface Endpoint {
  normal: Vector3
  height: number
  /** Camera orientation relative to the east-north-up frame below it. */
  localQuaternion: Quaternion
}

const frame = new Matrix4()

function enuQuaternion(ellipsoid: Ellipsoid, lat: number, lon: number, target: Quaternion) {
  ellipsoid.getEastNorthUpFrame(lat, lon, 0, frame)
  return target.setFromRotationMatrix(frame)
}

function toEndpoint(ellipsoid: Ellipsoid, { position, quaternion }: GlobePose): Endpoint {
  const { lat, lon, height } = ellipsoid.getPositionToCartographic(position, {})
  const enu = enuQuaternion(ellipsoid, lat, lon, new Quaternion())
  return {
    normal: ellipsoid.getCartographicToNormal(lat, lon, new Vector3()),
    // Heights are interpolated in log space, which needs them positive.
    height: Math.max(height, 1),
    localQuaternion: enu.invert().multiply(quaternion)
  }
}

/** Spherical interpolation between two unit vectors. */
function slerpUnit(a: Vector3, b: Vector3, t: number, target: Vector3) {
  const angle = a.angleTo(b)
  if (angle < 1e-9) return target.copy(a)
  const sin = Math.sin(angle)
  return target
    .copy(a)
    .multiplyScalar(Math.sin((1 - t) * angle) / sin)
    .addScaledVector(b, Math.sin(t * angle) / sin)
    .normalize()
}

/**
 * A camera flight between two globe views, as a function of time from 0 to 1.
 *
 * The camera travels over the ground along a great circle and changes height in log space, so a
 * descent from orbit slows as it nears the ground. Two low views far apart arc up in between,
 * high enough to see both. Sideways travel is finished while the camera is high (descending) or
 * starts once it is high (climbing), so it never skims the ground. The orientation is blended
 * relative to the ground below, so looking straight down stays looking down along the way.
 */
export function createGlobeFlight(ellipsoid: Ellipsoid, from: GlobePose, to: GlobePose) {
  const start = toEndpoint(ellipsoid, from)
  const end = toEndpoint(ellipsoid, to)

  const distance = start.normal.angleTo(end.normal) * ellipsoid.radius.x
  const logStart = Math.log(start.height)
  const logEnd = Math.log(end.height)
  // Quadratic Bézier control point in log height: lifted so the midpoint reaches the peak.
  const peak = 0.5 * distance
  const logControl =
    peak > Math.max(start.height, end.height)
      ? 2 * Math.log(peak) - (logStart + logEnd) / 2
      : (logStart + logEnd) / 2

  const descending = start.height > 10 * end.height
  const climbing = end.height > 10 * start.height

  const normal = new Vector3()
  const local = new Quaternion()
  const enu = new Quaternion()

  return function poseAt(t: number, target: GlobePose): GlobePose {
    const s = smootherstep(t)
    const travel = descending ? windowed(t, 0, 0.75) : climbing ? windowed(t, 0.25, 1) : s
    // Turn to the final view late in a descent and early in a climb, near the ground either way.
    const turn = descending ? windowed(t, 0.4, 1) : climbing ? windowed(t, 0, 0.6) : s

    const logHeight = (1 - s) ** 2 * logStart + 2 * s * (1 - s) * logControl + s ** 2 * logEnd
    slerpUnit(start.normal, end.normal, travel, normal)
    const lat = Math.asin(MathUtils.clamp(normal.z, -1, 1))
    const lon = Math.atan2(normal.y, normal.x)

    if (t >= 1) {
      target.position.copy(to.position)
      target.quaternion.copy(to.quaternion)
      return target
    }
    ellipsoid.getCartographicToPosition(lat, lon, Math.exp(logHeight), target.position)
    local.slerpQuaternions(start.localQuaternion, end.localQuaternion, turn)
    target.quaternion.copy(enuQuaternion(ellipsoid, lat, lon, enu).multiply(local))
    return target
  }
}
