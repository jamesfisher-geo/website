import { screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { renderWithRouter } from '@/test/helpers'
import { ContactPage } from './ContactPage'
import { JournalPage } from './JournalPage'
import { NotFoundPage } from './NotFoundPage'
import { ResumePage } from './ResumePage'

const cases: [string, ReactElement, string][] = [
  ['JournalPage', <JournalPage />, '3-D Journal'],
  ['ResumePage', <ResumePage />, 'Resume'],
  ['ContactPage', <ContactPage />, 'Contact me'],
  ['NotFoundPage', <NotFoundPage />, 'This page isn’t on the map']
]

describe.each(cases)('%s', (_name, element, heading) => {
  it('renders its heading', () => {
    renderWithRouter(element)
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
  })
})
