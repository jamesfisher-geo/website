import { render, screen } from '@testing-library/react'
import { renderWithRouter } from '@/test/helpers'
import { ButtonAnchor, ButtonLink } from './Button'

describe('ButtonAnchor', () => {
  it('renders a secondary button linking to the given address', () => {
    render(<ButtonAnchor href="mailto:you@example.com">Email</ButtonAnchor>)
    const link = screen.getByRole('link', { name: 'Email' })
    expect(link).toHaveAttribute('href', 'mailto:you@example.com')
    expect(link).toHaveClass('secondary')
  })
})

describe('ButtonLink', () => {
  it('renders a link to the given route', () => {
    renderWithRouter(<ButtonLink to="/resume">Resume</ButtonLink>)
    expect(screen.getByRole('link', { name: 'Resume' })).toHaveAttribute('href', '/resume')
  })

  it('applies the requested variant', () => {
    renderWithRouter(
      <ButtonLink to="/journal" variant="primary">
        3-D Journal
      </ButtonLink>
    )
    expect(screen.getByRole('link', { name: '3-D Journal' })).toHaveClass('primary')
  })
})
