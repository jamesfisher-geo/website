import { TilesRenderer } from '3d-tiles-renderer'
import { TilesFadePlugin } from '3d-tiles-renderer/plugins'
import { GaussianSplatPlugin } from '3d-tiles-rendererjs-3dgs-plugin'
import { GaussianSplatRenderer } from 'gaussian-splat-lite'
import { MathUtils, PerspectiveCamera, Scene, Sphere, Vector2 } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { WebGPURenderer } from 'three/webgpu'
import type { SplatTileset, Vec3 } from './SplatTileset'

const MAX_PIXEL_RATIO = 2

export type SplatSceneStatus =
  { kind: 'loading'; progress: number } | { kind: 'ready' } | { kind: 'error'; message: string }

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

interface SplatTileCounts {
  visible: number
  active: number
  loaded: number
  queued: number
  downloading: number
  parsing: number
  failed: number
}

export interface SplatSceneDebugInfo {
  position: Vec3
  lookAt: Vec3
  /** Degrees clockwise from -Z when seen from above, 0 to 360. */
  headingDeg: number
  /** Degrees above the horizon, negative when looking down. */
  pitchDeg: number
  /** Share of requested tiles that have loaded, 0 to 1. */
  loadProgress: number
  tiles: SplatTileCounts
}

/** `TilesRendererBase.stats` exists at runtime but is missing from the library's types. */
interface TilesRendererWithStats {
  stats: Omit<SplatTileCounts, 'visible' | 'active'>
}

export async function createSplatScene({
  container,
  tileset,
  onStatus
}: SplatSceneOptions): Promise<SplatSceneHandle> {
  const renderer = new WebGPURenderer({ antialias: false })
  try {
    await renderer.init()
  } catch (error) {
    renderer.dispose()
    throw error
  }

  // Transparent clear: the viewer's --paper background shows through and follows the theme.
  renderer.setClearAlpha(0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))

  const canvas = renderer.domElement
  canvas.tabIndex = 0
  canvas.setAttribute('role', 'application')
  canvas.setAttribute(
    'aria-label',
    `3-D scene: ${tileset.title}. Drag to orbit, arrow keys to pan.`
  )
  container.appendChild(canvas)

  const scene = new Scene()
  const camera = new PerspectiveCamera(50, 1, 0.05, 1000)

  // Redraw only when the image would change: drawing re-sorts every splat, which is costly on idle.
  let needsRender = true
  const requestRender = () => {
    needsRender = true
  }

  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  controls.listenToKeyEvents(canvas)
  controls.addEventListener('change', requestRender)

  const splatRenderer = new GaussianSplatRenderer({ renderer, onDirty: requestRender })
  scene.add(splatRenderer)

  const resetView = () => {
    camera.position.set(...tileset.camera.position)
    controls.target.set(...tileset.camera.lookAt)
    controls.update()
  }
  resetView()

  const tiles = new TilesRenderer(tileset.url)
  tiles.registerPlugin(new TilesFadePlugin())
  tiles.registerPlugin(new GaussianSplatPlugin())
  tiles.setCamera(camera)
  scene.add(tiles.group)
  // 'needs-render' is sent by TilesFadePlugin on every update while tiles are fading.
  for (const event of [
    'needs-render',
    'needs-update',
    'load-model',
    'dispose-model',
    'tile-visibility-change'
  ]) {
    tiles.addEventListener(event, requestRender)
  }

  const size = new Vector2()
  const resize = () => {
    const { clientWidth, clientHeight } = container
    if (clientWidth === 0 || clientHeight === 0) return
    camera.aspect = clientWidth / clientHeight
    camera.updateProjectionMatrix()
    // `false` leaves canvas sizing to CSS.
    renderer.setSize(clientWidth, clientHeight, false)
    tiles.setResolution(camera, renderer.getSize(size))
    requestRender()
  }
  resize()
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(container)

  tiles.addEventListener('load-root-tileset', () => {
    const sphere = new Sphere()
    if (!tiles.getBoundingSphere(sphere)) return
    camera.near = sphere.radius * 0.005
    camera.far = sphere.radius * 20
    camera.updateProjectionMatrix()
    controls.maxDistance = sphere.radius * 6
    requestRender()
  })

  let settled = false
  let lastProgress = 0

  tiles.addEventListener('load-error', ({ tile, error, url: failedUrl }) => {
    console.error(`Failed to load ${String(failedUrl)}`, error)
    // Without the tileset or root tile there's nothing to show. Any other tile only costs detail.
    if (tile !== null && tile !== tiles.root) return
    settled = true
    onStatus({ kind: 'error', message: 'This scene could not be loaded.' })
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

  void renderer.setAnimationLoop(() => {
    // These keep running on idle frames: damping, tile loading and fades all advance here.
    controls.update()
    camera.updateMatrixWorld()
    tiles.update()
    if (!needsRender) return
    // Clear the flag first so a request made during this render still gets a later frame.
    needsRender = false
    renderer.render(scene, camera)
  })

  const getDebugInfo = (): SplatSceneDebugInfo => {
    const { x, y, z } = camera.position
    const { x: targetX, y: targetY, z: targetZ } = controls.target
    const [dx, dy, dz] = [targetX - x, targetY - y, targetZ - z]
    const { loaded, queued, downloading, parsing, failed } = (
      tiles as unknown as TilesRendererWithStats
    ).stats
    return {
      position: [x, y, z],
      lookAt: [targetX, targetY, targetZ],
      headingDeg: (MathUtils.radToDeg(Math.atan2(dx, -dz)) + 360) % 360,
      pitchDeg: MathUtils.radToDeg(Math.atan2(dy, Math.hypot(dx, dz))),
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

  return {
    resetView,
    getDebugInfo,
    dispose() {
      void renderer.setAnimationLoop(null)
      resizeObserver.disconnect()
      controls.dispose()
      scene.remove(tiles.group)
      tiles.dispose()
      scene.remove(splatRenderer)
      splatRenderer.dispose()
      renderer.dispose()
      canvas.remove()
    }
  }
}
