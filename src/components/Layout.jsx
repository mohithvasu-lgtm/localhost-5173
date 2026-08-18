import { NavLink, useLocation } from 'react-router-dom'
import {
  Home,
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
  ShieldAlert,
  FileSpreadsheet,
  LineChart,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import Logo from './Logo'
import { useApp } from '../data/AppContext'
import { formatDate, todayISO } from '../utils/date'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [dark, setDark] = useState(false)
  const { settings = {}, tasks = [] } = useApp()
  const location = useLocation()

  const notifications = useMemo(() => {
    const today = new Date(todayISO())
    today.setHours(0, 0, 0, 0)

    return (tasks || [])
      .filter((task) => {
        if (!task?.endDate) return false
        if ((task.status || '').toLowerCase() === 'completed') return false

        const end = new Date(task.endDate)
        end.setHours(0, 0, 0, 0)

        const diffDays = Math.round((end - today) / (1000 * 60 * 60 * 24))
        return diffDays === 2 || diffDays === 1 || diffDays < 0
      })
      .map((task) => {
        const end = new Date(task.endDate)
        end.setHours(0, 0, 0, 0)
        const diffDays = Math.round((end - today) / (1000 * 60 * 60 * 24))

        let type = 'info'
        let label = ''

        if (diffDays === 2) {
          type = 'warning'
          label = 'Due in 2 days'
        } else if (diffDays === 1) {
          type = 'urgent'
          label = 'Due tomorrow'
        } else if (diffDays < 0) {
          type = 'overdue'
          label = 'Overdue'
        }

        return {
          id: task.id,
          title: task.title || task.task || 'Untitled task',
          endDate: task.endDate,
          status: task.status || 'Not Started',
          priority: task.priority || 'Medium',
          associateIds: task.associateIds || [],
          type,
          label,
          diffDays,
        }
      })
      .sort((a, b) => {
        const aDate = new Date(a.endDate).getTime()
        const bDate = new Date(b.endDate).getTime()
        return aDate - bDate
      })
  }, [tasks])

  const notificationCount = notifications.length

  const NAV = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/standup', label: 'Stand-up', icon: ClipboardList },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: notificationCount },
    { to: '/associates', label: 'Associates', icon: Users },
    { to: '/goals', label: 'Goals', icon: Target },
    { to: '/tasks', label: 'Tasks / Kanban', icon: KanbanSquare },
    { to: '/fmea', label: 'FMEA Tracker', icon: ShieldAlert },
    { to: '/dvp', label: 'DVP', icon: FileSpreadsheet },
    { to: '/task-analysis', label: 'Task Analysis', icon: LineChart },
    { to: '/reports', label: 'Reports', icon: BarChart2 },
    { to: '/mom', label: 'MOM', icon: FileText },
    { to: '/settings', label: 'Settings', icon: Settings },
  ]

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
          'fixed inset-y-0 left-0 z-30 flex flex-col',
          'bg-surface dark:bg-dark-surface border-r border-surface-border dark:border-dark-border',
          'transition-all duration-200',
          sidebarCollapsed ? 'w-[76px]' : 'w-56',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:relative lg:translate-x-0 lg:flex',
        ].join(' ')}
      >
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-surface-border dark:border-dark-border">
          <Logo size={26} />

          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink dark:text-white leading-tight">WorkLog</p>
              <p className="text-xs text-ink-muted dark:text-dark-dynamic leading-tight">Tracker</p>
            </div>
          )}

          <div className="ml-auto flex items-center gap-1">
            <button
              className="hidden lg:flex btn-icon"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>

            <button
              className="btn-icon lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {!sidebarCollapsed && (
          <div className="px-4 py-2.5 border-b border-surface-border dark:border-dark-border">
            <p className="text-xs text-ink-muted dark:text-dark-dynamic">
              {formatDate(todayISO())}
            </p>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {NAV.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={sidebarCollapsed ? label : undefined}
              className={({ isActive }) =>
                [
                  'flex items-center rounded-lg text-sm font-medium mb-1 transition-all relative',
                  sidebarCollapsed
                    ? 'justify-center px-2 py-2.5'
                    : 'gap-2.5 px-3 py-2',
                  isActive
                    ? 'bg-primary/10 text-primary dark:text-primary'
                    : 'text-ink-muted dark:text-dark-dynamic hover:bg-surface-offset dark:hover:bg-dark-offset hover:text-ink dark:hover:text-white',
                ].join(' ')
              }
            >
              <div className="relative flex items-center justify-center">
                <Icon size={16} />
                {sidebarCollapsed && badge > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>

              {!sidebarCollapsed && (
                <>
                  <span className="truncate">{label}</span>
                  {badge > 0 && (
                    <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] leading-5 text-center">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-surface-border dark:border-dark-border">
          <button
            className={[
              'btn-ghost w-full text-xs',
              sidebarCollapsed ? 'justify-center px-2' : 'justify-start gap-2',
            ].join(' ')}
            onClick={() => {
              const next = !dark
              setDark(next)
              document.documentElement.classList.toggle('dark', next)
            }}
            aria-label="Toggle theme"
            title={sidebarCollapsed ? (dark ? 'Light mode' : 'Dark mode') : undefined}
          >
            {dark ? <Sun size={14} /> : <Moon size={14} />}
            {!sidebarCollapsed && (dark ? 'Light mode' : 'Dark mode')}
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
            {notificationCount > 0 && (
              <NavLink
                to="/notifications"
                className="flex items-center gap-2 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/20 px-2.5 py-1.5 rounded-md border border-red-200 dark:border-red-900/40"
              >
                <Bell size={14} />
                <span>{notificationCount} alert{notificationCount !== 1 ? 's' : ''}</span>
              </NavLink>
            )}

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