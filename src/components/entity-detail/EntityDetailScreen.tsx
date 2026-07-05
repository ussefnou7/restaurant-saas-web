import type { ReactNode } from 'react'
import { LoadingState } from '../ui/LoadingState'
import { EntityDetailLayout } from './EntityDetailLayout'

export interface EntityDetailScreenProps {
  backTo: string
  backLabel: string
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
      <EntityDetailLayout backTo={backTo} backLabel={backLabel} title={notFoundTitle}>
        <p className="entity-detail-page__not-found">{notFoundMessage}</p>
      </EntityDetailLayout>
    )
  }

  return (
    <EntityDetailLayout
      className="entity-detail-page--standard"
      backTo={backTo}
      backLabel={backLabel}
      hideHeader
    >
      {error ? <div className="page-error-banner">{error}</div> : null}

      {overview ? <section className="entity-detail-screen__overview">{overview}</section> : null}

      {modules ? <div className="entity-detail-screen__modules">{modules}</div> : null}

      {children}
    </EntityDetailLayout>
  )
}
