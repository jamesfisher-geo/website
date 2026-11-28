import { MathUtils, Sphere, Vector3 } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { WebGPURenderer } from 'three/webgpu'
import { createKeyboardFlight } from './keyboardFlight'
import {
  createSceneCore,
  createSplatTiles,
  KEYBOARD_HINT,
  prefersReducedMotion,
  tilesDebugInfo,
  toVec3
} from './sceneShared'
import type { SplatSceneDebugInfo, SplatSceneStatus } from './sceneShared'
import type { SplatTileset } from './SplatTileset'

export type { SplatSceneDebugInfo, SplatSceneStatus } from './sceneShared'

export interface SplatSceneOptions {
  container: HTMLElement
  tileset: SplatTileset
  onStatus: (status: SplatSceneStatus) => void
}

export interface SplatSceneHandle {
  resetView: () => void
  getDebugInfo: () => SplatSceneDebugInfo
  dispose: () => void
}

async function createRenderer() {
  const renderer = new WebGPURenderer({ antialias: false })
  try {
    await renderer.init()
  } catch (error) {
    renderer.dispose()
    throw error
  }
  return renderer
}

/**
 * A scan that isn't georeferenced, such as an indoor one, shown on its own: the camera orbits a
 * fixed target in the tileset's own coordinates (+Y up).
 */
export async function createSplatScene({
  container,
  tileset,
  onStatus
}: SplatSceneOptions): Promise<SplatSceneHandle> {
  const renderer = await createRenderer()

  // Assigned straight after the core is made; the first frame runs later, in an animation frame.
  let flight: ReturnType<typeof createKeyboardFlight> | null = null
  let controls: OrbitControls | null = null
  const core = createSceneCore({
    container,
    renderer,
    onFrame(deltaSeconds) {
      const moved = flight?.update(deltaSeconds) ?? false
      controls?.update()
      return moved
    }
  })
  const { camera, canvas, requestRender } = core

  const orbit = new OrbitControls(camera, canvas)
  controls = orbit
  orbit.enableDamping = !prefersReducedMotion()
  orbit.addEventListener('change', requestRender)
  // Set from the bounding sphere once the tileset loads.
  let sceneRadius = 1
  const toTarget = new Vector3()

  const resetView = () => {
    camera.position.set(...tileset.camera.position)
    orbit.target.set(...tileset.camera.lookAt)
    orbit.update()
    requestRender()
  }
  resetView()

  canvas.setAttribute('aria-label', `3-D scene: ${tileset.title}. Drag to orbit. ${KEYBOARD_HINT}`)

  flight = createKeyboardFlight({
    canvas,
    camera,
    getUp: (target) => target.copy(camera.up),
    getSpeed: () => Math.max(0.5 * camera.position.distanceTo(orbit.target), 0.05 * sceneRadius),
    onMove(translation, rotation) {
      // Carry the orbit target along, so OrbitControls keeps the new view instead of snapping back.
      toTarget.subVectors(orbit.target, camera.position).add(translation)
      orbit.target.copy(camera.position).add(toTarget.applyQuaternion(rotation))
    }
  })

  const tiles = createSplatTiles(tileset.url, onStatus)
  tiles.addEventListener('load-root-tileset', () => {
    const sphere = new Sphere()
    if (!tiles.getBoundingSphere(sphere)) return
    sceneRadius = sphere.radius
    camera.near = sphere.radius * 0.005
    camera.far = sphere.radius * 20
    camera.updateProjectionMatrix()
    orbit.maxDistance = sphere.radius * 6
    requestRender()
  })
  core.addTiles(tiles)

  const getDebugInfo = (): SplatSceneDebugInfo => {
    const { position } = camera
    const { target } = orbit
    const [dx, dy, dz] = [target.x - position.x, target.y - position.y, target.z - position.z]
    return {
      position: toVec3(position),
      lookAt: toVec3(target),
      headingDeg: (MathUtils.radToDeg(Math.atan2(dx, -dz)) + 360) % 360,
      pitchDeg: MathUtils.radToDeg(Math.atan2(dy, Math.hypot(dx, dz))),
      ...tilesDebugInfo(tiles)
    }
  }

  return {
    resetView,
    getDebugInfo,
    dispose() {
      flight?.dispose()
      orbit.dispose()
      core.dispose()
    }
  }
}
