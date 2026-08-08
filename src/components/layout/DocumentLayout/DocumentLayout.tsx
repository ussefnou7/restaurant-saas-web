import type { ReactNode } from 'react'

interface DocumentLayoutProps {
  loading?: boolean
  error?: string
  loadingMessage?: string
  children: ReactNode
}

export function DocumentLayout({
  loading = false,
  error = '',
  loadingMessage,
  children,
}: DocumentLayoutProps) {
  if (loading) {
    return (
      <div className="page-loading" role="status">
        <div className="spinner" />
        <span>{loadingMessage ?? 'جاري التحميل...'}</span>
      </div>
    )
  }

  return (
    <div className="pi-form-wrapper" dir="rtl">
      {error ? (
        <div className="form-error" role="alert">
          {error}
        </div>
      ) : null}
      {children}
    </div>
  )
}
