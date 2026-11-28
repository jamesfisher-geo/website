import { TilesRenderer } from '3d-tiles-renderer'
import { TilesFadePlugin } from '3d-tiles-renderer/plugins'
import { GaussianSplatPlugin } from '3d-tiles-rendererjs-3dgs-plugin'
import { GaussianSplatRenderer } from 'gaussian-splat-lite'
import { PerspectiveCamera, Scene, Vector2, Vector3 } from 'three'
import type { WebGLRenderer } from 'three'
import type { WebGPURenderer } from 'three/webgpu'
import type { Vec3 } from './SplatTileset'

const MAX_PIXEL_RATIO = 2
/** Longest frame step for keyboard movement, so a stalled tab doesn't jump the camera on return. */
const MAX_FRAME_SECONDS = 0.1
export const KEYBOARD_HINT =
  'W A S D to move, E and Q for up and down, arrow keys to look, Shift for faster.'

/** Events after which the tiles may look different and the frame should be redrawn. */
const TILE_RENDER_EVENTS = [
  // Sent by TilesFadePlugin on every update while tiles are fading.
  'needs-render',
  'needs-update',
  'load-model',
  'dispose-model',
  'tile-visibility-change'
]

export type SplatSceneStatus =
  { kind: 'loading'; progress: number } | { kind: 'ready' } | { kind: 'error'; message: string }

interface SplatTileCounts {
  visible: number
  active: number
  loaded: number
  queued: number
  downloading: number
  parsing: number
  failed: number
}

interface GeoPosition {
  latDeg: number
  lonDeg: number
  /** Metres above the WGS84 ellipsoid. */
  heightM: number
}

/** Camera values in the coordinates `SplatTileset.camera` uses, so they can be pasted back in. */
export interface CameraPoseInfo {
  position: Vec3
  lookAt: Vec3
  /** Degrees clockwise from forward (-Z, or north on a globe) when seen from above, 0 to 360. */
  headingDeg: number
  /** Degrees above the horizon, negative when looking down. */
  pitchDeg: number
  /** Only for globe scenes. */
  geo?: GeoPosition
}

export interface SplatSceneDebugInfo extends CameraPoseInfo {
  /** Share of requested tiles that have loaded, 0 to 1. */
  loadProgress: number
  tiles: SplatTileCounts
}

/** `TilesRendererBase.stats` exists at runtime but is missing from the library's types. */
interface TilesRendererWithStats {
  stats: Omit<SplatTileCounts, 'visible' | 'active'>
}

export function toVec3({ x, y, z }: Vector3): Vec3 {
  return [x, y, z]
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Load progress and tile counts for the debug panel. */
export function tilesDebugInfo(
  tiles: TilesRenderer | null
): Omit<SplatSceneDebugInfo, keyof CameraPoseInfo> {
  if (!tiles) {
    return {
      loadProgress: 0,
      tiles: { visible: 0, active: 0, loaded: 0, queued: 0, downloading: 0, parsing: 0, failed: 0 }
    }
  }
  const { loaded, queued, downloading, parsing, failed } = (
    tiles as unknown as TilesRendererWithStats
  ).stats
  return {
    loadProgress: tiles.loadProgress,
    tiles: {
      visible: tiles.visibleTiles.size,
      active: tiles.activeTiles.size,
      loaded,
      queued,
      downloading,
      parsing,
      failed
    }
  }
}

/** A Gaussian-splat tileset, reporting its load progress through `onStatus`. */
export function createSplatTiles(url: string, onStatus: (status: SplatSceneStatus) => void) {
  const tiles = new TilesRenderer(url)
  tiles.registerPlugin(new TilesFadePlugin())
  tiles.registerPlugin(new GaussianSplatPlugin())
  trackLoadStatus(tiles, onStatus)
  return tiles
}

/**
 * Reports loading until the first view's tiles have arrived, then ready, or an error if the
 * tileset or its root tile fails.
 */
export function trackLoadStatus(
  tiles: TilesRenderer,
  onStatus: (status: SplatSceneStatus) => void,
  errorMessage = 'This scene could not be loaded.'
) {
  let settled = false
  let lastProgress = 0
  onStatus({ kind: 'loading', progress: 0 })

  tiles.addEventListener('load-error', ({ tile, error, url: failedUrl }) => {
    console.error(`Failed to load ${String(failedUrl)}`, error)
    // Without the tileset or root tile there's nothing to show. Any other tile only costs detail.
    if (tile !== null && tile !== tiles.root) return
    settled = true
    onStatus({ kind: 'error', message: errorMessage })
  })

  tiles.addEventListener('tiles-load-end', () => {
    if (settled) return
    settled = true
    onStatus({ kind: 'ready' })
  })

  tiles.addEventListener('update-after', () => {
    if (settled) return
    const progress = Math.round(tiles.loadProgress * 100) / 100
    if (progress !== lastProgress) {
      lastProgress = progress
      onStatus({ kind: 'loading', progress })
    }
  })
}

interface SceneCoreOptions {
  container: HTMLElement
  renderer: WebGLRenderer | WebGPURenderer
  /** Runs every frame before the tiles update. Returns true when the camera moved. */
  onFrame: (deltaSeconds: number) => boolean
  /** Runs just before each drawn frame, e.g. to fit markers and HTML overlays to the camera. */
  beforeRender?: () => void
}

/**
 * The parts every viewer scene shares: the canvas, camera, splat renderer, resizing, the set of
 * tile renderers to update, and an animation loop that only redraws when something changed.
 */
export function createSceneCore({ container, renderer, onFrame, beforeRender }: SceneCoreOptions) {
  // Transparent clear: the viewer's --paper background shows through and follows the theme.
  renderer.setClearAlpha(0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))

  const canvas = renderer.domElement
  canvas.tabIndex = 0
  canvas.setAttribute('role', 'application')
  container.appendChild(canvas)

  const scene = new Scene()
  const camera = new PerspectiveCamera(50, 1, 0.05, 1000)

  // Redraw only when the image would change: drawing re-sorts every splat, which is costly on idle.
  let needsRender = true
  const requestRender = () => {
    needsRender = true
  }

  const splatRenderer = new GaussianSplatRenderer({ renderer, onDirty: requestRender })
  scene.add(splatRenderer)

  const tileRenderers = new Set<TilesRenderer>()
  const size = new Vector2()

  const addTiles = (tiles: TilesRenderer) => {
    tileRenderers.add(tiles)
    tiles.setCamera(camera)
    tiles.setResolution(camera, renderer.getSize(size))
    for (const event of TILE_RENDER_EVENTS) tiles.addEventListener(event, requestRender)
    scene.add(tiles.group)
    requestRender()
  }

  const resize = () => {
    const { clientWidth, clientHeight } = container
    if (clientWidth === 0 || clientHeight === 0) return
    camera.aspect = clientWidth / clientHeight
    camera.updateProjectionMatrix()
    // `false` leaves canvas sizing to CSS.
    renderer.setSize(clientWidth, clientHeight, false)
    renderer.getSize(size)
    for (const tiles of tileRenderers) tiles.setResolution(camera, size)
    requestRender()
  }
  resize()
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(container)

  let lastFrame = performance.now()
  const frame = () => {
    const now = performance.now()
    const deltaSeconds = Math.min((now - lastFrame) / 1000, MAX_FRAME_SECONDS)
    lastFrame = now
    // These keep running on idle frames: damping, tile loading and fades all advance here.
    if (onFrame(deltaSeconds)) requestRender()
    camera.updateMatrixWorld()
    for (const tiles of tileRenderers) tiles.update()
    if (!needsRender) return
    // Clear the flag first so a request made during this render still gets a later frame.
    needsRender = false
    beforeRender?.()
    renderer.render(scene, camera)
  }

  const start = () => {
    lastFrame = performance.now()
    requestRender()
    void renderer.setAnimationLoop(frame)
  }
  const stop = () => void renderer.setAnimationLoop(null)
  start()

  return {
    scene,
    camera,
    canvas,
    requestRender,
    addTiles,
    start,
    stop,
    dispose() {
      stop()
      resizeObserver.disconnect()
      for (const tiles of tileRenderers) {
        scene.remove(tiles.group)
        tiles.dispose()
      }
      tileRenderers.clear()
      scene.remove(splatRenderer)
      splatRenderer.dispose()
      renderer.dispose()
      canvas.remove()
    }
  }
}

export type SceneCore = ReturnType<typeof createSceneCore>
