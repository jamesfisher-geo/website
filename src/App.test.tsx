import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '@/test/helpers'
import { App } from './App'

describe('App routing', () => {
  it('shows the landing page at /', () => {
    renderWithRouter(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'James A. Fisher' })).toBeInTheDocument()
  })

  it('navigates from the landing page to the contact page', async () => {
    const user = userEvent.setup()
    renderWithRouter(<App />)
    await user.click(screen.getByRole('link', { name: 'Contact Me' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Contact me' })).toBeInTheDocument()
  })

  it('still serves the resume page directly', () => {
    renderWithRouter(<App />, { route: '/resume' })
    expect(screen.getByRole('heading', { level: 1, name: 'Resume' })).toBeInTheDocument()
  })

  it('shows a not-found page for unknown routes', () => {
    renderWithRouter(<App />, { route: '/nowhere' })
    expect(screen.getByRole('heading', { level: 1, name: /isn’t on the map/ })).toBeInTheDocument()
  })
})
