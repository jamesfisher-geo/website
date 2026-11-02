import { screen } from '@testing-library/react'
import { renderWithRouter } from '@/test/helpers'
import { ButtonLink } from './Button'

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
