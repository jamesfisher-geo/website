import type { ReactNode } from 'react'
import styles from './PlaceholderPage.module.css'

export interface PlaceholderPageProps {
  /** Mono eyebrow, e.g. "01 / 3-D Journal". */
  eyebrow: string
  title: string
  children?: ReactNode
}

export function PlaceholderPage({ eyebrow, title, children }: PlaceholderPageProps) {
  return (
    <section className={styles.page}>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.body}>{children}</div>
    </section>
  )
}
