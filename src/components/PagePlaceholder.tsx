import { Button } from './ui/Button'
import { PageHeader } from './ui/PageHeader'

interface PagePlaceholderProps {
  title: string
  subtitle: string
  message: string
  actionLabel?: string
}

export function PagePlaceholder({ title, subtitle, message, actionLabel }: PagePlaceholderProps) {
  return (
    <div className="page">
      <PageHeader
        title={title}
        description={subtitle}
        action={
          actionLabel ? (
            <Button variant="primary" className="page-header-action">
              {actionLabel}
            </Button>
          ) : undefined
        }
      />
      <div className="card list-page-card">
        <div className="list-card-body">
          <p className="empty-state-text">{message}</p>
        </div>
      </div>
    </div>
  )
}
