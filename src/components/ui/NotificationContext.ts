import { createContext, useContext } from 'react'

export type NotificationVariant = 'success' | 'error' | 'warning' | 'info'

export type NotificationItem = {
  id: number
  message: string
  variant: NotificationVariant
}

export type NotifyApi = {
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
  info: (message: string) => void
}

export const NotificationContext = createContext<NotifyApi | null>(null)

export function useNotify(): NotifyApi {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotify must be used within NotificationProvider')
  }
  return context
}
