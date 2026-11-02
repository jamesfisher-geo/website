import type { ReactNode } from 'react'

export type Vec3 = readonly [x: number, y: number, z: number]

/** Starting camera, in the tileset's coordinates (metres, +Y up). */
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
}

export class SplatTileset {
  readonly url: string
  readonly title: string
  readonly description: ReactNode
  readonly date: string
  readonly location: string
  readonly camera: CameraPose

  constructor({ url, title, description, date, location, camera }: SplatTilesetOptions) {
    this.url = url
    this.title = title
    this.description = description
    this.date = date
    this.location = location
    this.camera = camera
  }
}
