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
  readonly camera: CameraPose
  /** True for georeferenced (ECEF) tilesets, which are shown on a satellite-imagery globe. */
  readonly globe: boolean
  /** Metres added along the local vertical after pinning to the terrain. */
  readonly verticalOffset: number

  constructor({
    url,
    title,
    description,
    date,
    location,
    camera,
    globe,
    verticalOffset = 0
  }: SplatTilesetOptions) {
    this.url = url
    this.title = title
    this.description = description
    this.date = date
    this.location = location
    this.camera = camera
    this.globe = globe
    this.verticalOffset = verticalOffset
  }
}
