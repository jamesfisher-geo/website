/** Helpers for Terrarium-encoded elevation tiles (AWS Terrain Tiles), XYZ / web-mercator scheme. */

export const TERRARIUM_TILE_SIZE = 256

export interface TerrariumPixel {
  /** Tile column and row at `zoom`. */
  x: number
  y: number
  zoom: number
  /** Fractional pixel position inside the tile, 0 to `TERRARIUM_TILE_SIZE`. */
  px: number
  py: number
}

/** Finds the tile, and the position inside it, that holds the given point. */
export function terrariumPixelAt(latDeg: number, lonDeg: number, zoom: number): TerrariumPixel {
  const tiles = 2 ** zoom
  const lat = (latDeg * Math.PI) / 180
  const fx = ((lonDeg + 180) / 360) * tiles
  const fy = ((1 - Math.asinh(Math.tan(lat)) / Math.PI) / 2) * tiles
  const x = Math.floor(fx)
  const y = Math.floor(fy)
  return {
    x,
    y,
    zoom,
    px: (fx - x) * TERRARIUM_TILE_SIZE,
    py: (fy - y) * TERRARIUM_TILE_SIZE
  }
}

/** Fills an XYZ url template such as `.../{z}/{x}/{y}.png`. */
export function terrariumTileUrl(template: string, { x, y, zoom }: TerrariumPixel) {
  return template.replace('{z}', String(zoom)).replace('{x}', String(x)).replace('{y}', String(y))
}

/** Metres above sea level for one Terrarium pixel. */
export function decodeTerrarium(r: number, g: number, b: number) {
  return r * 256 + g + b / 256 - 32768
}

/**
 * Bilinear elevation at a fractional pixel position in RGBA tile data, treating pixel centres as
 * sample points. Positions near the edge clamp to the tile rather than reading its neighbours.
 */
export function sampleTerrarium(
  rgba: ArrayLike<number>,
  width: number,
  height: number,
  px: number,
  py: number
) {
  const fx = Math.min(Math.max(px - 0.5, 0), width - 1)
  const fy = Math.min(Math.max(py - 0.5, 0), height - 1)
  const x0 = Math.floor(fx)
  const y0 = Math.floor(fy)
  const x1 = Math.min(x0 + 1, width - 1)
  const y1 = Math.min(y0 + 1, height - 1)
  const tx = fx - x0
  const ty = fy - y0

  const at = (x: number, y: number) => {
    const i = (y * width + x) * 4
    return decodeTerrarium(rgba[i] ?? 0, rgba[i + 1] ?? 0, rgba[i + 2] ?? 0)
  }
  const top = at(x0, y0) * (1 - tx) + at(x1, y0) * tx
  const bottom = at(x0, y1) * (1 - tx) + at(x1, y1) * tx
  return top * (1 - ty) + bottom * ty
}
