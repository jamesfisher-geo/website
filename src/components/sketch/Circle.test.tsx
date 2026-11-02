import { render, screen } from '@testing-library/react'
import { Circle } from './Circle'

describe('Circle', () => {
  it('renders a decorative svg hidden from assistive tech', () => {
    render(<Circle />)
    expect(screen.getByTestId('sketch-circle')).toHaveAttribute('aria-hidden', 'true')
  })

  it('draws a different loop for a different variant', () => {
    const { container, rerender } = render(<Circle variant={0} />)
    const first = container.querySelector('path')?.getAttribute('d')
    rerender(<Circle variant={1} />)
    expect(container.querySelector('path')?.getAttribute('d')).not.toBe(first)
  })
})
