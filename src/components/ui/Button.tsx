import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'text'

export interface ButtonLinkProps {
  to: string
  children: ReactNode
  /** At most one primary per section (DESIGN.md §6). `text` has no box: no border or background. */
  variant?: ButtonVariant
  className?: string
}

export function ButtonLink({ to, children, variant = 'secondary', className }: ButtonLinkProps) {
  return (
    <Link to={to} className={[styles.button, styles[variant], className].filter(Boolean).join(' ')}>
      {children}
    </Link>
  )
}

export interface ButtonAnchorProps extends Omit<ButtonLinkProps, 'to'> {
  /** An address outside the app, such as a mailto: or https: URL. */
  href: string
}

export function ButtonAnchor({
  href,
  children,
  variant = 'secondary',
  className
}: ButtonAnchorProps) {
  return (
    <a
      href={href}
      className={[styles.button, styles[variant], className].filter(Boolean).join(' ')}
    >
      {children}
    </a>
  )
}
