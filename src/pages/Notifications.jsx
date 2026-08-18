import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, AlertTriangle, Clock3, CheckCircle2 } from 'lucide-react'
import { useApp } from '../data/AppContext'
import { todayISO } from '../utils/date'

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

function getNotificationMeta(diffDays) {
  if (diffDays < 0) {
    return {
      label: 'Overdue',
      tone: 'border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300',
      sortOrder: 0,
    }
  }
  if (diffDays === 0) {
    return {
      label: 'Due today',
      tone: 'border-orange-200 dark:border-orange-900/40 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300',
      sortOrder: 1,
    }
  }
  if (diffDays === 1) {
    return {
      label: 'Due tomorrow',
      tone: 'border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300',
      sortOrder: 2,
    }
  }
  return {
    label: 'Due in 2 days',
    tone: 'border-yellow-200 dark:border-yellow-900/40 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-300',
    sortOrder: 3,
  }
}

function StatCard({ title, value, subtitle, icon: Icon, tone = 'default' }) {
  const toneMap = {
    default: 'bg-surface dark:bg-dark-surface border-surface-border dark:border-dark-border',
    warning: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40',
    danger: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40',
    primary: 'bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/20',
  }

  const iconMap = {
    default: 'bg-surface-offset dark:bg-dark-offset text-ink dark:text-white',
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

export default function Notifications() {
  const { tasks = [], associates = [], ready } = useApp()
  const [filter, setFilter] = useState('all')
  const today = todayISO()
  const todayStart = startOfToday()

  const associateMap = useMemo(() => {
    return new Map(associates.map((associate) => [associate.id, associate.name]))
  }, [associates])

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
        const meta = getNotificationMeta(diffDays)

        const associateNames = (task.associateIds || [])
          .map((id) => associateMap.get(id))
          .filter(Boolean)

        return {
          id: task.id,
          title: task.title || task.task || 'Untitled task',
          endDate: task.endDate,
          startDate: task.startDate || '',
          status: task.status || 'Not Started',
          priority: task.priority || 'Medium',
          blocker: task.blocker || 'None',
          source: task.source || 'Manual',
          associateNames,
          diffDays,
          ...meta,
        }
      })
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
        return new Date(a.endDate) - new Date(b.endDate)
      })
  }, [tasks, associateMap, todayStart])

  const filteredNotifications = useMemo(() => {
    if (filter === 'overdue') return notifications.filter((item) => item.diffDays < 0)
    if (filter === 'today') return notifications.filter((item) => item.diffDays === 0)
    if (filter === 'tomorrow') return notifications.filter((item) => item.diffDays === 1)
    if (filter === 'two-days') return notifications.filter((item) => item.diffDays === 2)
    return notifications
  }, [notifications, filter])

  const overdueCount = notifications.filter((item) => item.diffDays < 0).length
  const todayCount = notifications.filter((item) => item.diffDays === 0).length
  const tomorrowCount = notifications.filter((item) => item.diffDays === 1).length
  const twoDayCount = notifications.filter((item) => item.diffDays === 2).length

  if (!ready) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
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
            Notifications
          </h2>
          <p className="text-sm text-ink-muted dark:text-dark-dynamic mt-1">
            Deadline alerts based on task end dates as of {today}.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-ink-faint dark:text-dark-dynamic">
          <span className="badge bg-primary/10 text-primary">
            {notifications.length} active alert{notifications.length !== 1 ? 's' : ''}
          </span>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Overdue"
          value={overdueCount}
          subtitle="Past end date and still open"
          icon={AlertTriangle}
          tone="danger"
        />
        <StatCard
          title="Due Today"
          value={todayCount}
          subtitle="Need action today"
          icon={Clock3}
          tone="warning"
        />
        <StatCard
          title="Due Tomorrow"
          value={tomorrowCount}
          subtitle="Upcoming in 1 day"
          icon={Bell}
          tone="primary"
        />
        <StatCard
          title="Due In 2 Days"
          value={twoDayCount}
          subtitle="Early warning list"
          icon={CheckCircle2}
        />
      </section>

      <section className="card p-4 md:p-5">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'overdue', label: 'Overdue' },
            { key: 'today', label: 'Due Today' },
            { key: 'tomorrow', label: 'Due Tomorrow' },
            { key: 'two-days', label: 'Due In 2 Days' },
          ].map((item) => (
            <button
              key={item.key}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                filter === item.key
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : 'bg-surface dark:bg-dark-surface text-ink-muted dark:text-dark-dynamic border-surface-border dark:border-dark-border hover:bg-surface-offset dark:hover:bg-dark-offset'
              }`}
              onClick={() => setFilter(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((item) => (
            <Link
              key={item.id}
              to={`/tasks?taskId=${item.id}`}
              state={{ highlightTaskId: item.id }}
              className={`block rounded-2xl border p-4 transition-all hover:shadow-sm hover:scale-[0.998] ${item.tone}`}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold">{item.title}</h3>
                    <span className="rounded-full bg-white/70 dark:bg-black/10 px-2 py-1 text-[11px] font-medium">
                      {item.label}
                    </span>
                    <span className="rounded-full bg-white/70 dark:bg-black/10 px-2 py-1 text-[11px] font-medium">
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm opacity-90">
                    <span>Priority: {item.priority}</span>
                    <span>•</span>
                    <span>Blocker: {item.blocker}</span>
                    <span>•</span>
                    <span>Source: {item.source}</span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm opacity-90">
                    {item.startDate && (
                      <>
                        <span>Start: {item.startDate}</span>
                        <span>•</span>
                      </>
                    )}
                    <span>End: {item.endDate}</span>
                  </div>

                  <div className="mt-2 text-sm opacity-90">
                    Associate: {item.associateNames.length ? item.associateNames.join(', ') : 'Unassigned'}
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-surface-border dark:border-dark-border p-10 text-center">
            <h3 className="text-sm font-semibold text-ink dark:text-white">No notifications found</h3>
            <p className="text-sm text-ink-muted dark:text-dark-dynamic mt-2">
              There are no tasks matching the selected notification filter.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}