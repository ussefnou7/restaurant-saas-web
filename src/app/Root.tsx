import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useNotify } from '../components/ui/NotificationContext'
import { NotificationProvider } from '../components/ui/Notifications'
import { useTranslation } from '../i18n/useTranslation'
import { setApiErrorNotifier } from '../services/api'
import { translateApiError } from '../utils/errors'

/** Bridges the axios error interceptor to the notification system + i18n. */
function ApiErrorNotifierBridge() {
  const { t } = useTranslation()
  const notify = useNotify()

  useEffect(() => {
    setApiErrorNotifier((error) => {
      notify.error(translateApiError(error, t).message)
    })
    return () => setApiErrorNotifier(null)
  }, [t, notify])

  return null
}

export function Root() {
  return (
    <NotificationProvider>
      <ApiErrorNotifierBridge />
      <Outlet />
    </NotificationProvider>
  )
}
