import { useCallback, useEffect, useRef, useState } from 'react'
import type { GlobeSceneHandle } from './createGlobeScene'
import type { SplatSceneHandle, SplatSceneStatus } from './createSplatScene'
import { SplatDebugPanel } from './SplatDebugPanel'
import type { SplatTileset } from './SplatTileset'
import styles from './SplatViewer.module.css'

export interface SplatViewerProps {
  /** Every scan, each shown as a pin on the globe. */
  tilesets: readonly SplatTileset[]
  /** The scan being shown, or null for the globe. */
  selected: SplatTileset | null
  /** Called with a scan when its pin is chosen, and with null to go back to the globe. */
  onSelect: (tileset: SplatTileset | null) => void
}

const START_ERROR: SplatSceneStatus = {
  kind: 'error',
  message: 'The 3-D viewer could not start in this browser.'
}

/** True when a key press belongs to a form control elsewhere on the page. */
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

/**
 * A scan's name typed on a manila luggage tag, tied to its pin's head with a loop of string. It shows
 * while the pin is hovered or focused; the pin's own accessible name already says the same.
 */
function LuggageTag({ tileset }: { tileset: SplatTileset }) {
  return (
    <span className={styles.tagMount} aria-hidden="true">
      <svg className={styles.tagString} viewBox="0 0 26 12" focusable="false">
        <path d="M1 1 C 6 10, 16.5 12, 25 8.5" />
      </svg>
      <span className={styles.tag}>
        <span className={styles.tagCard}>
          <span className={styles.tagHole} />
          <span className={styles.tagText}>
            <span className={styles.tagTitle}>{tileset.title}</span>
          </span>
        </span>
      </span>
    </span>
  )
}

function figureCaption(tilesets: readonly SplatTileset[], selected: SplatTileset | null) {
  if (!selected) return `FIG. 01 — Field sites · ${tilesets.length} scans`
  return `FIG. 01 — ${selected.title} · ${selected.location} · ${selected.date}`
}

/**
 * The journal's 3-D viewer. It opens on a globe with a pin at each scan's site. A georeferenced
 * scan is flown to on the globe; any other scan, such as an indoor one, opens in a scene of its
 * own while the globe waits, paused, behind it. A Back control returns to the opening globe view.
 */
export function SplatViewer({ tilesets, selected, onSelect }: SplatViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null)
  const globeHostRef = useRef<HTMLDivElement>(null)
  const sceneHostRef = useRef<HTMLDivElement>(null)
  const pinRefs = useRef(new Map<SplatTileset, HTMLButtonElement>())
  const sceneRef = useRef<SplatSceneHandle | null>(null)
  const [globe, setGlobe] = useState<GlobeSceneHandle | null>(null)
  const [globeStatus, setGlobeStatus] = useState<SplatSceneStatus>({
    kind: 'loading',
    progress: 0
  })
  const [sceneStatus, setSceneStatus] = useState<SplatSceneStatus>({ kind: 'loading', progress: 0 })
  const [debugOpen, setDebugOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  /** A scan that opens in its own scene rather than on the globe. */
  const standalone = selected !== null && !selected.globe
  const status = standalone ? sceneStatus : globeStatus

  const getDebugInfo = useCallback(
    () => (standalone ? sceneRef.current : globe)?.getDebugInfo() ?? null,
    [standalone, globe]
  )

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

  // The globe is made once and kept for the viewer's life.
  useEffect(() => {
    const container = globeHostRef.current
    if (!container) return

    let cancelled = false
    let handle: GlobeSceneHandle | null = null
    const onStatus = (next: SplatSceneStatus) => {
      if (!cancelled) setGlobeStatus(next)
    }

    // Dynamic import keeps three.js and the splat renderer out of the other pages' bundles.
    import('./createGlobeScene')
      .then(({ createGlobeScene }) => {
        if (cancelled) return
        handle = createGlobeScene({ container, onStatus })
        setGlobe(handle)
      })
      .catch((error: unknown) => {
        console.error('Failed to start the globe viewer', error)
        onStatus(START_ERROR)
      })

    return () => {
      cancelled = true
      handle?.dispose()
      setGlobe(null)
    }
  }, [])

  // Moves the globe to follow the selection.
  const shownRef = useRef<SplatTileset | null>(null)
  useEffect(() => {
    if (!globe) return
    const previous = shownRef.current
    shownRef.current = selected
    if (previous === selected) return

    if (previous && !previous.globe) globe.resume()
    if (selected === null) {
      // From a scan on the globe, fly back out. From a standalone scan, the globe was left
      // waiting, perhaps turned, so it jumps straight to the opening view.
      if (previous?.globe) globe.flyHome()
      else globe.resetView()
    } else if (selected.globe) {
      globe.flyTo(selected)
    } else {
      globe.pause()
    }
  }, [globe, selected])

  // Pins show on the opening globe only.
  useEffect(() => {
    if (!globe) return
    if (selected !== null) {
      globe.setPins([])
      return
    }
    globe.setPins(
      tilesets.flatMap((tileset) => {
        const element = pinRefs.current.get(tileset)
        return element
          ? [{ latitude: tileset.latitude, longitude: tileset.longitude, element }]
          : []
      })
    )
  }, [globe, selected, tilesets])

  // A standalone scan gets its own scene, made fresh each time it opens.
  useEffect(() => {
    const container = sceneHostRef.current
    if (!container || !selected || selected.globe) return

    let cancelled = false
    setSceneStatus({ kind: 'loading', progress: 0 })
    const onStatus = (next: SplatSceneStatus) => {
      if (!cancelled) setSceneStatus(next)
    }

    import('./createSplatScene')
      .then(({ createSplatScene }) => createSplatScene({ container, tileset: selected, onStatus }))
      .then((scene) => {
        if (cancelled) {
          scene.dispose()
          return
        }
        sceneRef.current = scene
      })
      .catch((error: unknown) => {
        console.error('Failed to start the splat viewer', error)
        onStatus(START_ERROR)
      })

    return () => {
      cancelled = true
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [selected])

  const resetView = () => (standalone ? sceneRef.current : globe)?.resetView()

  return (
    <figure className={styles.figure}>
      {/* Focus events bubble from the canvas and the pins. */}
      <div
        ref={viewerRef}
        className={standalone ? styles.viewer : `${styles.viewer} ${styles.night}`}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        <div ref={globeHostRef} className={styles.host} hidden={standalone} />
        {standalone && <div ref={sceneHostRef} className={styles.host} />}

        {/* Over each 3-D pin's head: the scene moves them, and hides them beyond the horizon. */}
        {globe &&
          selected === null &&
          tilesets.map((tileset) => (
            <button
              key={`${tileset.url}|${tileset.title}`}
              ref={(element) => {
                if (element) pinRefs.current.set(tileset, element)
                else pinRefs.current.delete(tileset)
              }}
              type="button"
              className={styles.pin}
              aria-label={`Open ${tileset.title}, ${tileset.location}`}
              onClick={() => onSelect(tileset)}
            >
              <LuggageTag tileset={tileset} />
            </button>
          ))}

        {debugOpen && <SplatDebugPanel getInfo={getDebugInfo} />}

        {/* The canvas label already describes the keys to screen readers. */}
        {focused && !debugOpen && (
          <p className={styles.keys} aria-hidden="true">
            W A S D move · E Q up/down · ← → ↑ ↓ look · Shift faster
          </p>
        )}

        {selected !== null && (
          <button
            type="button"
            className={`${styles.control} ${styles.back}`}
            aria-label="Back to globe"
            onClick={() => onSelect(null)}
          >
            ← Back
          </button>
        )}

        {!standalone && (
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
              <button type="button" className={styles.control} onClick={resetView}>
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
        <button type="button" className={styles.reset} onClick={resetView}>
          Reset view
        </button>
      )}
      {/* HTML requires figcaption to be first or last in a figure; the grid sets its position. */}
      <figcaption className={styles.caption}>{figureCaption(tilesets, selected)}</figcaption>
    </figure>
  )
}
