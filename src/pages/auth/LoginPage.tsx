import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useTranslation } from '../../i18n/useTranslation'
import { Logo } from '../../components/ui/Logo'
import { authService } from '../../services/authService'
import { getApiErrorDetails, translateApiError } from '../../utils/errors'
import {
  clearStoredLock,
  formatCountdown,
  getStoredLockRemainingSeconds,
  LOGIN_LOCK_UNTIL_KEY,
  storeLockEndTime,
} from '../../utils/loginLock'

export function LoginPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [tenantCode, setTenantCode] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(() => getStoredLockRemainingSeconds())
  const [error, setError] = useState(() => {
    return getStoredLockRemainingSeconds() > 0 ? t('errors.LOGIN_TEMPORARILY_LOCKED') : ''
  })

  const isLocked = remainingSeconds > 0

  useEffect(() => {
    if (!isLocked) return

    const timer = window.setInterval(() => {
      const stored = localStorage.getItem(LOGIN_LOCK_UNTIL_KEY)
      if (!stored) {
        setRemainingSeconds(0)
        return
      }

      const endTime = Number(stored)
      const diff = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
      setRemainingSeconds(diff)

      if (diff <= 0) {
        clearStoredLock()
        setError((prev) => (prev === t('errors.LOGIN_TEMPORARILY_LOCKED') ? '' : prev))
      }
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [isLocked, t])

  useEffect(() => {
    if (remainingSeconds > 0 && !error) {
      setError(t('errors.LOGIN_TEMPORARILY_LOCKED'))
    }
  }, [remainingSeconds, error, t])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (remainingSeconds > 0) return

    setError('')
    setSubmitting(true)
    try {
      const response = await authService.login({ tenantCode, username, password })
      clearStoredLock()
      authService.saveAuthData(response, tenantCode)
      navigate('/dashboard')
    } catch (err) {
      const errorDetails = getApiErrorDetails(err)
      const is429 = axios.isAxiosError(err) && err.response?.status === 429
      const isLocked = errorDetails.errorCode === 'LOGIN_TEMPORARILY_LOCKED' || is429

      if (isLocked) {
        const rawSeconds =
          errorDetails.params?.retryAfterSeconds ??
          (axios.isAxiosError(err) ? err.response?.data?.params?.retryAfterSeconds : undefined)
        const seconds =
          typeof rawSeconds === 'number'
            ? rawSeconds
            : Number(rawSeconds) || 300

        storeLockEndTime(seconds)
        setRemainingSeconds(seconds)
      }

      setError(translateApiError(err, t).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="card login-card">
        <div className="login-logo-wrap">
          <Logo variant="horizontal" size="xl" ariaLabel={t('auth.login.title')} />
        </div>
        <p className="page-description login-subtitle">{t('auth.login.subtitle')}</p>
        <form className="form" onSubmit={handleSubmit}>
          {error ? (
            <div className="form-error login-lock-banner" role="alert">
              <p>{error}</p>
              {remainingSeconds > 0 ? (
                <p className="login-countdown-text">
                  <span>{t('auth.login.remainingTime')}: </span>
                  <strong className="login-countdown-digits" dir="ltr">
                    {formatCountdown(remainingSeconds)}
                  </strong>
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="form-row">
            <label htmlFor="tenantCode">{t('auth.login.tenantCode')}</label>
            <input
              id="tenantCode"
              type="text"
              value={tenantCode}
              onChange={(e) => setTenantCode(e.target.value)}
              placeholder={t('auth.login.tenantCodePlaceholder')}
              autoComplete="organization"
              required
              disabled={submitting}
            />
          </div>
          <div className="form-row">
            <label htmlFor="username">{t('auth.login.username')}</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('auth.login.usernamePlaceholder')}
              autoComplete="username"
              required
              disabled={submitting}
            />
          </div>
          <div className="form-row">
            <label htmlFor="password">{t('auth.login.password')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              disabled={submitting}
            />
          </div>
          <div className="form-actions">
            <button
              type="submit"
              className="button-primary"
              disabled={submitting || remainingSeconds > 0}
            >
              {submitting ? t('auth.login.submitting') : t('auth.login.screenTitle')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
