import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { renderWithRouter } from '@/test/helpers'
import { SiteLayout } from './SiteLayout'

describe('SiteLayout', () => {
  it('renders the nav and the routed page inside main', () => {
    renderWithRouter(
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/resume" element={<p>child page</p>} />
        </Route>
      </Routes>,
      { route: '/resume' }
    )
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveTextContent('child page')
  })
})
