import { screen } from '@testing-library/react'
import { renderWithRouter } from '@/test/helpers'
import { NavBar } from './NavBar'

describe('NavBar', () => {
  it('links home and to every section', () => {
    renderWithRouter(<NavBar />)
    expect(screen.getByRole('link', { name: 'James A. Fisher' })).toHaveAttribute('href', '/')
    for (const name of ['3-D Journal', 'Resume', 'Contact Me']) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument()
    }
  })

  it('marks only the current page and circles it', () => {
    renderWithRouter(<NavBar />, { route: '/resume' })
    const current = screen.getByRole('link', { name: 'Resume' })
    expect(current).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Contact Me' })).not.toHaveAttribute('aria-current')
    expect(screen.getAllByTestId('sketch-circle')).toHaveLength(1)
    expect(current).toContainElement(screen.getByTestId('sketch-circle'))
  })
})
