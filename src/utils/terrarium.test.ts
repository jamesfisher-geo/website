import { decodeTerrarium, sampleTerrarium, terrariumPixelAt, terrariumTileUrl } from './terrarium'

/** Encodes metres the way Terrarium does. */
function encodeRgb(metres: number): [r: number, g: number, b: number] {
  const value = metres + 32768
  return [Math.floor(value / 256), Math.floor(value % 256), Math.round((value % 1) * 256)]
}

/** One opaque RGBA pixel, for building test tiles. */
function encode(metres: number) {
  return [...encodeRgb(metres), 255]
}

describe('terrarium', () => {
  it('decodes sea level and heights', () => {
    expect(decodeTerrarium(128, 0, 0)).toBe(0)
    expect(decodeTerrarium(...encodeRgb(1234.5))).toBe(1234.5)
    expect(decodeTerrarium(...encodeRgb(-12))).toBe(-12)
  })

  it('finds the tile and pixel for Agios Pavlos at zoom 15', () => {
    const pixel = terrariumPixelAt(35.101795, 24.562466, 15)
    expect(pixel).toMatchObject({ x: 18619, y: 12968, zoom: 15 })
    expect(pixel.px).toBeCloseTo(186.9, 0)
    expect(pixel.py).toBeCloseTo(3.9, 0)
  })

  it('fills the url template', () => {
    const pixel = { x: 3, y: 5, zoom: 7, px: 0, py: 0 }
    expect(terrariumTileUrl('https://tiles.test/{z}/{x}/{y}.png', pixel)).toBe(
      'https://tiles.test/7/3/5.png'
    )
  })

  it('interpolates between pixel centres and clamps at the edge', () => {
    // 2 × 2 tile: 0 and 10 m on the top row, 20 and 30 m on the bottom row.
    const rgba = [...encode(0), ...encode(10), ...encode(20), ...encode(30)]
    expect(sampleTerrarium(rgba, 2, 2, 0.5, 0.5)).toBe(0)
    expect(sampleTerrarium(rgba, 2, 2, 1, 1)).toBe(15)
    expect(sampleTerrarium(rgba, 2, 2, 2, 0)).toBe(10)
  })
})
