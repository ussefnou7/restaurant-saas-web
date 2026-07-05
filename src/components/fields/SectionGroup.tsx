import type { ReactNode } from 'react'

export interface SectionGroupProps {
  title: string
  subtitle?: string
  divider?: boolean
  children: ReactNode
  className?: string
}

export function SectionGroup({
  title,
  subtitle,
  divider = true,
  children,
  className,
}: SectionGroupProps) {
  return (
    <div className={`section-group${divider ? '' : ' section-group--plain'}${className ? ` ${className}` : ''}`}>
      <h3 className="section-group__title">{title}</h3>
      {subtitle ? <p className="section-group__subtitle">{subtitle}</p> : null}
      {children}
    </div>
  )
}
