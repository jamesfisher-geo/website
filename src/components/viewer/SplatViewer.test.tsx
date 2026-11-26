import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, vi } from 'vitest'
import { createSplatScene } from './createSplatScene'
import type { SplatSceneHandle, SplatSceneOptions } from './createSplatScene'
import { SplatTileset } from './SplatTileset'
import { SplatViewer } from './SplatViewer'

// jsdom has no GPU, so the three.js engine is replaced and only the React shell is tested.
vi.mock('./createSplatScene', () => ({ createSplatScene: vi.fn() }))

const mockCreate = vi.mocked(createSplatScene)
const resetView = vi.fn()
const dispose = vi.fn()
const getDebugInfo = vi.fn(() => ({
  position: [2.5, 1, 5] as const,
  lookAt: [0, 0, 0] as const,
  headingDeg: 10,
  pitchDeg: -5,
  loadProgress: 1,
  tiles: { visible: 12, active: 14, loaded: 30, queued: 0, downloading: 0, parsing: 0, failed: 0 }
}))

const tileset = new SplatTileset({
  url: 'https://example.com/tileset.json',
  title: 'Test scene',
  description: 'A scene for tests.',
  date: '2026-01-01',
  location: 'Test site',
  camera: { position: [1, 2, 3], lookAt: [0, 0, 0] },
  globe: false
})

function renderViewer() {
  return render(<SplatViewer tileset={tileset} caption="FIG. 01 — Test scene" />)
}

async function startedOptions(): Promise<SplatSceneOptions> {
  await waitFor(() => expect(mockCreate).toHaveBeenCalled())
  const options = mockCreate.mock.calls[0]?.[0]
  if (!options) throw new Error('createSplatScene was not called')
  return options
}

describe('SplatViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockCreate.mockResolvedValue({ resetView, getDebugInfo, dispose })
  })

  it('toggles the debug panel with the i key', async () => {
    const user = userEvent.setup()
    renderViewer()
    await startedOptions()
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
        <select aria-label="Scene">
          <option>One</option>
        </select>
        <SplatViewer tileset={tileset} caption="FIG. 01 — Test scene" />
      </>
    )

    await user.keyboard('{Control>}i{/Control}')
    expect(screen.queryByRole('complementary', { name: 'Viewer debug info' })).toBeNull()

    screen.getByRole('combobox', { name: 'Scene' }).focus()
    await user.keyboard('i')
    expect(screen.queryByRole('complementary', { name: 'Viewer debug info' })).toBeNull()
  })

  it('shows the loading note until tiles are ready', () => {
    renderViewer()
    expect(screen.getByText('Loading tiles…')).toBeInTheDocument()
  })

  it('shows the keyboard controls while the scene has focus', async () => {
    mockCreate.mockImplementation(async ({ container }) => {
      const canvas = document.createElement('canvas')
      canvas.tabIndex = 0
      container.appendChild(canvas)
      return { resetView, getDebugInfo, dispose }
    })
    const user = userEvent.setup()
    renderViewer()
    await startedOptions()
    const hint = /W A S D move/
    expect(screen.queryByText(hint)).toBeNull()

    await user.tab()
    expect(screen.getByText(hint)).toBeInTheDocument()

    await user.tab()
    expect(screen.queryByText(hint)).toBeNull()
  })

  it('leaves out the imagery credit for scenes not on a globe', async () => {
    renderViewer()
    await startedOptions()
    expect(screen.queryByText(/Imagery © Esri/)).toBeNull()
  })

  it('credits the imagery for globe scenes', async () => {
    const globeTileset = new SplatTileset({ ...tileset, globe: true })
    render(<SplatViewer tileset={globeTileset} caption="FIG. 01 — Test scene" />)
    await startedOptions()
    expect(screen.getByText(/Imagery © Esri/)).toHaveTextContent(/Elevation: Mapzen/)
  })

  it('passes the tileset to the scene', async () => {
    renderViewer()
    const options = await startedOptions()
    expect(options.tileset).toBe(tileset)
  })

  it('offers a view reset once ready', async () => {
    renderViewer()
    const { onStatus } = await startedOptions()
    await waitFor(() => expect(mockCreate.mock.results[0]?.type).toBe('return'))
    await mockCreate.mock.results[0]?.value

    onStatus({ kind: 'ready' })

    const reset = await screen.findByRole('button', { name: 'Reset view' })
    expect(screen.getByRole('figure')).toContainElement(screen.getByText('FIG. 01 — Test scene'))
    expect(screen.queryByText('Loading tiles…')).not.toBeInTheDocument()

    await userEvent.click(reset)
    expect(resetView).toHaveBeenCalledOnce()
  })

  it('shows a status error reported by the scene', async () => {
    renderViewer()
    const { onStatus } = await startedOptions()

    onStatus({ kind: 'error', message: 'This scene could not be loaded.' })

    expect(await screen.findByRole('alert')).toHaveTextContent('This scene could not be loaded.')
  })

  it('shows an error when the scene fails to start', async () => {
    mockCreate.mockRejectedValue(new Error('no GPU'))
    renderViewer()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The 3-D viewer could not start in this browser.'
    )
  })

  it('disposes the scene on unmount', async () => {
    const { unmount } = renderViewer()
    await startedOptions()
    unmount()
    await waitFor(() => expect(dispose).toHaveBeenCalledOnce())
  })

  it('disposes a scene that finishes starting after unmount', async () => {
    let finish: (handle: SplatSceneHandle) => void = () => {}
    mockCreate.mockReturnValue(new Promise((resolve) => (finish = resolve)))

    const { unmount } = renderViewer()
    await startedOptions()
    unmount()
    expect(dispose).not.toHaveBeenCalled()

    finish({ resetView, getDebugInfo, dispose })
    await waitFor(() => expect(dispose).toHaveBeenCalledOnce())
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

    async function renderReady() {
      renderViewer()
      const { onStatus } = await startedOptions()
      await waitFor(() => expect(mockCreate.mock.results[0]?.type).toBe('return'))
      await mockCreate.mock.results[0]?.value
      onStatus({ kind: 'ready' })
      return screen.findByRole('button', { name: 'Full screen' })
    }

    it('enters and exits full screen on the viewer, keeping a reset inside it', async () => {
      const user = userEvent.setup()
      const enter = await renderReady()

      await user.click(enter)
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

    it('follows a full-screen exit made outside the button, such as Esc', async () => {
      const user = userEvent.setup()
      await user.click(await renderReady())
      await screen.findByRole('button', { name: 'Exit full screen' })

      await setFullscreenElement(null)

      expect(await screen.findByRole('button', { name: 'Full screen' })).toBeInTheDocument()
    })

    it('hides the control where the browser cannot go full screen', async () => {
      Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: false })
      renderViewer()
      const { onStatus } = await startedOptions()
      onStatus({ kind: 'ready' })
      await screen.findByRole('button', { name: 'Reset view' })
      expect(screen.queryByRole('button', { name: 'Full screen' })).not.toBeInTheDocument()
    })
  })
})
