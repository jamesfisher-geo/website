import { screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { vi } from 'vitest'
import { renderWithRouter } from '@/test/helpers'
import { ContactPage } from './ContactPage'
import { JournalPage } from './JournalPage'
import { NotFoundPage } from './NotFoundPage'
import { ResumePage } from './ResumePage'

// jsdom has no GPU, so the journal's viewer stays in its loading state.
vi.mock('@/components/viewer/createSplatScene', () => ({
  createSplatScene: vi.fn(() => new Promise(() => {}))
}))

const cases: [string, ReactElement, string][] = [
  ['JournalPage', <JournalPage />, '3-D Journal'],
  ['ResumePage', <ResumePage />, 'Resume'],
  ['ContactPage', <ContactPage />, 'James A. Fisher'],
  ['NotFoundPage', <NotFoundPage />, 'This page isn’t on the map']
]

describe.each(cases)('%s', (_name, element, heading) => {
  it('renders its heading', () => {
    renderWithRouter(element)
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
  })
})
