import type { Ridge, ValleyLine } from '@/utils/contours'

/**
 * Valley-and-Ridge layout for the 800×600 contour texture (DESIGN.md §8).
 * Ridges run ENE at about −17° (varying a few degrees), like the Millheim, PA
 * quadrangle. They sit in parallel bands that never overlap, and the centre (where
 * the hero text sits: roughly x 275–525, y 230–360 on desktop, and x 262–538, y 180–400
 * on a 360px phone) stays open valley floor.
 * Contours are packed tight to match the sheet's 20-foot interval on steep flanks.
 */
const AXIS = -17

export const RIDGES: Ridge[] = [
  // North: a long ridge that runs off both edges.
  { cx: 400, cy: 50, length: 620, width: 44, angle: AXIS, levels: 27, bend: 4 },
  // North-west: a short spur that ends in a blunt nose.
  { cx: 100, cy: 238, length: 200, width: 28, angle: AXIS + 1, levels: 18, noseEast: 1.8 },
  // West: a low hill in the valley between the spur and the water-gap ridge.
  { cx: 95, cy: 398, length: 150, width: 20, angle: AXIS + 3, levels: 12, noseEast: 2 },
  // East: plunging fold. Two limbs open eastward from noses that point west.
  { cx: 690, cy: 122, length: 175, width: 26, angle: AXIS, levels: 18, noseWest: 1.7 },
  { cx: 710, cy: 226, length: 165, width: 26, angle: -5, levels: 18, noseWest: 1.7, bend: -3 },
  // South: one ridge cut by a water gap.
  { cx: 120, cy: 484, length: 215, width: 32, angle: AXIS, levels: 21, noseEast: 3 },
  { cx: 610, cy: 334, length: 205, width: 32, angle: AXIS - 1, levels: 21, noseWest: 3 },
  // South-centre: a low, narrow ridge between the water gap and the far-south ridge.
  { cx: 330, cy: 508, length: 165, width: 19, angle: AXIS + 2, levels: 13 },
  // Far south: another long ridge that leaves the frame.
  { cx: 450, cy: 566, length: 640, width: 48, angle: AXIS + 1, levels: 27, bend: -5 }
]

export const VALLEYS: ValleyLine[] = [
  { x: 380, y: 118, length: 480, angle: AXIS },
  { x: 380, y: 136, length: 470, angle: AXIS },
  { x: -40, y: 330, length: 330, angle: AXIS },
  { x: 560, y: 430, length: 300, angle: AXIS - 2 }
]
