import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, vi } from 'vitest'
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
  camera: { position: [1, 2, 3], lookAt: [0, 0, 0] }
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
})
