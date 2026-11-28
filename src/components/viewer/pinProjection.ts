import type { Camera } from 'three'
import { Vector3 } from 'three'

export interface PinPlacement {
  /** Pixels from the left and top of the viewer. */
  x: number
  y: number
  visible: boolean
}

const toPoint = new Vector3()
const forward = new Vector3()
const ndc = new Vector3()

/**
 * Where a point on the globe lands on screen, and whether it can be seen there. A point faces the
 * camera when the line of sight meets the surface from above: `(point − camera) · normal < 0`.
 * Anything past the horizon or behind the camera is hidden, as is anything off screen.
 */
export function placePin(
  point: Vector3,
  normal: Vector3,
  camera: Camera,
  width: number,
  height: number,
  target: PinPlacement
): PinPlacement {
  toPoint.subVectors(point, camera.position)
  camera.getWorldDirection(forward)
  const facing = toPoint.dot(normal) < 0
  const inFront = toPoint.dot(forward) > 0

  // x and y only: the depth range differs with a reversed depth buffer.
  ndc.copy(point).project(camera)
  target.x = ((ndc.x + 1) / 2) * width
  target.y = ((1 - ndc.y) / 2) * height
  target.visible =
    facing && inFront && target.x >= 0 && target.x <= width && target.y >= 0 && target.y <= height
  return target
}
