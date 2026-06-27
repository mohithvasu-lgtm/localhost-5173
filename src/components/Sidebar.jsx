import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  NotebookPen,
} from 'lucide-react'

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen border-r border-surface-border dark:border-dark-border bg-surface dark:bg-dark-surface p-4">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-ink dark:text-white">
          Standup Tracker
        </h1>
        <p className="text-xs text-ink-muted dark:text-dark-dynamic mt-1">
          Daily updates and MOM
        </p>
      </div>

      <nav className="space-y-2">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
              isActive
                ? 'bg-primary text-white'
                : 'text-ink-muted hover:bg-surface-offset dark:text-dark-dynamic dark:hover:bg-dark-offset'
            }`
          }
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/standup"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
              isActive
                ? 'bg-primary text-white'
                : 'text-ink-muted hover:bg-surface-offset dark:text-dark-dynamic dark:hover:bg-dark-offset'
            }`
          }
        >
          <ClipboardList size={18} />
          <span>Stand Up</span>
        </NavLink>

        <NavLink
          to="/reports"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
              isActive
                ? 'bg-primary text-white'
                : 'text-ink-muted hover:bg-surface-offset dark:text-dark-dynamic dark:hover:bg-dark-offset'
            }`
          }
        >
          <BarChart3 size={18} />
          <span>Reports</span>
        </NavLink>

        <NavLink
          to="/mom"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
              isActive
                ? 'bg-primary text-white'
                : 'text-ink-muted hover:bg-surface-offset dark:text-dark-dynamic dark:hover:bg-dark-offset'
            }`
          }
        >
          <NotebookPen size={18} />
          <span>MOM</span>
        </NavLink>
      </nav>
    </aside>
  )
}