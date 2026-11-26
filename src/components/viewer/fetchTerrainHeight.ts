import {
  sampleTerrarium,
  TERRARIUM_TILE_SIZE,
  terrariumPixelAt,
  terrariumTileUrl
} from '@/utils/terrarium'

/**
 * Reads the terrain height at one point from a Terrarium tile, in the same metres the terrain
 * plugin displaces the globe by. Fetching the deepest tile directly gives the same answer however
 * far the visible terrain has refined.
 */
export async function fetchTerrainHeight(
  urlTemplate: string,
  latDeg: number,
  lonDeg: number,
  zoom: number,
  signal: AbortSignal
): Promise<number> {
  const pixel = terrariumPixelAt(latDeg, lonDeg, zoom)
  const response = await fetch(terrariumTileUrl(urlTemplate, pixel), { signal })
  if (!response.ok) throw new Error(`Terrain tile request failed with ${response.status}`)

  // No colour conversion or premultiplying: the RGB values are data, not colour.
  const bitmap = await createImageBitmap(await response.blob(), {
    colorSpaceConversion: 'none',
    premultiplyAlpha: 'none'
  })
  const { width, height } = bitmap
  const context = new OffscreenCanvas(width, height).getContext('2d')
  if (!context) {
    bitmap.close()
    throw new Error('No 2-D canvas context to read the terrain tile')
  }
  context.drawImage(bitmap, 0, 0)
  bitmap.close()

  const { data } = context.getImageData(0, 0, width, height)
  const scale = width / TERRARIUM_TILE_SIZE
  return sampleTerrarium(data, width, height, pixel.px * scale, pixel.py * scale)
}
