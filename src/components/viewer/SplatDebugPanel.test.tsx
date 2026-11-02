import { render, screen } from '@testing-library/react'
import type { SplatSceneDebugInfo } from './createSplatScene'
import { SplatDebugPanel } from './SplatDebugPanel'

const info: SplatSceneDebugInfo = {
  position: [2.5, 1, 5],
  lookAt: [0.6, -0.7, 0.4],
  headingDeg: 22.46,
  pitchDeg: -18.2,
  loadProgress: 0.5,
  tiles: { visible: 12, active: 14, loaded: 30, queued: 4, downloading: 3, parsing: 2, failed: 1 }
}

describe('SplatDebugPanel', () => {
  it('shows the camera in the format the tileset catalog uses', () => {
    render(<SplatDebugPanel getInfo={() => info} />)
    expect(screen.getByText('[2.50, 1.00, 5.00]')).toBeInTheDocument()
    expect(screen.getByText('[0.60, -0.70, 0.40]')).toBeInTheDocument()
    expect(screen.getByText('22.5°')).toBeInTheDocument()
    expect(screen.getByText('-18.2°')).toBeInTheDocument()
  })

  it('shows the tile counts', () => {
    render(<SplatDebugPanel getInfo={() => info} />)
    expect(screen.getByText('Visible').nextSibling).toHaveTextContent('12')
    expect(screen.getByText('Loaded').nextSibling).toHaveTextContent('30')
    expect(screen.getByText('Failed').nextSibling).toHaveTextContent('1')
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('shows a waiting note before the scene starts', () => {
    render(<SplatDebugPanel getInfo={() => null} />)
    expect(screen.getByText('Waiting for scene…')).toBeInTheDocument()
  })
})
