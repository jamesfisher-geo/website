import { ContourTexture } from '@/components/sketch/ContourTexture'
import { ButtonAnchor } from '@/components/ui/Button'
import styles from './ContactPage.module.css'

/** Placeholder addresses: swap in the real ones. */
const CONTACT_LINKS = [
  { label: 'GitHub', href: 'https://github.com/jamesfisher-geo' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/james-fisher' },
  { label: 'Email', href: 'mailto:jafisher32@gmail.com' }
] as const

export function ContactPage() {
  return (
    <>
      <div className={styles.backdrop}>
        <ContourTexture />
      </div>
      <section className={styles.page}>
        <p className="eyebrow">N 40.65° · W 73.96°</p>
        <h1>James A. Fisher</h1>
        <p className={styles.subtitle}>Contact me through any of the following platforms</p>
        <nav aria-label="Contact links" className={styles.actions}>
          <ul className={styles.links}>
            {CONTACT_LINKS.map(({ label, href }) => (
              <li key={label}>
                <ButtonAnchor href={href}>{label}</ButtonAnchor>
              </li>
            ))}
          </ul>
        </nav>
      </section>
    </>
  )
}
