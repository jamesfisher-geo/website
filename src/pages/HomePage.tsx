import { ButtonLink } from '@/components/ui/Button'
import styles from './HomePage.module.css'

/** Faint topographic texture for the hero (DESIGN.md §8). Decorative only. */
function ContourTexture() {
  return (
    <svg
      className={styles.contours}
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <g>
        <path d="M-20 420 C 120 360, 210 470, 360 410 S 600 300, 820 360" />
        <path d="M-20 380 C 130 320, 220 420, 370 370 S 590 260, 820 320" />
        <path d="M-20 340 C 140 285, 240 375, 380 330 S 580 225, 820 285" />
        <path d="M-20 300 C 150 250, 250 330, 395 292 S 575 195, 820 250" />
        <path d="M-20 520 C 110 470, 230 560, 380 505 S 610 410, 820 455" />
        <path d="M-20 565 C 100 520, 240 600, 390 548 S 620 460, 820 500" />
        <path d="M520 150 C 560 110, 650 112, 680 150 S 650 220, 590 214 S 490 190, 520 150 Z" />
        <path d="M545 155 C 572 128, 630 130, 650 156 S 630 196, 592 192 S 525 178, 545 155 Z" />
        <path d="M120 120 C 160 80, 260 92, 270 135 S 210 200, 160 186 S 90 160, 120 120 Z" />
      </g>
    </svg>
  )
}

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
