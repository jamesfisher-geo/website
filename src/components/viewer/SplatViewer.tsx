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

/** The familiar four-corner glyph: corners point out to enter full screen, in to exit. */
function FullscreenIcon({ exit }: { exit: boolean }) {
  return (
    <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d={
          exit ? 'M6 2v4H2M10 2v4h4M6 14v-4H2M10 14v-4h4' : 'M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4'
        }
      />
    </svg>
  )
}

/** Element full screen isn't available everywhere (e.g. iPhone Safari), so the control hides. */
function canFullscreen() {
  return typeof document !== 'undefined' && document.fullscreenEnabled === true
}

export function SplatViewer({ tileset, caption }: SplatViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<SplatSceneHandle | null>(null)
  const [status, setStatus] = useState<SplatSceneStatus>({ kind: 'loading', progress: 0 })
  const [debugOpen, setDebugOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
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
    // Also catches Esc and the browser's own exit, which bypass the button.
    const onChange = () => setFullscreen(document.fullscreenElement === viewerRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = () => {
    const request = fullscreen ? document.exitFullscreen() : viewerRef.current?.requestFullscreen()
    request?.catch((error: unknown) => console.error('Full screen request failed', error))
  }

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
      {/* Focus events bubble from the canvas, the only focusable thing in the viewer. */}
      <div
        ref={viewerRef}
        className={styles.viewer}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        <div ref={hostRef} className={styles.host} />

        {debugOpen && <SplatDebugPanel getInfo={getDebugInfo} />}

        {/* The canvas label already describes the keys to screen readers. */}
        {focused && !debugOpen && (
          <p className={styles.keys} aria-hidden="true">
            W A S D move · E Q up/down · ← → ↑ ↓ look · Shift faster
          </p>
        )}

        {tileset.globe && (
          <p className={styles.attribution}>
            Imagery © Esri, Maxar, Earthstar Geographics · Elevation: Mapzen, USGS SRTM &amp;
            GMTED2010, NOAA ETOPO1, Copernicus EU-DEM
          </p>
        )}

        {status.kind === 'loading' && (
          <p className={styles.loading} role="status">
            Loading tiles… {/* Hidden from screen readers, which would announce every percent. */}
            <span aria-hidden="true">{Math.round(status.progress * 100)}%</span>
          </p>
        )}

        {/* Inside the viewer, so the controls stay reachable while it fills the screen. */}
        {status.kind === 'ready' && (fullscreen || canFullscreen()) && (
          <div className={styles.controls}>
            {fullscreen && (
              <button
                type="button"
                className={styles.control}
                onClick={() => sceneRef.current?.resetView()}
              >
                Reset view
              </button>
            )}
            <button
              type="button"
              className={`${styles.control} ${styles.iconControl}`}
              aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
              title={fullscreen ? 'Exit full screen' : 'Full screen'}
              onClick={toggleFullscreen}
            >
              <FullscreenIcon exit={fullscreen} />
            </button>
          </div>
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
