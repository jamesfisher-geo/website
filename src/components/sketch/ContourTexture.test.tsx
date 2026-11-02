import { render } from '@testing-library/react'
import { ContourTexture } from './ContourTexture'

describe('ContourTexture', () => {
  it('renders a decorative svg hidden from assistive tech', () => {
    const { container } = render(<ContourTexture />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
