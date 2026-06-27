import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Target,
  KanbanSquare,
  BarChart2,
  FileText,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Logo from './Logo'
import { useApp } from '../data/AppContext'
import { formatDate, todayISO } from '../utils/date'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/standup', label: 'Stand-up', icon: ClipboardList },
  { to: '/associates', label: 'Associates', icon: Users },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/tasks', label: 'Tasks / Kanban', icon: KanbanSquare },
  { to: '/reports', label: 'Reports', icon: BarChart2 },
  { to: '/mom', label: 'MOM', icon: FileText },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const { settings = {} } = useApp()
  const location = useLocation()

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const saved = settings?.theme
    const isDark = saved === 'dark' || (!saved && prefersDark)
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [settings?.theme])

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function handler(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        document.querySelector('[data-search-input]')?.focus()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const currentPage =
    NAV.find((n) => n.to === location.pathname)?.label || 'WorkLog Tracker'

  return (
    <div className="flex h-screen overflow-hidden bg-surface-bg dark:bg-dark-bg">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-30 w-56 flex flex-col',
          'bg-surface dark:bg-dark-surface border-r border-surface-border dark:border-dark-border',
          'transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:relative lg:translate-x-0 lg:flex',
        ].join(' ')}
      >
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-surface-border dark:border-dark-border">
          <Logo size={26} />
          <div>
            <p className="text-sm font-semibold text-ink dark:text-white leading-tight">WorkLog</p>
            <p className="text-xs text-ink-muted dark:text-dark-dynamic leading-tight">Tracker</p>
          </div>
          <button
            className="ml-auto btn-icon lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-4 py-2.5 border-b border-surface-border dark:border-dark-border">
          <p className="text-xs text-ink-muted dark:text-dark-dynamic">
            {formatDate(todayISO())}
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                [
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium mb-0.5 transition-all',
                  isActive
                    ? 'bg-primary/10 text-primary dark:text-primary'
                    : 'text-ink-muted dark:text-dark-dynamic hover:bg-surface-offset dark:hover:bg-dark-offset hover:text-ink dark:hover:text-white',
                ].join(' ')
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-surface-border dark:border-dark-border">
          <button
            className="btn-ghost w-full justify-start gap-2 text-xs"
            onClick={() => {
              const next = !dark
              setDark(next)
              document.documentElement.classList.toggle('dark', next)
            }}
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={14} /> : <Moon size={14} />}
            {dark ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="flex flex-wrap items-center gap-3 px-4 py-3 bg-surface dark:bg-dark-surface border-b border-surface-border dark:border-dark-border shrink-0">
          <button
            className="btn-icon lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={18} />
          </button>

          <h1 className="text-sm font-semibold text-ink dark:text-white">
            {currentPage}
          </h1>

          <div className="ml-auto flex items-center gap-2 shrink-0">
            <span className="hidden md:flex items-center gap-1 text-xs text-ink-faint dark:text-dark-dynamic/50 bg-surface-offset dark:bg-dark-offset px-2 py-1 rounded-md border border-surface-border dark:border-dark-border pointer-events-none">
              <kbd className="font-mono">N</kbd> New task
              <span className="mx-1">·</span>
              <kbd className="font-mono">Ctrl+F</kbd> Search
            </span>
          </div>
        </header>

        <main className="relative z-0 flex-1 overflow-y-auto p-4 md:p-6 page-enter">
          {children}
        </main>
      </div>
    </div>
  )
}