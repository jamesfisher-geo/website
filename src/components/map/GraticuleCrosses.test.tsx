import { render, screen } from '@testing-library/react'
import { GraticuleCrosses } from './GraticuleCrosses'

describe('GraticuleCrosses', () => {
  it('renders a decorative svg hidden from assistive tech', () => {
    render(<GraticuleCrosses />)
    expect(screen.getByTestId('graticule-crosses')).toHaveAttribute('aria-hidden', 'true')
  })

  it('places one cross at each interior grid intersection', () => {
    render(<GraticuleCrosses divisions={3} />)
    const crosses = screen.getByTestId('graticule-crosses').querySelectorAll('svg')
    expect([...crosses].map((c) => [c.getAttribute('x'), c.getAttribute('y')])).toEqual([
      ['33.333%', '33.333%'],
      ['33.333%', '66.667%'],
      ['66.667%', '33.333%'],
      ['66.667%', '66.667%']
    ])
  })
})
