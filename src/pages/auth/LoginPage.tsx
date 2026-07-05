import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../i18n/useTranslation'
import { authService } from '../../services/authService'
import { translateApiError } from '../../utils/errors'

export function LoginPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [tenantCode, setTenantCode] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const response = await authService.login({ tenantCode, username, password })
      authService.saveAuthData(response, tenantCode)
      navigate('/dashboard')
    } catch (err) {
      setError(translateApiError(err, t).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="card login-card">
        <h1 className="login-title">Restaurant App</h1>
        <p className="page-description login-subtitle">Sign in to your restaurant account</p>
        <form className="form" onSubmit={handleSubmit}>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="form-row">
            <label htmlFor="tenantCode">Restaurant Code</label>
            <input
              id="tenantCode"
              type="text"
              value={tenantCode}
              onChange={(e) => setTenantCode(e.target.value)}
              placeholder="restaurant-code"
              autoComplete="organization"
              required
              disabled={submitting}
            />
          </div>
          <div className="form-row">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
              required
              disabled={submitting}
            />
          </div>
          <div className="form-row">
            <label htmlFor="password">Password</label>
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
            <button type="submit" className="button-primary" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
