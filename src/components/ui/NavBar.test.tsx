import { screen } from '@testing-library/react'
import { renderWithRouter } from '@/test/helpers'
import { NavBar } from './NavBar'

describe('NavBar', () => {
  it('links home and to every section', () => {
    renderWithRouter(<NavBar />)
    expect(screen.getByRole('link', { name: 'James A. Fisher' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: '3-D Journal' })).toHaveAttribute('href', '/journal')
    expect(screen.getByRole('link', { name: 'Contact Me' })).toHaveAttribute('href', '/contact')
  })

  it('marks only the current page and circles it', () => {
    renderWithRouter(<NavBar />, { route: '/journal' })
    const current = screen.getByRole('link', { name: '3-D Journal' })
    expect(current).toHaveAttribute('aria-current', 'page')
    for (const name of ['Home', 'Contact Me']) {
      expect(screen.getByRole('link', { name })).not.toHaveAttribute('aria-current')
    }
    expect(screen.getAllByTestId('sketch-circle')).toHaveLength(1)
    expect(current).toContainElement(screen.getByTestId('sketch-circle'))
  })
})
