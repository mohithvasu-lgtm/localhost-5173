import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  AlertTriangle,
  Users,
  KanbanSquare,
  FileText,
  ArrowRight,
  Target,
} from 'lucide-react'
import { useApp } from '../data/AppContext'
import { todayISO, formatDate } from '../utils/date'

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateOnly(value) {
  const d = new Date(value)
  d.setHours(0, 0, 0, 0)
  return d
}

function getAlertMeta(diffDays) {
  if (diffDays < 0) {
    return {
      label: 'Overdue',
      tone: 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40',
    }
  }
  if (diffDays === 0) {
    return {
      label: 'Due today',
      tone: 'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/40',
    }
  }
  if (diffDays === 1) {
    return {
      label: 'Due tomorrow',
      tone: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40',
    }
  }
  return {
    label: 'Due in 2 days',
    tone: 'text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900/40',
  }
}

function StatCard({ title, value, subtitle, icon: Icon, tone = 'default' }) {
  const toneMap = {
    default: 'bg-surface dark:bg-dark-surface border-surface-border dark:border-dark-border',
    success: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/40',
    warning: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40',
    danger: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40',
    primary: 'bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/20',
  }

  const iconMap = {
    default: 'bg-surface-offset dark:bg-dark-offset text-ink dark:text-white',
    success: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    warning: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    danger: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    primary: 'bg-primary/15 text-primary',
  }

  return (
    <div className={`card p-4 ${toneMap[tone] || toneMap.default}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-ink-muted dark:text-dark-dynamic mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-semibold tracking-tight text-ink dark:text-white">
            {value}
          </h3>
          <p className="text-xs text-ink-faint dark:text-dark-dynamic mt-1">{subtitle}</p>
        </div>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            iconMap[tone] || iconMap.default
          }`}
        >
          <Icon size={18} />
        </div>
      </div>
    </div>
  )
}

function SectionCard({ title, subtitle, action, children }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-ink dark:text-white">{title}</h3>
          <p className="text-xs text-ink-muted dark:text-dark-dynamic mt-1">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

export default function Home() {
  const {
    tasks = [],
    associates = [],
    goals = [],
    standups = [],
    momEntries = [],
    ready,
  } = useApp()

  const today = todayISO()
  const todayStart = startOfToday()

  const todayStandup = useMemo(() => {
    return standups.find((entry) => entry.date === today) || null
  }, [standups, today])

  const todayLeaveCount = useMemo(() => {
    return (todayStandup?.associates || []).filter((item) => item.isOnLeave).length
  }, [todayStandup])

  const openTasks = useMemo(() => {
    return tasks.filter((task) => (task.status || '').toLowerCase() !== 'completed')
  }, [tasks])

  const blockedTasks = useMemo(() => {
    return tasks.filter((task) => (task.status || '').toLowerCase() === 'blocked')
  }, [tasks])

  const completedTasks = useMemo(() => {
    return tasks.filter((task) => (task.status || '').toLowerCase() === 'completed')
  }, [tasks])

  const notifications = useMemo(() => {
    return tasks
      .filter((task) => {
        if (!task?.endDate) return false
        if ((task.status || '').toLowerCase() === 'completed') return false

        const end = toDateOnly(task.endDate)
        const diffDays = Math.round((end - todayStart) / (1000 * 60 * 60 * 24))
        return diffDays <= 2
      })
      .map((task) => {
        const end = toDateOnly(task.endDate)
        const diffDays = Math.round((end - todayStart) / (1000 * 60 * 60 * 24))
        return {
          id: task.id,
          title: task.title || task.task || 'Untitled task',
          endDate: task.endDate,
          status: task.status || 'Not Started',
          priority: task.priority || 'Medium',
          diffDays,
          ...getAlertMeta(diffDays),
        }
      })
      .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
  }, [tasks, todayStart])

  const recentTasks = useMemo(() => {
    return [...tasks]
      .filter((task) => task?.title || task?.task)
      .sort((a, b) => {
        const aDate = new Date(a.updatedAt || a.standupDate || a.endDate || 0).getTime()
        const bDate = new Date(b.updatedAt || b.standupDate || b.endDate || 0).getTime()
        return bDate - aDate
      })
      .slice(0, 6)
  }, [tasks])

  const goalSummary = useMemo(() => {
    const counts = new Map()

    tasks.forEach((task) => {
      if (!task.goalId) return
      counts.set(task.goalId, (counts.get(task.goalId) || 0) + 1)
    })

    return goals
      .map((goal) => ({
        id: goal.id,
        name: goal.name,
        count: counts.get(goal.id) || 0,
      }))
      .filter((goal) => goal.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [tasks, goals])

  if (!ready) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="h-3 w-24 rounded bg-surface-dynamic dark:bg-dark-dynamic mb-3" />
            <div className="h-8 w-16 rounded bg-surface-dynamic dark:bg-dark-dynamic mb-2" />
            <div className="h-3 w-32 rounded bg-surface-dynamic dark:bg-dark-dynamic" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink dark:text-white">
            Home
          </h2>
          <p className="text-sm text-ink-muted dark:text-dark-dynamic mt-1">
            Quick desktop overview for today’s work, alerts, and actions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-ink-faint dark:text-dark-dynamic">
          <span className="badge bg-primary/10 text-primary">{formatDate(today)}</span>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Open Tasks"
          value={openTasks.length}
          subtitle="All non-completed tasks"
          icon={ClipboardList}
          tone="primary"
        />
        <StatCard
          title="Blocked Tasks"
          value={blockedTasks.length}
          subtitle="Need follow-up attention"
          icon={AlertTriangle}
          tone="warning"
        />
        <StatCard
          title="Completed Tasks"
          value={completedTasks.length}
          subtitle="Finished items in tracker"
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          title="Deadline Alerts"
          value={notifications.length}
          subtitle="Due soon or overdue"
          icon={Bell}
          tone={notifications.some((item) => item.diffDays < 0) ? 'danger' : 'default'}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Quick Actions"
          subtitle="Jump directly into the most used workflows."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to="/standup"
              className="rounded-xl border border-surface-border dark:border-dark-border p-4 hover:bg-surface-offset dark:hover:bg-dark-offset transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <CalendarDays size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink dark:text-white">Start Stand-up</p>
                  <p className="text-xs text-ink-muted dark:text-dark-dynamic mt-1">
                    Enter daily team updates
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/tasks"
              className="rounded-xl border border-surface-border dark:border-dark-border p-4 hover:bg-surface-offset dark:hover:bg-dark-offset transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <KanbanSquare size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink dark:text-white">Open Kanban</p>
                  <p className="text-xs text-ink-muted dark:text-dark-dynamic mt-1">
                    Review active tasks
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/notifications"
              className="rounded-xl border border-surface-border dark:border-dark-border p-4 hover:bg-surface-offset dark:hover:bg-dark-offset transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300 flex items-center justify-center">
                  <Bell size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink dark:text-white">Open Notifications</p>
                  <p className="text-xs text-ink-muted dark:text-dark-dynamic mt-1">
                    {notifications.length} active alert{notifications.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/mom"
              className="rounded-xl border border-surface-border dark:border-dark-border p-4 hover:bg-surface-offset dark:hover:bg-dark-offset transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <FileText size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink dark:text-white">Open MOM</p>
                  <p className="text-xs text-ink-muted dark:text-dark-dynamic mt-1">
                    Review meeting notes
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </SectionCard>

        <SectionCard
          title="Today Snapshot"
          subtitle="Current view of today’s team status."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-surface-border dark:border-dark-border p-4">
              <p className="text-xs text-ink-faint dark:text-dark-dynamic">Associates</p>
              <p className="text-lg font-semibold text-ink dark:text-white mt-1">{associates.length}</p>
            </div>
            <div className="rounded-xl border border-surface-border dark:border-dark-border p-4">
              <p className="text-xs text-ink-faint dark:text-dark-dynamic">Goals</p>
              <p className="text-lg font-semibold text-ink dark:text-white mt-1">{goals.length}</p>
            </div>
            <div className="rounded-xl border border-surface-border dark:border-dark-border p-4">
              <p className="text-xs text-ink-faint dark:text-dark-dynamic">Stand-up Records</p>
              <p className="text-lg font-semibold text-ink dark:text-white mt-1">{standups.length}</p>
            </div>
            <div className="rounded-xl border border-surface-border dark:border-dark-border p-4">
              <p className="text-xs text-ink-faint dark:text-dark-dynamic">On Leave Today</p>
              <p className="text-lg font-semibold text-ink dark:text-white mt-1">{todayLeaveCount}</p>
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Deadline Alerts"
          subtitle="Tasks due in 2 days, tomorrow, today, or already overdue."
          action={
            <Link to="/notifications" className="text-sm text-primary font-medium inline-flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          }
        >
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className={`rounded-xl border px-3 py-3 ${item.tone}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{item.title}</p>
                    <span className="rounded-full bg-white/70 dark:bg-black/10 px-2 py-1 text-[11px] font-medium">
                      {item.label}
                    </span>
                  </div>
                  <div className="mt-1 text-xs opacity-90 flex flex-wrap items-center gap-2">
                    <span>End date: {item.endDate}</span>
                    <span>•</span>
                    <span>Status: {item.status}</span>
                    <span>•</span>
                    <span>Priority: {item.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-ink-muted dark:text-dark-dynamic">
              No active deadline alerts.
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Recent Task Updates"
          subtitle="Latest task entries from your tracker."
        >
          {recentTasks.length > 0 ? (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl border border-surface-border dark:border-dark-border px-3 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink dark:text-white">
                      {task.title || task.task || 'Untitled task'}
                    </p>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
                      {task.status || 'Not Started'}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-ink-muted dark:text-dark-dynamic flex flex-wrap items-center gap-2">
                    <span>Priority: {task.priority || 'Medium'}</span>
                    {task.endDate && (
                      <>
                        <span>•</span>
                        <span>End: {task.endDate}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-ink-muted dark:text-dark-dynamic">
              No recent task updates found.
            </div>
          )}
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard
          title="Goal Activity"
          subtitle="Top goals currently receiving task updates."
        >
          {goalSummary.length > 0 ? (
            <div className="space-y-3">
              {goalSummary.map((goal) => (
                <div
                  key={goal.id}
                  className="rounded-xl border border-surface-border dark:border-dark-border px-3 py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Target size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink dark:text-white truncate">{goal.name}</p>
                      <p className="text-xs text-ink-muted dark:text-dark-dynamic mt-1">
                        Active goal
                      </p>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-ink dark:text-white shrink-0">
                    {goal.count}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-ink-muted dark:text-dark-dynamic">
              No goal activity yet.
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Work Summary"
          subtitle="Simple desktop overview of tracker coverage."
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl border border-surface-border dark:border-dark-border p-4">
              <div className="flex items-center gap-2 text-ink-muted dark:text-dark-dynamic">
                <Users size={16} />
                <span className="text-xs">Associates</span>
              </div>
              <p className="text-xl font-semibold text-ink dark:text-white mt-2">{associates.length}</p>
            </div>

            <div className="rounded-xl border border-surface-border dark:border-dark-border p-4">
              <div className="flex items-center gap-2 text-ink-muted dark:text-dark-dynamic">
                <ClipboardList size={16} />
                <span className="text-xs">Tasks</span>
              </div>
              <p className="text-xl font-semibold text-ink dark:text-white mt-2">{tasks.length}</p>
            </div>

            <div className="rounded-xl border border-surface-border dark:border-dark-border p-4">
              <div className="flex items-center gap-2 text-ink-muted dark:text-dark-dynamic">
                <FileText size={16} />
                <span className="text-xs">MOM Entries</span>
              </div>
              <p className="text-xl font-semibold text-ink dark:text-white mt-2">{momEntries.length}</p>
            </div>
          </div>
        </SectionCard>
      </section>
    </div>
  )
}