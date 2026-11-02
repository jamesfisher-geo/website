import { useEffect, useState } from 'react'
import type { SplatSceneDebugInfo } from './createSplatScene'
import type { Vec3 } from './SplatTileset'
import styles from './SplatDebugPanel.module.css'

const REFRESH_MS = 250

export interface SplatDebugPanelProps {
  /** Returns the current values, or null if the scene hasn't started. */
  getInfo: () => SplatSceneDebugInfo | null
}

/** Same format as `camera` in journalTilesets.tsx, so values can be pasted straight in. */
function formatVec3(vector: Vec3) {
  return `[${vector.map((value) => value.toFixed(2)).join(', ')}]`
}

export function SplatDebugPanel({ getInfo }: SplatDebugPanelProps) {
  const [info, setInfo] = useState(getInfo)

  useEffect(() => {
    const interval = setInterval(() => setInfo(getInfo()), REFRESH_MS)
    return () => clearInterval(interval)
  }, [getInfo])

  if (!info) {
    return (
      <aside className={styles.panel} aria-label="Viewer debug info">
        <p>Waiting for scene…</p>
      </aside>
    )
  }

  const { tiles } = info
  const rows: [label: string, value: string][] = [
    ['Position', formatVec3(info.position)],
    ['Look at', formatVec3(info.lookAt)],
    ['Heading', `${info.headingDeg.toFixed(1)}°`],
    ['Pitch', `${info.pitchDeg.toFixed(1)}°`],
    ['Progress', `${Math.round(info.loadProgress * 100)}%`],
    ['Visible', String(tiles.visible)],
    ['Active', String(tiles.active)],
    ['Loaded', String(tiles.loaded)],
    ['Queued', String(tiles.queued)],
    ['Downloading', String(tiles.downloading)],
    ['Parsing', String(tiles.parsing)],
    ['Failed', String(tiles.failed)]
  ]

  return (
    <aside className={styles.panel} aria-label="Viewer debug info">
      <dl className={styles.rows}>
        {rows.map(([label, value]) => (
          <div key={label} className={styles.row}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  )
}
