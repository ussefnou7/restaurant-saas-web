import type { HTMLAttributes, ReactNode } from 'react'

export interface DocumentLinesCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title: ReactNode
  actions?: ReactNode
  children: ReactNode
}

export function DocumentLinesCard({
  title,
  actions,
  children,
  className,
  ...props
}: DocumentLinesCardProps) {
  return (
    <section
      className={`pi-form-lines-card${className ? ` ${className}` : ''}`}
      {...props}
    >
      <div className="pi-form-lines__header">
        <h2 className="pi-form-lines__title">{title}</h2>
        {actions}
      </div>

      {children}
    </section>
  )
}
