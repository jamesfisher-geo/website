import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'

export interface RenderWithRouterOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Initial URL for the in-memory router. */
  route?: string
}

export function renderWithRouter(
  ui: ReactElement,
  { route = '/', ...options }: RenderWithRouterOptions = {}
) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>, options)
}
