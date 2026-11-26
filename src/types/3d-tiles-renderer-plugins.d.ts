import type { ImageOverlay } from '3d-tiles-renderer/plugins'

// `TerrariumMeshPlugin` is exported at runtime by `3d-tiles-renderer/plugins` (0.5.3) but is
// missing from its `index.d.ts`. Only the options this site uses are typed here.
declare module '3d-tiles-renderer/plugins' {
  export class TerrariumMeshPlugin {
    constructor(options: {
      /** XYZ template, e.g. `.../{z}/{x}/{y}.png`. */
      url: string
      maxZoom?: number
      /** Vertical exaggeration on the ellipsoid. */
      heightScale?: number
      overlay?: ImageOverlay | null
      applyOverlayTexture?: boolean
      unlit?: boolean
    })
  }
}
