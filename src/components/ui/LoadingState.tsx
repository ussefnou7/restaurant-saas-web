interface LoadingStateProps {
  message: string
}

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <div className="list-state list-state--loading" role="status" aria-live="polite">
      <span className="list-state__spinner" aria-hidden="true" />
      <p className="list-state__text">{message}</p>
    </div>
  )
}
