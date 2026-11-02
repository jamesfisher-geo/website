import { Outlet } from 'react-router-dom'
import { NavBar } from '@/components/ui/NavBar'
import styles from './SiteLayout.module.css'

export function SiteLayout() {
  return (
    <>
      <NavBar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </>
  )
}
