import { render, screen } from '@testing-library/react'
import { ContactPage } from './ContactPage'

describe('ContactPage', () => {
  it('shows the name and the subtitle', () => {
    render(<ContactPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'James A. Fisher' })).toBeInTheDocument()
    expect(
      screen.getByText('Contact me through any of the following platforms')
    ).toBeInTheDocument()
  })

  it.each(['Email', 'GitHub', 'LinkedIn'])('links to %s', (name) => {
    render(<ContactPage />)
    expect(screen.getByRole('link', { name })).toHaveAttribute('href')
  })
})
