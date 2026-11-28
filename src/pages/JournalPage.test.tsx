import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, vi } from 'vitest'
import { createGlobeScene } from '@/components/viewer/createGlobeScene'
import type { GlobePin } from '@/components/viewer/createGlobeScene'
import { createSplatScene } from '@/components/viewer/createSplatScene'
import { JournalPage } from './JournalPage'
import { JOURNAL_TILESETS } from './journalTilesets'

// jsdom has no GPU, so the three.js engines are replaced.
vi.mock('@/components/viewer/createGlobeScene', () => ({ createGlobeScene: vi.fn() }))
vi.mock('@/components/viewer/createSplatScene', () => ({ createSplatScene: vi.fn() }))

vi.mock('./journalTilesets', async () => {
  const { SplatTileset } = await import('@/components/viewer/SplatTileset')
  const camera = { position: [1, 2, 3], lookAt: [0, 0, 0] } as const
  return {
    JOURNAL_TILESETS: [
      new SplatTileset({
        url: 'https://example.com/first/tileset.json',
        title: 'First scene',
        description: 'The first description.',
        date: '2026-01-01',
        location: 'First site',
        latitude: 38.7,
        longitude: -9.1,
        camera,
        globe: false
      }),
      new SplatTileset({
        url: 'https://example.com/second/tileset.json',
        title: 'Second scene',
        description: 'The second description.',
        date: '2026-01-02',
        location: 'Second site',
        latitude: 35.1,
        longitude: 24.6,
        camera,
        globe: true
      })
    ]
  }
})

const mockGlobe = vi.mocked(createGlobeScene)
const mockScene = vi.mocked(createSplatScene)
const flyTo = vi.fn()

describe('JournalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGlobe.mockReturnValue({
      setPins: (pins: readonly GlobePin[]) => {
        for (const { element } of pins) element.dataset.placed = ''
      },
      flyTo,
      flyHome: vi.fn(),
      resetView: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      getDebugInfo: vi.fn(),
      dispose: vi.fn()
    })
    mockScene.mockResolvedValue({ resetView: vi.fn(), getDebugInfo: vi.fn(), dispose: vi.fn() })
  })

  it('opens on the globe with a pin for every scan', async () => {
    render(<JournalPage />)

    expect(screen.queryByRole('combobox')).toBeNull()
    expect(
      await screen.findByRole('button', { name: 'Open First scene, First site' })
    ).toBeVisible()
    expect(screen.getByRole('button', { name: 'Open Second scene, Second site' })).toBeVisible()
    expect(screen.getByText(/Each pin marks a scan/)).toBeInTheDocument()
  })

  it('describes the scan whose pin was chosen, until going back', async () => {
    const user = userEvent.setup()
    render(<JournalPage />)

    await user.click(await screen.findByRole('button', { name: 'Open Second scene, Second site' }))
    expect(screen.getByText('The second description.')).toBeInTheDocument()
    expect(flyTo).toHaveBeenCalledWith(JOURNAL_TILESETS[1])

    await user.click(screen.getByRole('button', { name: 'Back to globe' }))
    await user.click(await screen.findByRole('button', { name: 'Open First scene, First site' }))
    expect(screen.getByText('The first description.')).toBeInTheDocument()
    expect(screen.queryByText('The second description.')).not.toBeInTheDocument()
    await waitFor(() =>
      expect(mockScene).toHaveBeenCalledWith(
        expect.objectContaining({ tileset: JOURNAL_TILESETS[0] })
      )
    )
  })
})
