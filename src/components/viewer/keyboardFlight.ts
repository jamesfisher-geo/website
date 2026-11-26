import { MathUtils, Quaternion, Vector3 } from 'three'
import type { Camera } from 'three'

const FAST_MOVE = 4
const FAST_TURN = 2
const TURN_RATE = MathUtils.degToRad(60)
/** Stops just short of straight up or down, where turning left and right stops making sense. */
const MAX_TILT = MathUtils.degToRad(85)

/** `event.code` values, so the layout stays in place on AZERTY and other keyboards. */
const FLIGHT_KEYS = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'KeyE',
  'KeyQ',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ShiftLeft',
  'ShiftRight'
])

export interface FlightInput {
  /** -1 to 1 each: strafe right, rise, move forward. */
  right: number
  up: number
  forward: number
  /** -1 to 1: turn left (positive) or right, tilt up (positive) or down. */
  turn: number
  tilt: number
  fast: boolean
}

function axis(held: ReadonlySet<string>, positive: string, negative: string) {
  return (held.has(positive) ? 1 : 0) - (held.has(negative) ? 1 : 0)
}

/** Reads the held keys as movement and look directions. */
export function flightInput(held: ReadonlySet<string>): FlightInput {
  return {
    right: axis(held, 'KeyD', 'KeyA'),
    up: axis(held, 'KeyE', 'KeyQ'),
    forward: axis(held, 'KeyW', 'KeyS'),
    turn: axis(held, 'ArrowLeft', 'ArrowRight'),
    tilt: axis(held, 'ArrowUp', 'ArrowDown'),
    fast: held.has('ShiftLeft') || held.has('ShiftRight')
  }
}

/** The share of a tilt `delta` (radians) that keeps the pitch within ±`limit`. */
export function clampTilt(pitch: number, delta: number, limit = MAX_TILT) {
  return MathUtils.clamp(pitch + delta, -limit, limit) - pitch
}

export interface KeyboardFlightOptions {
  /** Receives key presses while focused. */
  canvas: HTMLElement
  camera: Camera
  /** Writes the world up direction at the camera into `target`. */
  getUp: (target: Vector3) => Vector3
  /** Movement speed in world units per second. */
  getSpeed: () => number
  /** Called after each move so the controls can follow it. `rotation` is about the camera. */
  onMove: (translation: Vector3, rotation: Quaternion) => void
}

export interface KeyboardFlight {
  /** Moves the camera for the held keys. Returns true when it moved. */
  update: (deltaSeconds: number) => boolean
  dispose: () => void
}

/**
 * W/S forward and back, A/D strafe, E/Q up and down, arrow keys turn and tilt, Shift faster.
 * Moves stay level: W goes forward along the ground, however far the camera is tilted.
 */
export function createKeyboardFlight({
  canvas,
  camera,
  getUp,
  getSpeed,
  onMove
}: KeyboardFlightOptions): KeyboardFlight {
  const held = new Set<string>()

  const onKeyDown = (event: KeyboardEvent) => {
    // Modifiers leave browser shortcuts alone. Shift is one of the flight keys.
    if (event.ctrlKey || event.metaKey || event.altKey) return
    if (!FLIGHT_KEYS.has(event.code)) return
    // Arrow keys would otherwise scroll the page.
    event.preventDefault()
    held.add(event.code)
  }
  const onKeyUp = (event: KeyboardEvent) => held.delete(event.code)
  const onBlur = () => held.clear()

  canvas.addEventListener('keydown', onKeyDown)
  canvas.addEventListener('blur', onBlur)
  // On window, so a key released after focus moves away doesn't stay held.
  window.addEventListener('keyup', onKeyUp)

  const up = new Vector3()
  const forward = new Vector3()
  const level = new Vector3()
  const right = new Vector3()
  const translation = new Vector3()
  const rotation = new Quaternion()
  const tiltRotation = new Quaternion()

  return {
    update(deltaSeconds) {
      const input = flightInput(held)
      const moving = input.right !== 0 || input.up !== 0 || input.forward !== 0
      const looking = input.turn !== 0 || input.tilt !== 0
      if (!moving && !looking) return false

      getUp(up).normalize()
      camera.getWorldDirection(forward)
      right.crossVectors(forward, up).normalize()
      level.crossVectors(up, right).normalize()

      translation
        .set(0, 0, 0)
        .addScaledVector(right, input.right)
        .addScaledVector(up, input.up)
        .addScaledVector(level, input.forward)
      if (moving) {
        const distance = getSpeed() * (input.fast ? FAST_MOVE : 1) * deltaSeconds
        translation.normalize().multiplyScalar(distance)
      }
      camera.position.add(translation)

      const turn = TURN_RATE * (input.fast ? FAST_TURN : 1) * deltaSeconds
      const pitch = Math.asin(MathUtils.clamp(forward.dot(up), -1, 1))
      rotation.setFromAxisAngle(up, input.turn * turn)
      tiltRotation.setFromAxisAngle(right, clampTilt(pitch, input.tilt * turn))
      rotation.multiply(tiltRotation)
      camera.quaternion.premultiply(rotation)
      camera.updateMatrixWorld()

      onMove(translation, rotation)
      return true
    },
    dispose() {
      canvas.removeEventListener('keydown', onKeyDown)
      canvas.removeEventListener('blur', onBlur)
      window.removeEventListener('keyup', onKeyUp)
    }
  }
}
