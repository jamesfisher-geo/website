import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, vi } from 'vitest'
import { createSplatScene } from '@/components/viewer/createSplatScene'
import { JournalPage } from './JournalPage'
import { JOURNAL_TILESETS } from './journalTilesets'

// jsdom has no GPU, so the three.js engine is replaced.
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
        camera
      }),
      // Shares the first URL on purpose: entries are told apart by position, not URL.
      new SplatTileset({
        url: 'https://example.com/first/tileset.json',
        title: 'Second scene',
        description: 'The second description.',
        camera
      })
    ]
  }
})

const mockCreate = vi.mocked(createSplatScene)
const dispose = vi.fn()

describe('JournalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreate.mockResolvedValue({ resetView: vi.fn(), getDebugInfo: vi.fn(), dispose })
  })

  it('offers every tileset and loads the first by default', async () => {
    render(<JournalPage />)

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'First scene',
      'Second scene'
    ])
    expect(screen.getByRole('combobox', { name: 'Scene' })).toHaveDisplayValue('First scene')
    expect(screen.getByText('The first description.')).toBeInTheDocument()
    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ tileset: JOURNAL_TILESETS[0] })
      )
    )
  })

  it('loads the selected tileset and disposes the previous scene', async () => {
    render(<JournalPage />)
    await waitFor(() => expect(mockCreate).toHaveBeenCalledOnce())
    await mockCreate.mock.results[0]?.value

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Scene' }), 'Second scene')

    expect(screen.getByRole('combobox', { name: 'Scene' })).toHaveDisplayValue('Second scene')
    expect(screen.getByText('The second description.')).toBeInTheDocument()
    expect(screen.queryByText('The first description.')).not.toBeInTheDocument()
    expect(screen.getByText(/Second scene · 3DGS/)).toBeInTheDocument()
    await waitFor(() =>
      expect(mockCreate).toHaveBeenLastCalledWith(
        expect.objectContaining({ tileset: JOURNAL_TILESETS[1] })
      )
    )
    await waitFor(() => expect(dispose).toHaveBeenCalledOnce())
  })
})
