import { Link, NavLink } from 'react-router-dom'
import { Circle } from '@/components/sketch/Circle'
import styles from './NavBar.module.css'

interface NavItem {
  to: string
  label: string
}

const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Home' },
  { to: '/journal', label: '3-D Journal' },
  // { to: '/resume', label: 'Resume' },
  { to: '/contact', label: 'Contact Me' }
]

export function NavBar() {
  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <Link to="/" className={styles.wordmark}>
          James A. Fisher
        </Link>
        <nav aria-label="Primary">
          <ul className={styles.links}>
            {NAV_ITEMS.map(({ to, label }, index) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    [styles.link, isActive ? styles.active : ''].filter(Boolean).join(' ')
                  }
                >
                  {({ isActive }) => (
                    <>
                      {label}
                      {isActive && <Circle variant={index} className={styles.circle} />}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}
