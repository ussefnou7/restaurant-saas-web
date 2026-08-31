import type { ReactNode } from 'react'
import { LoadingState } from '../ui/LoadingState'
import { EntityDetailLayout } from './EntityDetailLayout'

export interface EntityDetailScreenProps {
  title?: ReactNode
  subtitle?: ReactNode
  badge?: ReactNode
  actions?: ReactNode
  backTo?: string
  backLabel?: string
  loading?: boolean
  loadingMessage?: string
  notFound?: boolean
  notFoundTitle?: string
  notFoundMessage?: string
  error?: string
  overview?: ReactNode
  modules?: ReactNode
  children?: ReactNode
}

export function EntityDetailScreen({
  title,
  subtitle,
  badge,
  actions,
  backTo,
  backLabel,
  loading = false,
  loadingMessage,
  notFound = false,
  notFoundTitle,
  notFoundMessage,
  error,
  overview,
  modules,
  children,
}: EntityDetailScreenProps) {
  if (loading) {
    return (
      <div className="entity-detail-page">
        <LoadingState message={loadingMessage ?? ''} />
      </div>
    )
  }

  if (notFound) {
    return (
      <EntityDetailLayout
        backTo={backTo}
        backLabel={backLabel}
        title={notFoundTitle}
      >
        <p className="entity-detail-page__not-found">{notFoundMessage}</p>
      </EntityDetailLayout>
    )
  }

  return (
    <EntityDetailLayout
      className="entity-detail-page--standard"
      title={title}
      subtitle={subtitle}
      badge={badge}
      actions={actions}
      backTo={backTo}
      backLabel={backLabel}
      hideHeader={!title}
      headerFields={overview}
    >
      {error ? <div className="page-error-banner">{error}</div> : null}

      {modules ? <div className="entity-detail-screen__modules">{modules}</div> : null}

      {children}
    </EntityDetailLayout>
  )
}
