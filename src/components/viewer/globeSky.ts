import type { Ellipsoid } from '3d-tiles-renderer'
import { BackSide, BoxGeometry, Matrix3, Mesh, ShaderMaterial, UniformsUtils, Vector3 } from 'three'
import type { Camera, IUniform, Scene } from 'three'
import { Sky } from 'three/addons/objects/Sky.js'
import { sunPosition } from './solarPosition'

/** Local solar time the sky is lit for: mid-afternoon, with the sun lower in the west. */
const SOLAR_HOUR = 16
/** The sky fades out between these heights above the ellipsoid, in metres, as the air thins. */
const FADE_START_M = 30_000
const FADE_END_M = 150_000
/** Half the sky box's width, in metres. The shader pins it to the far plane, so any size works. */
const SKY_SIZE = 1e5
/** Exposure for the sky's own tone mapping, as in three.js's sky example. */
const EXPOSURE = 0.5

interface SkyShaderSource {
  uniforms: Record<string, IUniform>
  vertexShader: string
  fragmentShader: string
}

/** Swaps one line of a shader, failing loudly if a three.js update has moved it. */
function patch(source: string, find: string, replace: string) {
  if (!source.includes(find)) throw new Error(`Sky shader has changed: "${find}" not found`)
  return source.replace(find, replace)
}

/**
 * The Preetham model assumes world +Y is up, but on the globe up depends on where you stand. So
 * the box follows the camera, and the shader turns each view direction into the local frame at the
 * camera (east, up, south) before working out the sky colour there.
 *
 * The sky also tone-maps itself (the rest of the scene is not tone-mapped, so the satellite
 * imagery keeps its colours) and fades by an opacity, written premultiplied, as the camera climbs
 * out of the atmosphere.
 */
function createSkyMaterial() {
  const shader = Sky.SkyShader as SkyShaderSource
  const vertexShader = patch(
    `uniform mat3 skyFromWorld;\n${shader.vertexShader}`,
    'vWorldPosition = worldPosition.xyz;',
    'vWorldPosition = cameraPosition + skyFromWorld * ( worldPosition.xyz - cameraPosition );'
  )
  const fragmentShader = patch(
    patch(
      `uniform float skyOpacity;\nuniform float skyExposure;\n${shader.fragmentShader}`,
      'gl_FragColor = vec4( texColor, 1.0 );',
      // Narkowicz's fit to ACES, close to three.js's ACESFilmicToneMapping.
      `vec3 x = texColor * skyExposure;
			gl_FragColor = vec4( clamp( ( x * ( 2.51 * x + 0.03 ) ) / ( x * ( 2.43 * x + 0.59 ) + 0.14 ), 0.0, 1.0 ), 1.0 );`
    ),
    '#include <colorspace_fragment>',
    '#include <colorspace_fragment>\n\t\t\tgl_FragColor *= skyOpacity;'
  )

  const uniforms = UniformsUtils.clone(shader.uniforms)
  uniforms.skyFromWorld = { value: new Matrix3() }
  uniforms.skyOpacity = { value: 1 }
  uniforms.skyExposure = { value: EXPOSURE }
  // A clear day: little haze, and scattered, solid fair-weather clouds that don't drift.
  uniforms.turbidity = { value: 2 }
  uniforms.rayleigh = { value: 1.2 }
  uniforms.cloudCoverage = { value: 0.35 }
  uniforms.cloudDensity = { value: 0.6 }

  return new ShaderMaterial({
    name: 'GlobeSkyShader',
    uniforms,
    vertexShader,
    fragmentShader,
    // The camera is inside the box, so it sees the box's inner faces.
    side: BackSide,
    // Drawn first and behind everything: later draws simply cover it.
    depthTest: false,
    depthWrite: false,
    toneMapped: false
  })
}

const east = new Vector3()
const north = new Vector3()
const up = new Vector3()
const cartographic = { lat: 0, lon: 0, height: 0 }

/**
 * A daylight sky for views near the ground, lit by where the sun would stand at that spot at 4 pm
 * local solar time on the given day. It thins away above 30 km, leaving the globe on the dark of space.
 */
export function createGlobeSky(scene: Scene, ellipsoid: Ellipsoid) {
  const material = createSkyMaterial()
  const sky = new Mesh(new BoxGeometry(1, 1, 1), material)
  sky.name = 'sky'
  sky.scale.setScalar(2 * SKY_SIZE)
  sky.renderOrder = -1
  sky.frustumCulled = false
  // Not a surface to drag or zoom on: the controls' raycasts pass through.
  sky.raycast = () => {}
  scene.add(sky)

  const uniforms = material.uniforms as Record<string, IUniform>

  return {
    /** Fits the sky to the camera, for a scene on the given day of the year. */
    update(camera: Camera, dayOfYear: number) {
      ellipsoid.getPositionToCartographic(camera.position, cartographic)
      const t = Math.min(
        Math.max((cartographic.height - FADE_START_M) / (FADE_END_M - FADE_START_M), 0),
        1
      )
      const opacity = 1 - t * t * (3 - 2 * t)
      sky.visible = opacity > 0
      if (!sky.visible) return

      sky.position.copy(camera.position)
      sky.updateMatrixWorld()
      uniforms.skyOpacity!.value = opacity

      // Rows are the local axes in world coordinates: east → x, up → y, south → z.
      ellipsoid.getEastNorthUpAxes(cartographic.lat, cartographic.lon, east, north, up)
      // prettier-ignore
      ;(uniforms.skyFromWorld!.value as Matrix3).set(
        east.x, east.y, east.z,
        up.x, up.y, up.z,
        -north.x, -north.y, -north.z
      )

      const { elevation, azimuth } = sunPosition(
        (cartographic.lat * 180) / Math.PI,
        dayOfYear,
        SOLAR_HOUR
      )
      ;(uniforms.sunPosition!.value as Vector3).set(
        Math.sin(azimuth) * Math.cos(elevation),
        Math.sin(elevation),
        -Math.cos(azimuth) * Math.cos(elevation)
      )
    },

    dispose() {
      scene.remove(sky)
      sky.geometry.dispose()
      material.dispose()
    }
  }
}
