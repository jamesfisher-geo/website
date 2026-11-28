import { WGS84_ELLIPSOID } from '3d-tiles-renderer'
import { MathUtils, PerspectiveCamera, Vector3 } from 'three'
import { placePin } from './pinProjection'

const WIDTH = 800
const HEIGHT = 600

function site(latDeg: number, lonDeg: number) {
  const lat = MathUtils.degToRad(latDeg)
  const lon = MathUtils.degToRad(lonDeg)
  return {
    point: WGS84_ELLIPSOID.getCartographicToPosition(lat, lon, 0, new Vector3()),
    normal: WGS84_ELLIPSOID.getCartographicToNormal(lat, lon, new Vector3())
  }
}

/** A camera high above a lat/lon, looking at the Earth's centre. */
function cameraAbove(latDeg: number, lonDeg: number, heightM: number) {
  const camera = new PerspectiveCamera(50, WIDTH / HEIGHT, 1000, 1e8)
  WGS84_ELLIPSOID.getCartographicToPosition(
    MathUtils.degToRad(latDeg),
    MathUtils.degToRad(lonDeg),
    heightM,
    camera.position
  )
  camera.up.set(0, 0, 1)
  camera.lookAt(0, 0, 0)
  camera.updateMatrixWorld()
  return camera
}

function place(latDeg: number, lonDeg: number, camera: PerspectiveCamera) {
  const { point, normal } = site(latDeg, lonDeg)
  return placePin(point, normal, camera, WIDTH, HEIGHT, { x: 0, y: 0, visible: false })
}

describe('placePin', () => {
  const camera = cameraAbove(40, -35, 1.3e7)

  it('puts the point under the camera in the middle of the screen', () => {
    const { x, y, visible } = place(40, -35, camera)
    expect(visible).toBe(true)
    // Within a pixel or two: the camera looks at the Earth's centre, not along the local normal.
    expect(Math.abs(x - WIDTH / 2)).toBeLessThan(2)
    expect(Math.abs(y - HEIGHT / 2)).toBeLessThan(2)
  })

  it('shows sites in North America and Europe from the opening view', () => {
    expect(place(38.712, -9.1405, camera).visible).toBe(true) // Lisbon
    expect(place(35.1018, 24.5625, camera).visible).toBe(true) // Crete
    expect(place(40.85, -77.5, camera).visible).toBe(true) // central Pennsylvania
  })

  it('places east to the right and north up', () => {
    const lisbon = place(38.712, -9.1405, camera)
    const pennsylvania = place(40.85, -77.5, camera)
    const iceland = place(64.1, -21.9, camera)
    expect(lisbon.x).toBeGreaterThan(pennsylvania.x)
    expect(iceland.y).toBeLessThan(lisbon.y)
  })

  it('hides sites past the horizon', () => {
    expect(place(-35, 145, camera).visible).toBe(false) // the far side, in Australia
  })

  it('hides sites behind the camera', () => {
    const looking = cameraAbove(40, -35, 1.3e7)
    looking.lookAt(looking.position.clone().multiplyScalar(2))
    looking.updateMatrixWorld()
    expect(place(40, -35, looking).visible).toBe(false)
  })
})
