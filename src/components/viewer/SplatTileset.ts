import type { ReactNode } from 'react'

export type Vec3 = readonly [x: number, y: number, z: number]

/**
 * Starting camera, in metres.
 * - `globe: false`: scene coordinates, +Y up.
 * - `globe: true`: the tileset's local frame before its root transform (east, north, up; +Z up).
 */
interface CameraPose {
  position: Vec3
  lookAt: Vec3
}

export interface SplatTilesetOptions {
  url: string
  title: string
  description: ReactNode
  date: string
  location: string
  /** Site of the scan, in decimal degrees (WGS84), where its pin sits on the globe. */
  latitude: number
  longitude: number
  camera: CameraPose
  globe: boolean
  /**
   * Globe tilesets only: metres to raise (positive) or lower (negative) the scan after it is pinned
   * to the terrain, to correct for coarse terrain under the site. Defaults to 0.
   */
  verticalOffset?: number
}

export class SplatTileset {
  readonly url: string
  readonly title: string
  readonly description: ReactNode
  readonly date: string
  readonly location: string
  readonly latitude: number
  readonly longitude: number
  readonly camera: CameraPose
  /**
   * True for georeferenced (ECEF) tilesets: the globe flies to them and shows them in place.
   * False for scans in their own coordinates, such as indoor ones, which open in a scene of their
   * own instead.
   */
  readonly globe: boolean
  /** Metres added along the local vertical after pinning to the terrain. */
  readonly verticalOffset: number

  constructor({
    url,
    title,
    description,
    date,
    location,
    latitude,
    longitude,
    camera,
    globe,
    verticalOffset = 0
  }: SplatTilesetOptions) {
    this.url = url
    this.title = title
    this.description = description
    this.date = date
    this.location = location
    this.latitude = latitude
    this.longitude = longitude
    this.camera = camera
    this.globe = globe
    this.verticalOffset = verticalOffset
  }
}
