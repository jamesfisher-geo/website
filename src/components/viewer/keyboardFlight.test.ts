import { MathUtils, PerspectiveCamera, Vector3 } from 'three'
import { afterEach, vi } from 'vitest'
import { clampTilt, createKeyboardFlight, flightInput } from './keyboardFlight'
import type { KeyboardFlight } from './keyboardFlight'

describe('flightInput', () => {
  it('reads movement, look and speed keys', () => {
    expect(flightInput(new Set(['KeyW', 'KeyD', 'KeyQ', 'ArrowLeft', 'ShiftLeft']))).toEqual({
      right: 1,
      up: -1,
      forward: 1,
      turn: 1,
      tilt: 0,
      fast: true
    })
  })

  it('cancels opposite keys', () => {
    expect(flightInput(new Set(['KeyW', 'KeyS', 'ArrowUp', 'ArrowDown']))).toMatchObject({
      forward: 0,
      tilt: 0
    })
  })
})

describe('clampTilt', () => {
  it('passes small tilts and stops at the limit', () => {
    expect(clampTilt(0, 0.1, 1)).toBeCloseTo(0.1)
    expect(clampTilt(0.95, 0.1, 1)).toBeCloseTo(0.05)
    expect(clampTilt(-1, -0.1, 1)).toBeCloseTo(0)
  })
})

describe('createKeyboardFlight', () => {
  let flight: KeyboardFlight | null = null
  afterEach(() => flight?.dispose())

  function setUp() {
    const canvas = document.createElement('canvas')
    const camera = new PerspectiveCamera()
    // Looking along -Z, tilted 30° down, with +Y up.
    camera.rotation.set(MathUtils.degToRad(-30), 0, 0)
    camera.updateMatrixWorld()
    const onMove = vi.fn()
    flight = createKeyboardFlight({
      canvas,
      camera,
      getUp: (target) => target.set(0, 1, 0),
      getSpeed: () => 2,
      onMove
    })
    const press = (code: string, init: KeyboardEventInit = {}) => {
      const event = new KeyboardEvent('keydown', { code, cancelable: true, ...init })
      canvas.dispatchEvent(event)
      return event
    }
    return { canvas, camera, onMove, press, flight }
  }

  it('moves level along the ground, faster with Shift', () => {
    const { camera, onMove, press, flight } = setUp()
    press('KeyW')
    expect(flight.update(1)).toBe(true)
    expect(camera.position.x).toBeCloseTo(0)
    expect(camera.position.y).toBeCloseTo(0)
    expect(camera.position.z).toBeCloseTo(-2)
    expect(onMove).toHaveBeenCalledOnce()

    press('ShiftLeft')
    flight.update(1)
    expect(camera.position.z).toBeCloseTo(-10)
  })

  it('turns with the arrow keys and stops when the key is released', () => {
    const { camera, press, flight } = setUp()
    const event = press('ArrowLeft')
    expect(event.defaultPrevented).toBe(true)
    flight.update(1.5)
    const forward = camera.getWorldDirection(new Vector3())
    // 90° to the left of -Z is -X.
    expect(forward.x).toBeLessThan(-0.8)

    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowLeft' }))
    expect(flight.update(1)).toBe(false)
  })

  it('ignores browser shortcuts and drops held keys on blur', () => {
    const { canvas, press, flight } = setUp()
    expect(press('KeyW', { ctrlKey: true }).defaultPrevented).toBe(false)
    expect(flight.update(1)).toBe(false)

    press('KeyW')
    canvas.dispatchEvent(new FocusEvent('blur'))
    expect(flight.update(1)).toBe(false)
  })
})
