import { useCallback, useEffect, useRef, useState } from 'react'
import type { SplatSceneHandle, SplatSceneStatus } from './createSplatScene'
import { SplatDebugPanel } from './SplatDebugPanel'
import type { SplatTileset } from './SplatTileset'
import styles from './SplatViewer.module.css'

export interface SplatViewerProps {
  tileset: SplatTileset
  /** Figure caption, shown below the viewer on the same line as the reset button. */
  caption: string
}

/** True when a key press belongs to a form control, such as type-ahead in the scene dropdown. */
function isFormControl(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName))
  )
}

export function SplatViewer({ tileset, caption }: SplatViewerProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<SplatSceneHandle | null>(null)
  const [status, setStatus] = useState<SplatSceneStatus>({ kind: 'loading', progress: 0 })
  const [debugOpen, setDebugOpen] = useState(false)
  const getDebugInfo = useCallback(() => sceneRef.current?.getDebugInfo() ?? null, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'i' || event.repeat) return
      // Modifiers leave browser shortcuts such as Ctrl+Shift+I for dev tools alone.
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (isFormControl(event.target)) return
      setDebugOpen((open) => !open)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    const container = hostRef.current
    if (!container) return

    let cancelled = false
    const onStatus = (next: SplatSceneStatus) => {
      if (!cancelled) setStatus(next)
    }

    // Dynamic import keeps three.js and the splat renderer out of the other pages' bundles.
    import('./createSplatScene')
      .then(({ createSplatScene }) => createSplatScene({ container, tileset, onStatus }))
      .then((scene) => {
        if (cancelled) {
          scene.dispose()
          return
        }
        sceneRef.current = scene
      })
      .catch((error: unknown) => {
        console.error('Failed to start the splat viewer', error)
        onStatus({ kind: 'error', message: 'The 3-D viewer could not start in this browser.' })
      })

    return () => {
      cancelled = true
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [tileset])

  return (
    <figure className={styles.figure}>
      <div className={styles.viewer}>
        <div ref={hostRef} className={styles.host} />

        {debugOpen && <SplatDebugPanel getInfo={getDebugInfo} />}

        {status.kind === 'loading' && (
          <p className={styles.loading} role="status">
            Loading tiles… {/* Hidden from screen readers, which would announce every percent. */}
            <span aria-hidden="true">{Math.round(status.progress * 100)}%</span>
          </p>
        )}

        {status.kind === 'error' && (
          <p className={styles.error} role="alert">
            {status.message}
          </p>
        )}
      </div>

      {status.kind === 'ready' && (
        <button
          type="button"
          className={styles.reset}
          onClick={() => sceneRef.current?.resetView()}
        >
          Reset view
        </button>
      )}
      {/* HTML requires figcaption to be first or last in a figure; the grid sets its position. */}
      <figcaption className={styles.caption}>{caption}</figcaption>
    </figure>
  )
}
