import { WGS84_ELLIPSOID } from '3d-tiles-renderer'
import { MathUtils, Matrix4, Quaternion, Vector3 } from 'three'
import { createGlobeFlight } from './globeFlight'
import type { GlobePose } from './globeFlight'

function pose(latDeg: number, lonDeg: number, heightM: number): GlobePose {
  const position = WGS84_ELLIPSOID.getCartographicToPosition(
    MathUtils.degToRad(latDeg),
    MathUtils.degToRad(lonDeg),
    heightM,
    new Vector3()
  )
  const rotation = new Matrix4().lookAt(position, new Vector3(), new Vector3(0, 0, 1))
  return { position, quaternion: new Quaternion().setFromRotationMatrix(rotation) }
}

function heightOf(position: Vector3) {
  return WGS84_ELLIPSOID.getPositionToCartographic(position, {}).height
}

function sample(from: GlobePose, to: GlobePose, steps = 40) {
  const poseAt = createGlobeFlight(WGS84_ELLIPSOID, from, to)
  return Array.from({ length: steps + 1 }, (_, i) =>
    poseAt(i / steps, { position: new Vector3(), quaternion: new Quaternion() })
  )
}

const home = pose(40, -35, 1.3e7)
const crete = pose(35.1, 24.56, 30)

describe('createGlobeFlight', () => {
  it('starts and ends on the given views', () => {
    const poses = sample(home, crete)
    const first = poses[0]
    const last = poses.at(-1)
    expect(first?.position.distanceTo(home.position)).toBeLessThan(1e-3)
    expect(first?.quaternion.angleTo(home.quaternion)).toBeLessThan(1e-6)
    expect(last?.position.distanceTo(crete.position)).toBe(0)
    expect(last?.quaternion.angleTo(crete.quaternion)).toBeLessThan(1e-6)
  })

  it('descends steadily from orbit to a site, never below it', () => {
    const heights = sample(home, crete).map(({ position }) => heightOf(position))
    for (let i = 1; i < heights.length; i++) {
      expect(heights[i]).toBeLessThanOrEqual((heights[i - 1] ?? Infinity) + 1e-3)
      expect(heights[i]).toBeGreaterThan(29)
    }
  })

  it('arcs up between two low views far apart, highest midway', () => {
    const lisbon = pose(38.71, -9.14, 30)
    const heights = sample(lisbon, crete).map(({ position }) => heightOf(position))
    const peak = Math.max(...heights)
    expect(peak).toBeGreaterThan(5e5)
    expect(heights.indexOf(peak)).toBe(20)
  })

  it('stays looking down while it travels', () => {
    const far = pose(40, 60, 1.3e7)
    for (const { position, quaternion } of sample(home, far)) {
      const forward = new Vector3(0, 0, -1).applyQuaternion(quaternion)
      const down = position.clone().normalize().negate()
      expect(forward.angleTo(down)).toBeLessThan(0.05)
    }
  })
})
