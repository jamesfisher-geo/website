import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, beforeEach, vi } from 'vitest'
import { createGlobeScene } from './createGlobeScene'
import type { GlobePin, GlobeSceneHandle, GlobeSceneOptions } from './createGlobeScene'
import { createSplatScene } from './createSplatScene'
import type { SplatSceneHandle, SplatSceneOptions } from './createSplatScene'
import { SplatTileset } from './SplatTileset'
import { SplatViewer } from './SplatViewer'

// jsdom has no GPU, so the three.js engines are replaced and only the React shell is tested.
vi.mock('./createGlobeScene', () => ({ createGlobeScene: vi.fn() }))
vi.mock('./createSplatScene', () => ({ createSplatScene: vi.fn() }))

const mockGlobe = vi.mocked(createGlobeScene)
const mockScene = vi.mocked(createSplatScene)

const debugInfo = () => ({
  position: [2.5, 1, 5] as const,
  lookAt: [0, 0, 0] as const,
  headingDeg: 10,
  pitchDeg: -5,
  loadProgress: 1,
  tiles: { visible: 12, active: 14, loaded: 30, queued: 0, downloading: 0, parsing: 0, failed: 0 }
})

const globe = {
  // Stands in for the scene placing each pin on screen.
  setPins: vi.fn((pins: readonly GlobePin[]) => {
    for (const { element } of pins) element.dataset.placed = ''
  }),
  flyTo: vi.fn(),
  flyHome: vi.fn(),
  resetView: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getDebugInfo: vi.fn(debugInfo),
  dispose: vi.fn()
} satisfies GlobeSceneHandle

const scene = {
  resetView: vi.fn(),
  getDebugInfo: vi.fn(debugInfo),
  dispose: vi.fn()
} satisfies SplatSceneHandle

const outdoor = new SplatTileset({
  url: 'https://example.com/outdoor/tileset.json',
  title: 'Outdoor scene',
  description: 'A scan on the globe.',
  date: '2026-01-01',
  location: 'Coast',
  latitude: 35,
  longitude: 24,
  camera: { position: [1, 2, 3], lookAt: [0, 0, 0] },
  globe: true
})

const indoor = new SplatTileset({
  url: 'https://example.com/indoor/tileset.json',
  title: 'Indoor scene',
  description: 'A scan in its own scene.',
  date: '2026-01-02',
  location: 'Museum',
  latitude: 38,
  longitude: -9,
  camera: { position: [1, 2, 3], lookAt: [0, 0, 0] },
  globe: false
})

const tilesets = [outdoor, indoor]

/** Holds the selection, as the page does. */
function Harness() {
  const [selected, setSelected] = useState<SplatTileset | null>(null)
  return <SplatViewer tilesets={tilesets} selected={selected} onSelect={setSelected} />
}

function renderViewer() {
  return render(<Harness />)
}

async function globeOptions(): Promise<GlobeSceneOptions> {
  await waitFor(() => expect(mockGlobe).toHaveBeenCalled())
  const options = mockGlobe.mock.calls[0]?.[0]
  if (!options) throw new Error('createGlobeScene was not called')
  return options
}

async function sceneOptions(): Promise<SplatSceneOptions> {
  await waitFor(() => expect(mockScene).toHaveBeenCalled())
  const options = mockScene.mock.calls[0]?.[0]
  if (!options) throw new Error('createSplatScene was not called')
  return options
}

async function renderReady() {
  renderViewer()
  const { onStatus } = await globeOptions()
  act(() => onStatus({ kind: 'ready' }))
  return onStatus
}

describe('SplatViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockGlobe.mockReturnValue(globe)
    mockScene.mockResolvedValue(scene)
  })

  it('opens on the globe with a pin for every scan', async () => {
    renderViewer()
    expect(await screen.findByRole('button', { name: 'Open Outdoor scene, Coast' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Open Indoor scene, Museum' })).toBeVisible()
    // The pins are handed to the scene in an effect, after they first render.
    await waitFor(() =>
      expect(globe.setPins).toHaveBeenLastCalledWith([
        expect.objectContaining({ latitude: 35, longitude: 24 }),
        expect.objectContaining({ latitude: 38, longitude: -9 })
      ])
    )
    expect(screen.getByText('FIG. 01 — Field sites · 2 scans')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Back to globe' })).toBeNull()
  })

  it('tags each pin with its scan', async () => {
    renderViewer()
    const pin = await screen.findByRole('button', { name: 'Open Indoor scene, Museum' })
    // The title only: the location is in the pin's accessible name, not on the tag.
    expect(pin).toHaveTextContent(/^Indoor scene$/)
  })

  it('flies to a scan on the globe and back again', async () => {
    const user = userEvent.setup()
    renderViewer()
    await user.click(await screen.findByRole('button', { name: 'Open Outdoor scene, Coast' }))

    expect(globe.flyTo).toHaveBeenCalledWith(outdoor)
    expect(globe.setPins).toHaveBeenLastCalledWith([])
    expect(screen.queryByRole('button', { name: /Open / })).toBeNull()
    expect(screen.getByText('FIG. 01 — Outdoor scene · Coast · 2026-01-01')).toBeInTheDocument()
    expect(mockScene).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Back to globe' }))

    expect(globe.flyHome).toHaveBeenCalledOnce()
    expect(await screen.findByRole('button', { name: 'Open Outdoor scene, Coast' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Back to globe' })).toBeNull()
  })

  it('opens an indoor scan in its own scene, and returns to the opening globe view', async () => {
    const user = userEvent.setup()
    renderViewer()
    await user.click(await screen.findByRole('button', { name: 'Open Indoor scene, Museum' }))

    expect(globe.pause).toHaveBeenCalledOnce()
    expect(globe.flyTo).not.toHaveBeenCalled()
    expect((await sceneOptions()).tileset).toBe(indoor)
    expect(screen.queryByText(/Imagery © Esri/)).toBeNull()
    await waitFor(() => expect(mockScene.mock.results[0]?.type).toBe('return'))
    await act(() => mockScene.mock.results[0]?.value)

    await user.click(screen.getByRole('button', { name: 'Back to globe' }))

    expect(scene.dispose).toHaveBeenCalledOnce()
    expect(globe.resume).toHaveBeenCalledOnce()
    expect(globe.resetView).toHaveBeenCalledOnce()
    expect(globe.flyHome).not.toHaveBeenCalled()
  })

  it('disposes an indoor scene that finishes starting after going back', async () => {
    let finish: (handle: SplatSceneHandle) => void = () => {}
    mockScene.mockReturnValue(new Promise((resolve) => (finish = resolve)))
    const user = userEvent.setup()
    renderViewer()
    await user.click(await screen.findByRole('button', { name: 'Open Indoor scene, Museum' }))
    await sceneOptions()

    await user.click(screen.getByRole('button', { name: 'Back to globe' }))
    expect(scene.dispose).not.toHaveBeenCalled()

    finish(scene)
    await waitFor(() => expect(scene.dispose).toHaveBeenCalledOnce())
  })

  it('toggles the debug panel with the i key', async () => {
    const user = userEvent.setup()
    renderViewer()
    await globeOptions()
    expect(screen.queryByRole('complementary', { name: 'Viewer debug info' })).toBeNull()

    await user.keyboard('i')
    expect(await screen.findByText('[2.50, 1.00, 5.00]')).toBeInTheDocument()

    await user.keyboard('i')
    expect(screen.queryByRole('complementary', { name: 'Viewer debug info' })).toBeNull()
  })

  it('leaves browser shortcuts and form controls alone', async () => {
    const user = userEvent.setup()
    render(
      <>
        <input aria-label="Search" />
        <Harness />
      </>
    )

    await user.keyboard('{Control>}i{/Control}')
    expect(screen.queryByRole('complementary', { name: 'Viewer debug info' })).toBeNull()

    screen.getByRole('textbox', { name: 'Search' }).focus()
    await user.keyboard('i')
    expect(screen.queryByRole('complementary', { name: 'Viewer debug info' })).toBeNull()
  })

  it('shows the loading note until tiles are ready', () => {
    renderViewer()
    expect(screen.getByText('Loading tiles…')).toBeInTheDocument()
  })

  it('shows the keyboard controls while the scene has focus', async () => {
    mockGlobe.mockImplementation(({ container }) => {
      const canvas = document.createElement('canvas')
      canvas.tabIndex = 0
      container.appendChild(canvas)
      return globe
    })
    const user = userEvent.setup()
    render(
      <>
        <Harness />
        <button type="button">After</button>
      </>
    )
    await globeOptions()
    const hint = /W A S D move/
    expect(screen.queryByText(hint)).toBeNull()

    await user.tab()
    expect(screen.getByText(hint)).toBeInTheDocument()

    screen.getByRole('button', { name: 'After' }).focus()
    await waitFor(() => expect(screen.queryByText(hint)).toBeNull())
  })

  it('credits the imagery on the globe', async () => {
    renderViewer()
    await globeOptions()
    expect(screen.getByText(/Imagery © Esri/)).toHaveTextContent(/Elevation: Mapzen/)
  })

  it('offers a view reset once ready', async () => {
    await renderReady()

    const reset = await screen.findByRole('button', { name: 'Reset view' })
    expect(screen.getByRole('figure')).toContainElement(
      screen.getByText('FIG. 01 — Field sites · 2 scans')
    )
    expect(screen.queryByText('Loading tiles…')).not.toBeInTheDocument()

    await userEvent.click(reset)
    expect(globe.resetView).toHaveBeenCalledOnce()
  })

  it('shows a status error reported by the scene', async () => {
    renderViewer()
    const { onStatus } = await globeOptions()

    act(() => onStatus({ kind: 'error', message: 'The globe could not be loaded.' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('The globe could not be loaded.')
  })

  it('shows an error when the globe fails to start', async () => {
    mockGlobe.mockImplementation(() => {
      throw new Error('no WebGL')
    })
    renderViewer()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The 3-D viewer could not start in this browser.'
    )
  })

  it('disposes the globe on unmount', async () => {
    const { unmount } = renderViewer()
    await globeOptions()
    unmount()
    expect(globe.dispose).toHaveBeenCalledOnce()
  })

  describe('full screen', () => {
    // jsdom has no Fullscreen API, so these stand in for the browser's.
    let fullscreenElement: Element | null = null
    const setFullscreenElement = (element: Element | null) => {
      fullscreenElement = element
      document.dispatchEvent(new Event('fullscreenchange'))
      return Promise.resolve()
    }
    const requestFullscreen = vi.fn(function (this: Element) {
      return setFullscreenElement(this)
    })
    const exitFullscreen = vi.fn(() => setFullscreenElement(null))

    beforeEach(() => {
      fullscreenElement = null
      Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true })
      Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        get: () => fullscreenElement
      })
      Object.defineProperty(document, 'exitFullscreen', {
        configurable: true,
        value: exitFullscreen
      })
      Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
        configurable: true,
        value: requestFullscreen
      })
    })

    afterEach(() => {
      for (const key of ['fullscreenEnabled', 'fullscreenElement', 'exitFullscreen'] as const) {
        Reflect.deleteProperty(document, key)
      }
      Reflect.deleteProperty(HTMLElement.prototype, 'requestFullscreen')
    })

    it('enters and exits full screen on the viewer, keeping a reset inside it', async () => {
      const user = userEvent.setup()
      await renderReady()

      await user.click(await screen.findByRole('button', { name: 'Full screen' }))
      expect(requestFullscreen).toHaveBeenCalledOnce()
      const exit = await screen.findByRole('button', { name: 'Exit full screen' })
      // The full-screen element is the viewer box, and both controls sit inside it.
      expect(fullscreenElement).toContainElement(exit)
      const resets = screen.getAllByRole('button', { name: 'Reset view' })
      expect(resets.some((reset) => fullscreenElement?.contains(reset))).toBe(true)

      await user.click(exit)
      expect(exitFullscreen).toHaveBeenCalledOnce()
      expect(await screen.findByRole('button', { name: 'Full screen' })).toBeInTheDocument()
    })

    it('keeps Back inside the viewer in full screen', async () => {
      const user = userEvent.setup()
      await renderReady()
      await user.click(screen.getByRole('button', { name: 'Open Outdoor scene, Coast' }))
      await user.click(await screen.findByRole('button', { name: 'Full screen' }))

      expect(fullscreenElement).toContainElement(
        screen.getByRole('button', { name: 'Back to globe' })
      )
    })

    it('follows a full-screen exit made outside the button, such as Esc', async () => {
      const user = userEvent.setup()
      await renderReady()
      await user.click(await screen.findByRole('button', { name: 'Full screen' }))
      await screen.findByRole('button', { name: 'Exit full screen' })

      await act(() => setFullscreenElement(null))

      expect(await screen.findByRole('button', { name: 'Full screen' })).toBeInTheDocument()
    })

    it('hides the control where the browser cannot go full screen', async () => {
      Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: false })
      await renderReady()
      await screen.findByRole('button', { name: 'Reset view' })
      expect(screen.queryByRole('button', { name: 'Full screen' })).not.toBeInTheDocument()
    })
  })
})
