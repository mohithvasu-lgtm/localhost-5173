import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 text-center">
      <p className="text-5xl font-bold text-ink-faint mb-4">404</p>
      <h2 className="text-lg font-semibold text-ink dark:text-white mb-2">Page not found</h2>
      <p className="text-sm text-ink-muted mb-6">This page doesn't exist.</p>
      <Link to="/" className="btn-primary">
        <Home size={14} /> Back to Dashboard
      </Link>
    </div>
  )
}