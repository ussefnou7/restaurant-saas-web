import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="not-found-page">
      <div className="card">
        <h1>Page not found</h1>
        <p className="page-subtitle">The page you are looking for does not exist.</p>
        <Link to="/dashboard" className="button-primary">
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
