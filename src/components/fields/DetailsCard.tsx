import type { ReactNode } from 'react'

export interface DetailsCardProps {
  title?: ReactNode
  headExtra?: ReactNode
  actions?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
}

export function DetailsCard({
  title,
  headExtra,
  actions,
  footer,
  children,
  className,
}: DetailsCardProps) {
  const showHead = title || headExtra || actions

  return (
    <div className={`details-card${className ? ` ${className}` : ''}`}>
      {showHead ? (
        <div className="details-card__head">
          <div className="details-card__head-main">
            {title ? <h2 className="details-card__title">{title}</h2> : null}
            {headExtra}
          </div>
          {actions ? <div className="details-card__head-actions">{actions}</div> : null}
        </div>
      ) : null}
      {children}
      {footer}
    </div>
  )
}

/** Alias for modal/form containers using the same shell. */
export const FormCard = DetailsCard
