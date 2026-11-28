import {
  AmbientLight,
  CylinderGeometry,
  DirectionalLight,
  Group,
  Mesh,
  MeshPhongMaterial,
  Quaternion,
  SphereGeometry,
  Vector3
} from 'three'
import type { Camera, ColorRepresentation, Scene } from 'three'

/** Pin height as a share of its distance from the camera, so it keeps one size on screen. */
const PIN_SCALE = 0.025
/** Head and needle, in pin heights: a short needle, with a head that still reads at a glance. */
const HEAD_RADIUS = 0.26
const NEEDLE_RADIUS = 0.036

export interface PinSite {
  /** On the ellipsoid surface, in globe coordinates. */
  point: Vector3
  /** The surface normal there: the way the pin stands. */
  normal: Vector3
}

const yAxis = new Vector3(0, 1, 0)

export interface GlobePinColors {
  /** Head colours, handed out in turn by pin order, like a classroom box of map pins. */
  heads: readonly ColorRepresentation[]
  needle: ColorRepresentation
}

/**
 * Map pins standing on the globe, like push pins in a classroom map: a glossy plastic head on a
 * steel needle, upright along the local vertical and shaded by a light that follows the camera,
 * so they read as solid as the globe turns. Each pin takes the next head colour in turn, so a
 * scan keeps its colour from one visit to the next. They
 * are resized every frame to keep one size on screen at any zoom, and the globe itself hides the
 * ones past the horizon.
 *
 * Only the pins are lit: the terrain is unlit and the splats ignore scene lights.
 */
export function createGlobePins(scene: Scene, colors: GlobePinColors) {
  const group = new Group()
  group.name = 'globe pins'
  scene.add(group)

  const ambient = new AmbientLight(0xffffff, 0.9)
  const headlight = new DirectionalLight(0xffffff, 1.6)
  scene.add(ambient, headlight, headlight.target)

  // A unit pin: the needle's foot at the origin, the head's centre at +Y = 1.
  const needle = new CylinderGeometry(NEEDLE_RADIUS, NEEDLE_RADIUS, 1, 8).translate(0, 0.5, 0)
  const head = new SphereGeometry(HEAD_RADIUS, 24, 16).translate(0, 1, 0)
  // Shiny plastic heads catch a bright highlight; the needle has a duller, metal sheen.
  const headMaterials = colors.heads.map(
    (color) => new MeshPhongMaterial({ color, shininess: 80, specular: 0x555555 })
  )
  const needleMaterial = new MeshPhongMaterial({
    color: colors.needle,
    shininess: 40,
    specular: 0x888888
  })

  let pins: { site: PinSite; object: Group; head: Vector3 }[] = []

  return {
    setSites(sites: readonly PinSite[]) {
      group.clear()
      pins = sites.map((site, index) => {
        const object = new Group()
        const headMaterial = headMaterials[index % headMaterials.length] ?? needleMaterial
        const parts = [new Mesh(needle, needleMaterial), new Mesh(head, headMaterial)]
        // Not a surface to drag or zoom on: the controls' raycasts pass through.
        for (const part of parts) part.raycast = () => {}
        object.add(...parts)
        object.position.copy(site.point)
        object.quaternion.copy(new Quaternion().setFromUnitVectors(yAxis, site.normal))
        group.add(object)
        return { site, object, head: site.point.clone() }
      })
    },

    /** Resizes the pins for the camera, and returns where each head is, in site order. */
    update(camera: Camera): readonly Vector3[] {
      // Lit from just above the viewer, so the heads show a highlight and a shaded side.
      headlight.position.copy(camera.up).multiplyScalar(0.3).add(camera.position)
      headlight.target.position.set(0, 0, 0)
      headlight.target.updateMatrixWorld()

      for (const pin of pins) {
        const height = PIN_SCALE * camera.position.distanceTo(pin.site.point)
        pin.object.scale.setScalar(height)
        pin.object.updateMatrixWorld()
        pin.head.copy(pin.site.normal).multiplyScalar(height).add(pin.site.point)
      }
      return pins.map(({ head }) => head)
    },

    dispose() {
      scene.remove(group, ambient, headlight, headlight.target)
      needle.dispose()
      head.dispose()
      for (const material of headMaterials) material.dispose()
      needleMaterial.dispose()
    }
  }
}
