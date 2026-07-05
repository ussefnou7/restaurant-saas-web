import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  NotificationContext,
  type NotificationItem,
  type NotificationVariant,
  type NotifyApi,
} from './NotificationContext'

const AUTO_DISMISS_MS: Record<NotificationVariant, number | null> = {
  success: 4500,
  info: 4500,
  warning: 7000,
  // Errors stay until the user dismisses them (or an identical one replaces them).
  error: null,
}

const MAX_STACK = 5

let notificationId = 0

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<NotificationItem[]>([])
  const timersRef = useRef(new Map<number, number>())

  const dismiss = useCallback((id: number) => {
    const timer = timersRef.current.get(id)
    if (timer !== undefined) {
      window.clearTimeout(timer)
      timersRef.current.delete(id)
    }
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const push = useCallback(
    (message: string, variant: NotificationVariant) => {
      const id = ++notificationId
      setItems((current) => {
        // Replace an identical visible notification instead of duplicating it.
        const next = current.filter(
          (item) => !(item.message === message && item.variant === variant),
        )
        return [...next, { id, message, variant }].slice(-MAX_STACK)
      })
      const duration = AUTO_DISMISS_MS[variant]
      if (duration !== null) {
        timersRef.current.set(id, window.setTimeout(() => dismiss(id), duration))
      }
    },
    [dismiss],
  )

  const value = useMemo<NotifyApi>(
    () => ({
      success: (message: string) => push(message, 'success'),
      error: (message: string) => push(message, 'error'),
      warning: (message: string) => push(message, 'warning'),
      info: (message: string) => push(message, 'info'),
    }),
    [push],
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-relevant="additions">
        {items.map((item) => (
          <div
            key={item.id}
            className={`toast toast--${item.variant}`}
            role={item.variant === 'error' ? 'alert' : 'status'}
          >
            <span className="toast__message">{item.message}</span>
            <button
              type="button"
              className="toast__close"
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}
