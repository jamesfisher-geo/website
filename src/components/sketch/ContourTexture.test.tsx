import { render, screen } from '@testing-library/react'
import { ContourTexture } from './ContourTexture'

describe('ContourTexture', () => {
  it('renders a decorative svg hidden from assistive tech', () => {
    const { container } = render(<ContourTexture />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('draws heavier index contours alongside the intermediate lines', () => {
    render(<ContourTexture />)
    expect(screen.getByTestId('index-contours').querySelectorAll('path').length).toBeGreaterThan(0)
  })
})
