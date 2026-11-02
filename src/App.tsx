import { Route, Routes } from 'react-router-dom'
import { SiteLayout } from '@/components/layout/SiteLayout'
import { ContactPage } from '@/pages/ContactPage'
import { HomePage } from '@/pages/HomePage'
import { JournalPage } from '@/pages/JournalPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ResumePage } from '@/pages/ResumePage'

export function App() {
  return (
    <Routes>
      <Route index element={<HomePage />} />
      <Route element={<SiteLayout />}>
        <Route path="journal" element={<JournalPage />} />
        <Route path="resume" element={<ResumePage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
