import { screen } from '@testing-library/react'
import { renderWithRouter } from '@/test/helpers'
import { HomePage } from './HomePage'

describe('HomePage', () => {
  it('shows the name as the main heading', () => {
    renderWithRouter(<HomePage />)
    expect(screen.getByRole('heading', { level: 1, name: 'James A. Fisher' })).toBeInTheDocument()
  })

  it('links to the journal and contact pages', () => {
    renderWithRouter(<HomePage />)
    expect(screen.getByRole('link', { name: '3-D Journal' })).toHaveAttribute('href', '/journal')
    expect(screen.getByRole('link', { name: 'Contact Me' })).toHaveAttribute('href', '/contact')
  })
})
