import { ContourTexture } from '@/components/sketch/ContourTexture'
import { ButtonLink } from '@/components/ui/Button'
import styles from './HomePage.module.css'

export function HomePage() {
  return (
    <main className={styles.hero}>
      <ContourTexture />
      <div className={styles.content}>
        <p className="eyebrow">N 40.65° · W 73.96°</p>
        <h1 className={styles.name}>James A. Fisher</h1>
        <nav aria-label="Sections" className={styles.actions}>
          <ButtonLink to="/journal" variant="text" className={styles.actionLink}>
            3-D Journal
          </ButtonLink>
          {/* <ButtonLink to="/resume" variant="text" className={styles.actionLink}>
            Resume
          </ButtonLink> */}
          <ButtonLink to="/contact" variant="text" className={styles.actionLink}>
            Contact Me
          </ButtonLink>
        </nav>
      </div>
    </main>
  )
}
