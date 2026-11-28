import { GlobeControls, TilesRenderer } from '3d-tiles-renderer'
import {
  TerrariumMeshPlugin,
  TileCompressionPlugin,
  TilesFadePlugin,
  XYZTilesOverlay
} from '3d-tiles-renderer/plugins'
import { MathUtils, Matrix4, Object3D, Quaternion, Vector3, WebGLRenderer } from 'three'
import { fetchTerrainHeight } from './fetchTerrainHeight'
import { createGlobeFlight, FLIGHT_SECONDS } from './globeFlight'
import type { GlobePose } from './globeFlight'
import { createGlobePins } from './globePins'
import { createGlobeSky } from './globeSky'
import type { PinSite } from './globePins'
import { createKeyboardFlight } from './keyboardFlight'
import { placePin } from './pinProjection'
import { dayOfYearFromDate } from './solarPosition'
import type { PinPlacement } from './pinProjection'
import {
  createSceneCore,
  createSplatTiles,
  KEYBOARD_HINT,
  prefersReducedMotion,
  tilesDebugInfo,
  toVec3,
  trackLoadStatus
} from './sceneShared'
import type { SplatSceneDebugInfo, SplatSceneStatus } from './sceneShared'
import type { SplatTileset } from './SplatTileset'

const ESRI_WORLD_IMAGERY =
  'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const ESRI_WORLD_IMAGERY_LEVELS = 18
/** AWS Open Data terrain tiles: free, keyless, global. About 30 m resolution around Crete. */
const AWS_TERRARIUM = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
const AWS_TERRARIUM_MAX_ZOOM = 15
/** Far enough to see the whole globe before the controls first adjust it. */
const GLOBE_FAR = 2e7
/**
 * The opening view: above the mid-Atlantic, high enough that North America and Europe are both
 * on the disc, with Crete and the Rockies just inside the horizon.
 */
const HOME = { latDeg: 40, lonDeg: -35, heightM: 1.3e7 }
/**
 * Closest the globe camera may get, in metres: to the point it zooms towards, and above the
 * terrain. GlobeControls keeps the near plane at least 1 m, so going closer would clip the splats.
 */
const GLOBE_MIN_DISTANCE = 1
/** Globe controls orbit the point under the cursor, so the debug look-at is a point ahead instead. */
const DEBUG_LOOK_DISTANCE = 10
const GLOBE_LABEL = `3-D globe of the journal's scans. Drag to rotate, scroll to zoom. ${KEYBOARD_HINT}`

export interface GlobePin {
  latitude: number
  longitude: number
  /** Moved to the pin's place on screen every frame, and hidden while it can't be seen. */
  element: HTMLElement
}

export interface GlobeSceneOptions {
  container: HTMLElement
  /** Loading state of whatever is being shown: the globe at home, or the scan flown to. */
  onStatus: (status: SplatSceneStatus) => void
}

export interface GlobeSceneHandle {
  setPins: (pins: readonly GlobePin[]) => void
  /** Loads a georeferenced scan, if it isn't already, and flies to its starting camera. */
  flyTo: (tileset: SplatTileset) => void
  /** Flies back to the opening view. */
  flyHome: () => void
  /** Jumps to the current view's starting camera: home, or the scan flown to. */
  resetView: () => void
  /** Stops drawing while another scene is shown in place of the globe. */
  pause: () => void
  resume: () => void
  getDebugInfo: () => SplatSceneDebugInfo
  dispose: () => void
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

/** A camera pose in a scan's local east-north-up frame (+Z up), placed on the globe. */
function scanPose({ camera }: SplatTileset, localToWorld: Matrix4): GlobePose {
  const position = new Vector3(...camera.position).applyMatrix4(localToWorld)
  const lookAt = new Vector3(...camera.lookAt).applyMatrix4(localToWorld)
  const up = new Vector3(0, 0, 1).transformDirection(localToWorld)
  const rotation = new Matrix4().lookAt(position, lookAt, up)
  return { position, quaternion: new Quaternion().setFromRotationMatrix(rotation) }
}

interface Scan {
  tiles: TilesRenderer
  getStatus: () => SplatSceneStatus
  /** The scan's local frame on the globe, once its root tileset has loaded and been pinned. */
  frame: Promise<Matrix4>
}

type View = { kind: 'home' } | { kind: 'scan'; tileset: SplatTileset; scan: Scan; frame: Matrix4 }

/**
 * A satellite-imagery globe with terrain, the journal's georeferenced scans placed on it, and HTML
 * pins that follow their sites.
 *
 * Each scan is pinned to the terrain when it loads: its heights rarely match the terrain's (GNSS
 * heights are above the ellipsoid, Terrarium heights above sea level), so it is moved along the
 * local vertical until the base of its bounding box sits on the ground, plus `verticalOffset`.
 *
 * WebGLRenderer, not WebGPU: the terrain plugin raises the ground by patching GLSL in
 * `onBeforeCompile`, which WebGPURenderer never calls, so the terrain would render flat.
 */
export function createGlobeScene({ container, onStatus }: GlobeSceneOptions): GlobeSceneHandle {
  // A reversed depth buffer keeps depth precise across planet-scale near/far ranges.
  const renderer = new WebGLRenderer({
    antialias: false,
    alpha: true,
    premultipliedAlpha: true,
    reversedDepthBuffer: true
  })

  // Assigned straight after the core is made; the first frame runs later, in an animation frame.
  let onFrame: (deltaSeconds: number) => boolean = () => false
  let beforeRender: () => void = () => {}
  const core = createSceneCore({
    container,
    renderer,
    onFrame: (deltaSeconds) => onFrame(deltaSeconds),
    beforeRender: () => beforeRender()
  })
  const { scene, camera, canvas, requestRender } = core
  canvas.setAttribute('aria-label', GLOBE_LABEL)

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
  const { ellipsoid } = surface

  // Each status goes to the page only while its view is the one shown.
  let homeStatus: SplatSceneStatus = { kind: 'loading', progress: 0 }
  let shownScan: Scan | null = null
  trackLoadStatus(
    surface,
    (status) => {
      homeStatus = status
      if (!shownScan) onStatus(status)
    },
    'The globe could not be loaded.'
  )
  core.addTiles(surface)

  const controls = new GlobeControls(scene, camera, canvas)
  controls.setEllipsoid(ellipsoid, surface.group)
  collideWithTerrainOnly(controls, surface.group)
  controls.minDistance = GLOBE_MIN_DISTANCE
  controls.cameraRadius = GLOBE_MIN_DISTANCE
  controls.enableDamping = !prefersReducedMotion()
  controls.addEventListener('change', requestRender)

  camera.far = GLOBE_FAR
  camera.updateProjectionMatrix()

  const homePose = (): GlobePose => {
    const position = ellipsoid.getCartographicToPosition(
      MathUtils.degToRad(HOME.latDeg),
      MathUtils.degToRad(HOME.lonDeg),
      HOME.heightM,
      new Vector3()
    )
    // North up: the Earth's axis, seen from above the mid-latitudes.
    const rotation = new Matrix4().lookAt(position, new Vector3(), new Vector3(0, 0, 1))
    return { position, quaternion: new Quaternion().setFromRotationMatrix(rotation) }
  }

  let view: View = { kind: 'home' }
  const viewPose = () => (view.kind === 'home' ? homePose() : scanPose(view.tileset, view.frame))

  // ── Camera flights ─────────────────────────────────────────────
  let flight: { poseAt: ReturnType<typeof createGlobeFlight>; elapsed: number } | null = null
  const flightPose: GlobePose = { position: new Vector3(), quaternion: new Quaternion() }

  const placeCamera = ({ position, quaternion }: GlobePose) => {
    camera.position.copy(position)
    camera.quaternion.copy(quaternion)
    camera.updateMatrixWorld()
  }

  const endFlight = () => {
    flight = null
    controls.enabled = true
    controls.resetState()
  }

  const jumpTo = (pose: GlobePose) => {
    if (flight) endFlight()
    placeCamera(pose)
    controls.adjustCamera(camera)
    controls.resetState()
    requestRender()
  }

  const flyToPose = (pose: GlobePose) => {
    if (prefersReducedMotion()) {
      jumpTo(pose)
      return
    }
    const from = { position: camera.position.clone(), quaternion: camera.quaternion.clone() }
    flight = { poseAt: createGlobeFlight(ellipsoid, from, pose), elapsed: 0 }
    // The flight drives the camera; the controls would fight it.
    controls.enabled = false
    requestRender()
  }

  jumpTo(homePose())

  // ── Scans ──────────────────────────────────────────────────────
  const scans = new Map<SplatTileset, Scan>()
  const pinning = new AbortController()

  /** Moves the scan onto the terrain and resolves with its local frame on the globe. */
  async function pinToTerrain(tiles: TilesRenderer, tileset: SplatTileset): Promise<Matrix4> {
    const root = tiles.root
    const rootTransform = root?.transform ? new Matrix4().fromArray(root.transform) : new Matrix4()
    const base = boxBottomCentre(root?.boundingVolume.box)?.applyMatrix4(rootTransform)
    if (!base) return rootTransform
    const { lat, lon, height } = ellipsoid.getPositionToCartographic(base, {})

    // Hidden while pinning so the scan doesn't visibly drop into place.
    tiles.group.visible = false
    try {
      const groundM = await fetchTerrainHeight(
        AWS_TERRARIUM,
        MathUtils.radToDeg(lat),
        MathUtils.radToDeg(lon),
        AWS_TERRARIUM_MAX_ZOOM,
        pinning.signal
      )
      const up = ellipsoid.getPositionToNormal(base, new Vector3())
      tiles.group.position.copy(up).multiplyScalar(groundM - height + tileset.verticalOffset)
      tiles.group.updateMatrixWorld(true)
      // The camera pose is relative to the scan, so it moves with it.
      return new Matrix4().makeTranslation(tiles.group.position).multiply(rootTransform)
    } catch (error) {
      if (!pinning.signal.aborted) {
        console.warn('Could not pin the scene to the terrain; showing it at its own height.', error)
      }
      return rootTransform
    } finally {
      tiles.group.visible = true
      requestRender()
    }
  }

  function loadScan(tileset: SplatTileset): Scan {
    let resolveFrame: (frame: Matrix4) => void = () => {}
    let rejectFrame: (error: Error) => void = () => {}
    const frame = new Promise<Matrix4>((resolve, reject) => {
      resolveFrame = resolve
      rejectFrame = reject
    })
    // Failures are reported through the status; this only stops the rejection going unhandled.
    frame.catch(() => {})

    let status: SplatSceneStatus = { kind: 'loading', progress: 0 }
    // Null while createSplatTiles reports its first status, which it does synchronously.
    let scan: Scan | null = null
    const tiles = createSplatTiles(tileset.url, (next) => {
      status = next
      if (scan && shownScan === scan) onStatus(next)
    })
    scan = { tiles, frame, getStatus: () => status }
    tiles.addEventListener('load-root-tileset', () => {
      void pinToTerrain(tiles, tileset).then(resolveFrame)
    })
    tiles.addEventListener('load-error', ({ tile }) => {
      if (tile === null || tile === tiles.root) rejectFrame(new Error('The scan did not load.'))
    })
    core.addTiles(tiles)
    scans.set(tileset, scan)
    return scan
  }

  // Bumped by every navigation, so a scan that finishes loading after the user has moved on
  // doesn't pull the camera back to it.
  let navigation = 0

  const flyTo = (tileset: SplatTileset) => {
    const token = ++navigation
    const scan = scans.get(tileset) ?? loadScan(tileset)
    shownScan = scan
    onStatus(scan.getStatus())
    canvas.setAttribute(
      'aria-label',
      `3-D scene: ${tileset.title}. Drag to rotate, scroll to zoom. ${KEYBOARD_HINT}`
    )
    scan.frame
      .then((frame) => {
        if (token !== navigation) return
        view = { kind: 'scan', tileset, scan, frame }
        flyToPose(scanPose(tileset, frame))
      })
      .catch(() => {})
  }

  const flyHome = () => {
    navigation++
    shownScan = null
    view = { kind: 'home' }
    onStatus(homeStatus)
    canvas.setAttribute('aria-label', GLOBE_LABEL)
    flyToPose(homePose())
  }

  // ── Pins ───────────────────────────────────────────────────────
  // The pins take their plastics from the design tokens, like a box of mixed map pins.
  const tokens = getComputedStyle(container)
  const token = (name: string, fallback: string) => tokens.getPropertyValue(name).trim() || fallback
  const markers = createGlobePins(scene, {
    heads: [
      token('--pin-red', 'red'),
      token('--pin-blue', 'lightskyblue'),
      token('--pin-yellow', 'gold'),
      token('--pin-green', 'limegreen'),
      token('--pin-orange', 'orange'),
      token('--pin-purple', 'mediumpurple')
    ],
    needle: token('--graphite', 'gray')
  })
  let pins: { element: HTMLElement; site: PinSite }[] = []
  const placement: PinPlacement = { x: 0, y: 0, visible: false }

  const setPins = (next: readonly GlobePin[]) => {
    pins = next.map(({ latitude, longitude, element }) => {
      const lat = MathUtils.degToRad(latitude)
      const lon = MathUtils.degToRad(longitude)
      return {
        element,
        site: {
          point: ellipsoid.getCartographicToPosition(lat, lon, 0, new Vector3()),
          normal: ellipsoid.getCartographicToNormal(lat, lon, new Vector3())
        }
      }
    })
    markers.setSites(pins.map(({ site }) => site))
    requestRender()
  }

  /** Sizes the 3-D pins for this frame and keeps each button over its pin's head. */
  const placePins = () => {
    const heads = markers.update(camera)
    const { clientWidth, clientHeight } = container
    pins.forEach(({ element, site }, index) => {
      const head = heads[index] ?? site.point
      placePin(head, site.normal, camera, clientWidth, clientHeight, placement)
      // The button is hidden with its pin's foot, once the site has turned past the horizon.
      element.hidden = !placement.visible
      element.style.translate = `${placement.x}px ${placement.y}px`
      // Buttons stay hidden until first placed here, so they don't flash in the corner.
      element.dataset.placed = ''
    })
  }

  // ── Sky ────────────────────────────────────────────────────────
  // Near the ground, a daylight sky lit for the scan's month; from orbit, the dark of space.
  const sky = createGlobeSky(scene, ellipsoid)
  const skyDay = () => dayOfYearFromDate(view.kind === 'scan' ? view.tileset.date : '')

  beforeRender = () => {
    sky.update(camera, skyDay())
    placePins()
  }

  // ── Keyboard and frame loop ────────────────────────────────────
  const sceneOrigin = new Vector3()
  const cartographic = { lat: 0, lon: 0, height: 0 }

  const keyboard = createKeyboardFlight({
    canvas,
    camera,
    getUp: (target) => ellipsoid.getPositionToNormal(camera.position, target),
    getSpeed() {
      // About 5 m/s when 10 m from a scan, and fast enough to cross the globe from orbit.
      if (view.kind === 'scan') {
        sceneOrigin.setFromMatrixPosition(view.frame)
        return Math.max(1, 0.5 * camera.position.distanceTo(sceneOrigin))
      }
      ellipsoid.getPositionToCartographic(camera.position, cartographic)
      return Math.max(1, 0.5 * cartographic.height)
    },
    // GlobeControls reads the camera afresh every frame, and still keeps it above the terrain.
    onMove: () => {}
  })

  onFrame = (deltaSeconds) => {
    if (flight) {
      flight.elapsed += deltaSeconds
      const t = Math.min(flight.elapsed / FLIGHT_SECONDS, 1)
      placeCamera(flight.poseAt(t, flightPose))
      // Keeps the clip planes fitted and the camera above the terrain on the way.
      controls.adjustCamera(camera)
      if (t >= 1) endFlight()
      return true
    }
    const moved = keyboard.update(deltaSeconds)
    controls.update()
    return moved
  }

  // ── Debug ──────────────────────────────────────────────────────
  const getDebugInfo = (): SplatSceneDebugInfo => {
    // Scan views report in the scan's frame, so the pose can be pasted into `SplatTileset.camera`.
    const worldToLocal = view.kind === 'scan' ? view.frame.clone().invert() : new Matrix4()
    const position = camera.position.clone().applyMatrix4(worldToLocal)
    const forward = camera.getWorldDirection(new Vector3()).transformDirection(worldToLocal)
    const lookAt = position.clone().addScaledVector(forward, DEBUG_LOOK_DISTANCE)
    ellipsoid.getPositionToCartographic(camera.position, cartographic)
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
      },
      ...tilesDebugInfo(shownScan?.tiles ?? surface)
    }
  }

  return {
    setPins,
    flyTo,
    flyHome,
    resetView: () => jumpTo(viewPose()),
    pause: core.stop,
    resume: core.start,
    getDebugInfo,
    dispose() {
      navigation++
      pinning.abort()
      keyboard.dispose()
      controls.dispose()
      markers.dispose()
      sky.dispose()
      core.dispose()
    }
  }
}
