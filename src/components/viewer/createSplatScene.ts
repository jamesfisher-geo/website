import { GlobeControls, TilesRenderer } from '3d-tiles-renderer'
import {
  TerrariumMeshPlugin,
  TileCompressionPlugin,
  TilesFadePlugin,
  XYZTilesOverlay
} from '3d-tiles-renderer/plugins'
import { GaussianSplatPlugin } from '3d-tiles-rendererjs-3dgs-plugin'
import { GaussianSplatRenderer } from 'gaussian-splat-lite'
import {
  MathUtils,
  Matrix4,
  Object3D,
  PerspectiveCamera,
  Quaternion,
  Scene,
  Sphere,
  Vector2,
  Vector3,
  WebGLRenderer
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { WebGPURenderer } from 'three/webgpu'
import { fetchTerrainHeight } from './fetchTerrainHeight'
import { createKeyboardFlight } from './keyboardFlight'
import type { SplatTileset, Vec3 } from './SplatTileset'

const MAX_PIXEL_RATIO = 2
/** Longest frame step for keyboard movement, so a stalled tab doesn't jump the camera on return. */
const MAX_FRAME_SECONDS = 0.1
const KEYBOARD_HINT =
  'W A S D to move, E and Q for up and down, arrow keys to look, Shift for faster.'

const ESRI_WORLD_IMAGERY =
  'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const ESRI_WORLD_IMAGERY_LEVELS = 18
/** AWS Open Data terrain tiles: free, keyless, global. About 30 m resolution around Crete. */
const AWS_TERRARIUM = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
const AWS_TERRARIUM_MAX_ZOOM = 15
/** Far enough to see the whole globe before the tileset loads. GlobeControls adjusts it after. */
const GLOBE_FAR = 2e7
const GLOBE_START_DISTANCE = 1.75e7
/**
 * Closest the globe camera may get, in metres: to the point it zooms towards, and above the
 * terrain. GlobeControls keeps the near plane at least 1 m, so going closer would clip the splats.
 */
const GLOBE_MIN_DISTANCE = 1
/** Globe controls orbit the point under the cursor, so the debug look-at is a point ahead instead. */
const DEBUG_LOOK_DISTANCE = 10

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

interface GeoPosition {
  latDeg: number
  lonDeg: number
  /** Metres above the WGS84 ellipsoid. */
  heightM: number
}

/** Camera values in the coordinates `SplatTileset.camera` uses, so they can be pasted back in. */
interface CameraPoseInfo {
  position: Vec3
  lookAt: Vec3
  /** Degrees clockwise from forward (-Z, or north on a globe) when seen from above, 0 to 360. */
  headingDeg: number
  /** Degrees above the horizon, negative when looking down. */
  pitchDeg: number
  /** Only for globe tilesets. */
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

/** The parts of the scene that differ between a plain tileset and one on a globe. */
interface CameraRig {
  /** Other tile renderers to update, resize and dispose along with the splat tiles. */
  extraTiles: TilesRenderer[]
  ariaHint: string
  /** World up at the camera, for keyboard movement. */
  getUp: (target: Vector3) => Vector3
  /** Keyboard movement speed, in world units per second. */
  getMoveSpeed: () => number
  /** Keeps the controls in step after the keyboard moves the camera. */
  onKeyboardMove: (translation: Vector3, rotation: Quaternion) => void
  update: () => void
  resetView: () => void
  onRootTileset: (tiles: TilesRenderer) => void
  getPose: () => CameraPoseInfo
  dispose: () => void
}

interface CameraRigOptions {
  scene: Scene
  camera: PerspectiveCamera
  canvas: HTMLCanvasElement
  tileset: SplatTileset
  requestRender: () => void
}

function toVec3({ x, y, z }: Vector3): Vec3 {
  return [x, y, z]
}

/**
 * The middle of the bounding box's lowest face, in the tile's local frame (+Z up). This is the
 * point that is set on the terrain: the base of the scan, not its centre.
 */
function boxBottomCentre(box: readonly number[] | undefined): Vector3 | null {
  if (!box || box.length < 12) return null
  const [cx = 0, cy = 0, cz = 0] = box
  // Each half-axis can reach downwards, so the lowest point drops by all three z components.
  const depth = Math.abs(box[5] ?? 0) + Math.abs(box[8] ?? 0) + Math.abs(box[11] ?? 0)
  return new Vector3(cx, cy, cz - depth)
}

/** `_getPointBelowCamera` is internal to EnvironmentControls (3d-tiles-renderer 0.5.3). */
interface ControlsInternals {
  _getPointBelowCamera: (point?: Vector3, up?: Vector3) => unknown
}

/**
 * Every frame the controls cast a ray straight down and lift the camera to `cameraRadius` above
 * the first hit. Over a splat scan that hit is a splat, often a stray one, and it changes as the
 * camera pans, so the camera bobs. This makes the height check see the terrain only. Drag and zoom
 * still pivot on whatever is under the cursor, splats included.
 */
function collideWithTerrainOnly(controls: GlobeControls, terrain: Object3D) {
  const internals = controls as unknown as ControlsInternals
  const pointBelowCamera = internals._getPointBelowCamera.bind(controls)
  internals._getPointBelowCamera = (point, up) => {
    const { scene } = controls
    controls.setScene(terrain)
    try {
      return pointBelowCamera(point, up)
    } finally {
      controls.setScene(scene)
    }
  }
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Orbits a fixed target in the tileset's own coordinates (+Y up). */
function createOrbitRig({ camera, canvas, tileset, requestRender }: CameraRigOptions): CameraRig {
  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = !prefersReducedMotion()
  controls.addEventListener('change', requestRender)
  // Set from the bounding sphere once the tileset loads.
  let sceneRadius = 1
  const toTarget = new Vector3()

  const resetView = () => {
    camera.position.set(...tileset.camera.position)
    controls.target.set(...tileset.camera.lookAt)
    controls.update()
  }
  resetView()

  return {
    extraTiles: [],
    ariaHint: 'Drag to orbit.',
    getUp: (target) => target.copy(camera.up),
    getMoveSpeed: () =>
      Math.max(0.5 * camera.position.distanceTo(controls.target), 0.05 * sceneRadius),
    onKeyboardMove(translation, rotation) {
      // Carry the orbit target along, so OrbitControls keeps the new view instead of snapping back.
      toTarget.subVectors(controls.target, camera.position).add(translation)
      controls.target.copy(camera.position).add(toTarget.applyQuaternion(rotation))
    },
    update: () => controls.update(),
    resetView,
    onRootTileset(tiles) {
      const sphere = new Sphere()
      if (!tiles.getBoundingSphere(sphere)) return
      sceneRadius = sphere.radius
      camera.near = sphere.radius * 0.005
      camera.far = sphere.radius * 20
      camera.updateProjectionMatrix()
      controls.maxDistance = sphere.radius * 6
      requestRender()
    },
    getPose() {
      const { position } = camera
      const { target } = controls
      const [dx, dy, dz] = [target.x - position.x, target.y - position.y, target.z - position.z]
      return {
        position: toVec3(position),
        lookAt: toVec3(target),
        headingDeg: (MathUtils.radToDeg(Math.atan2(dx, -dz)) + 360) % 360,
        pitchDeg: MathUtils.radToDeg(Math.atan2(dy, Math.hypot(dx, dz)))
      }
    },
    dispose: () => controls.dispose()
  }
}

/**
 * Puts a georeferenced (ECEF) tileset on a globe with terrain and satellite imagery. The starting camera is given in
 * the tileset's local east-north-up frame and placed on the globe with the root tile's transform.
 *
 * The tileset is then pinned to the terrain: its heights rarely match the terrain's (GNSS heights
 * are above the ellipsoid, Terrarium heights above sea level), so the scan is moved along the local
 * vertical until the base of its bounding box sits on the ground, plus `tileset.verticalOffset`.
 */
function createGlobeRig({
  scene,
  camera,
  canvas,
  tileset,
  requestRender
}: CameraRigOptions): CameraRig {
  const surface = new TilesRenderer()
  surface.registerPlugin(
    new TerrariumMeshPlugin({
      url: AWS_TERRARIUM,
      maxZoom: AWS_TERRARIUM_MAX_ZOOM,
      overlay: new XYZTilesOverlay({
        url: ESRI_WORLD_IMAGERY,
        levels: ESRI_WORLD_IMAGERY_LEVELS
      }),
      applyOverlayTexture: true,
      // The scene has no lights, and the imagery already carries natural shading.
      unlit: true
    })
  )
  surface.registerPlugin(new TilesFadePlugin())
  surface.registerPlugin(new TileCompressionPlugin())
  scene.add(surface.group)

  const controls = new GlobeControls(scene, camera, canvas)
  controls.setEllipsoid(surface.ellipsoid, surface.group)
  collideWithTerrainOnly(controls, surface.group)
  controls.minDistance = GLOBE_MIN_DISTANCE
  controls.cameraRadius = GLOBE_MIN_DISTANCE
  controls.enableDamping = !prefersReducedMotion()
  controls.addEventListener('change', requestRender)

  camera.far = GLOBE_FAR
  camera.updateProjectionMatrix()

  // Unknown until the root tileset loads.
  let localToWorld: Matrix4 | null = null
  const worldToLocal = new Matrix4()
  const setLocalFrame = (matrix: Matrix4) => {
    localToWorld = matrix
    worldToLocal.copy(matrix).invert()
  }
  const pinning = new AbortController()

  const resetView = () => {
    if (!localToWorld) {
      camera.position.set(0, 0, GLOBE_START_DISTANCE)
      camera.up.set(0, 1, 0)
      camera.lookAt(0, 0, 0)
    } else {
      const lookAt = new Vector3(...tileset.camera.lookAt).applyMatrix4(localToWorld)
      camera.position.set(...tileset.camera.position).applyMatrix4(localToWorld)
      camera.up.set(0, 0, 1).transformDirection(localToWorld)
      camera.lookAt(lookAt)
    }
    camera.updateMatrixWorld()
    controls.resetState()
    requestRender()
  }
  resetView()

  const forward = new Vector3()
  const sceneOrigin = new Vector3()
  const cartographic = { lat: 0, lon: 0, height: 0 }

  return {
    extraTiles: [surface],
    ariaHint: 'Drag to rotate, scroll to zoom.',
    getUp: (target) => surface.ellipsoid.getPositionToNormal(camera.position, target),
    getMoveSpeed() {
      // About 5 m/s when 10 m from the scan, and fast enough to cross the globe from orbit.
      if (localToWorld) {
        sceneOrigin.setFromMatrixPosition(localToWorld)
        return Math.max(1, 0.5 * camera.position.distanceTo(sceneOrigin))
      }
      surface.ellipsoid.getPositionToCartographic(camera.position, cartographic)
      return Math.max(1, 0.5 * cartographic.height)
    },
    // GlobeControls reads the camera afresh every frame, and still keeps it above the terrain.
    onKeyboardMove: () => {},
    update: () => controls.update(),
    resetView,
    onRootTileset(tiles) {
      const root = tiles.root
      const rootTransform = root?.transform
        ? new Matrix4().fromArray(root.transform)
        : new Matrix4()
      setLocalFrame(rootTransform)
      resetView()

      const base = boxBottomCentre(root?.boundingVolume.box)?.applyMatrix4(rootTransform)
      if (!base) return
      const { ellipsoid } = surface
      const { lat, lon, height } = ellipsoid.getPositionToCartographic(base, {})

      // Hidden while pinning so the scan doesn't visibly drop into place.
      tiles.group.visible = false
      fetchTerrainHeight(
        AWS_TERRARIUM,
        MathUtils.radToDeg(lat),
        MathUtils.radToDeg(lon),
        AWS_TERRARIUM_MAX_ZOOM,
        pinning.signal
      )
        .then((groundM) => {
          const up = ellipsoid.getPositionToNormal(base, new Vector3())
          tiles.group.position.copy(up).multiplyScalar(groundM - height + tileset.verticalOffset)
          tiles.group.updateMatrixWorld(true)
          // The camera pose is relative to the scan, so it moves with it.
          setLocalFrame(new Matrix4().makeTranslation(tiles.group.position).multiply(rootTransform))
          resetView()
        })
        .catch((error: unknown) => {
          if (pinning.signal.aborted) return
          console.warn(
            'Could not pin the scene to the terrain; showing it at its own height.',
            error
          )
        })
        .finally(() => {
          tiles.group.visible = true
          requestRender()
        })
    },
    getPose() {
      const position = camera.position.clone().applyMatrix4(worldToLocal)
      camera.getWorldDirection(forward).transformDirection(worldToLocal)
      const lookAt = position.clone().addScaledVector(forward, DEBUG_LOOK_DISTANCE)
      surface.ellipsoid.getPositionToCartographic(camera.position, cartographic)
      return {
        position: toVec3(position),
        lookAt: toVec3(lookAt),
        // East-north-up: +X east, +Y north, +Z up.
        headingDeg: (MathUtils.radToDeg(Math.atan2(forward.x, forward.y)) + 360) % 360,
        pitchDeg: MathUtils.radToDeg(Math.atan2(forward.z, Math.hypot(forward.x, forward.y))),
        geo: {
          latDeg: MathUtils.radToDeg(cartographic.lat),
          lonDeg: MathUtils.radToDeg(cartographic.lon),
          heightM: cartographic.height
        }
      }
    },
    dispose() {
      pinning.abort()
      controls.dispose()
      scene.remove(surface.group)
      surface.dispose()
    }
  }
}

/**
 * Globe scenes use WebGLRenderer: the terrain plugin raises the ground by patching GLSL in
 * `onBeforeCompile`, which WebGPURenderer never calls, so the terrain would render flat.
 * Gaussian Splat Lite supports both renderers.
 */
async function createRenderer(globe: boolean): Promise<WebGLRenderer | WebGPURenderer> {
  if (globe) {
    // A reversed depth buffer keeps depth precise across planet-scale near/far ranges.
    return new WebGLRenderer({
      antialias: false,
      alpha: true,
      premultipliedAlpha: true,
      reversedDepthBuffer: true
    })
  }
  const renderer = new WebGPURenderer({ antialias: false })
  try {
    await renderer.init()
  } catch (error) {
    renderer.dispose()
    throw error
  }
  return renderer
}

export async function createSplatScene({
  container,
  tileset,
  onStatus
}: SplatSceneOptions): Promise<SplatSceneHandle> {
  const renderer = await createRenderer(tileset.globe)

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

  const rigOptions = { scene, camera, canvas, tileset, requestRender }
  const rig = tileset.globe ? createGlobeRig(rigOptions) : createOrbitRig(rigOptions)
  canvas.setAttribute('aria-label', `3-D scene: ${tileset.title}. ${rig.ariaHint} ${KEYBOARD_HINT}`)

  const flight = createKeyboardFlight({
    canvas,
    camera,
    getUp: rig.getUp,
    getSpeed: rig.getMoveSpeed,
    onMove: rig.onKeyboardMove
  })

  const splatRenderer = new GaussianSplatRenderer({ renderer, onDirty: requestRender })
  scene.add(splatRenderer)

  const tiles = new TilesRenderer(tileset.url)
  tiles.registerPlugin(new TilesFadePlugin())
  tiles.registerPlugin(new GaussianSplatPlugin())
  scene.add(tiles.group)

  const allTiles = [tiles, ...rig.extraTiles]
  for (const tileRenderer of allTiles) {
    tileRenderer.setCamera(camera)
    for (const event of TILE_RENDER_EVENTS) {
      tileRenderer.addEventListener(event, requestRender)
    }
  }

  const size = new Vector2()
  const resize = () => {
    const { clientWidth, clientHeight } = container
    if (clientWidth === 0 || clientHeight === 0) return
    camera.aspect = clientWidth / clientHeight
    camera.updateProjectionMatrix()
    // `false` leaves canvas sizing to CSS.
    renderer.setSize(clientWidth, clientHeight, false)
    renderer.getSize(size)
    for (const tileRenderer of allTiles) tileRenderer.setResolution(camera, size)
    requestRender()
  }
  resize()
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(container)

  tiles.addEventListener('load-root-tileset', () => rig.onRootTileset(tiles))

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

  let lastFrame = performance.now()
  void renderer.setAnimationLoop(() => {
    const now = performance.now()
    const deltaSeconds = Math.min((now - lastFrame) / 1000, MAX_FRAME_SECONDS)
    lastFrame = now
    if (flight.update(deltaSeconds)) requestRender()
    // These keep running on idle frames: damping, tile loading and fades all advance here.
    rig.update()
    camera.updateMatrixWorld()
    for (const tileRenderer of allTiles) tileRenderer.update()
    if (!needsRender) return
    // Clear the flag first so a request made during this render still gets a later frame.
    needsRender = false
    renderer.render(scene, camera)
  })

  const getDebugInfo = (): SplatSceneDebugInfo => {
    const { loaded, queued, downloading, parsing, failed } = (
      tiles as unknown as TilesRendererWithStats
    ).stats
    return {
      ...rig.getPose(),
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
    resetView: rig.resetView,
    getDebugInfo,
    dispose() {
      void renderer.setAnimationLoop(null)
      resizeObserver.disconnect()
      flight.dispose()
      rig.dispose()
      scene.remove(tiles.group)
      tiles.dispose()
      scene.remove(splatRenderer)
      splatRenderer.dispose()
      renderer.dispose()
      canvas.remove()
    }
  }
}
