import { useMemo, useState } from 'react'
import {
  Users,
  ListTodo,
  Target,
  AlertTriangle,
  CheckCircle2,
  Percent,
  Clock3,
  BarChart3,
} from 'lucide-react'
import { useApp } from '../data/AppContext'
import { formatDateShort } from '../utils/date'
import {
  GoalDistributionChart,
  TeamTaskBarChart,
  WeeklyTrendLineChart,
} from '../charts/DashboardCharts'
import '../charts/chartConfig'

function isFilledTask(task) {
  return Boolean(task?.task?.trim())
}

function todayISODate() {
  return new Date().toISOString().slice(0, 10)
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfQuarter(date) {
  const quarterStartMonth = Math.floor(date.getMonth() / 3) * 3
  return new Date(date.getFullYear(), quarterStartMonth, 1)
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function toISO(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10)
}

function getPresetRange(rangeKey) {
  const today = new Date()
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  if (rangeKey === 'week') {
    return {
      start: toISO(addDays(end, -6)),
      end: toISO(end),
    }
  }

  if (rangeKey === 'month') {
    return {
      start: toISO(startOfMonth(end)),
      end: toISO(end),
    }
  }

  if (rangeKey === 'quarter') {
    return {
      start: toISO(startOfQuarter(end)),
      end: toISO(end),
    }
  }

  return {
    start: toISO(addDays(end, -6)),
    end: toISO(end),
  }
}

function inDateRange(date, start, end) {
  if (!date) return false
  if (start && date < start) return false
  if (end && date > end) return false
  return true
}

function safePercent(numerator, denominator) {
  if (!denominator) return 0
  return Math.round((numerator / denominator) * 100)
}

function StatCard({ title, value, subtitle, icon: Icon, tone = 'default' }) {
  const toneMap = {
    default: 'bg-surface dark:bg-dark-surface border-surface-border dark:border-dark-border',
    success: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/40',
    warning: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40',
    primary: 'bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/20',
  }

  const iconMap = {
    default: 'bg-surface-offset dark:bg-dark-offset text-ink dark:text-white',
    success: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    warning: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
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

function ChartPanel({ title, subtitle, children }) {
  return (
    <div className="card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-ink dark:text-white">{title}</h3>
        <p className="text-xs text-ink-muted dark:text-dark-dynamic mt-1">{subtitle}</p>
      </div>
      <div className="h-[280px]">{children}</div>
    </div>
  )
}

function TaskListCard({ title, subtitle, tasks = [] }) {
  return (
    <div className="card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-ink dark:text-white">{title}</h3>
        <p className="text-xs text-ink-muted dark:text-dark-dynamic mt-1">{subtitle}</p>
      </div>

      {tasks.length > 0 ? (
        <div className="space-y-2 max-h-[320px] overflow-y-auto">
          {tasks.map((task) => (
            <div
              key={task.key}
              className="rounded-xl border border-surface-border dark:border-dark-border px-3 py-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-ink dark:text-white">{task.name}</p>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
                  Allocation {Number(task.allocation || 0).toFixed(2)}
                </span>
                <span className="text-xs text-ink-faint dark:text-dark-dynamic">•</span>
                <span className="text-xs text-ink-muted dark:text-dark-dynamic">{task.date}</span>
                <span className="text-xs text-ink-faint dark:text-dark-dynamic">•</span>
                <span className="text-xs text-ink-muted dark:text-dark-dynamic">{task.status}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-muted dark:text-dark-dynamic">
                <span>{task.goalName}</span>
                <span>•</span>
                <span>{task.bucketName}</span>
                <span>•</span>
                <span>{task.associateName}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-[220px] flex items-center justify-center text-sm text-ink-muted dark:text-dark-dynamic">
          No tasks found for the selected range.
        </div>
      )}
    </div>
  )
}

function TeamSummaryTable({ rows = [] }) {
  return (
    <div className="card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-ink dark:text-white">Team-wise Summary</h3>
        <p className="text-xs text-ink-muted dark:text-dark-dynamic mt-1">
          Separate totals for each team in the selected date range.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-border dark:border-dark-border">
              <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 pr-3">
                Team
              </th>
              <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 pr-3">
                Associates
              </th>
              <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 pr-3">
                Tasks
              </th>
              <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 pr-3">
                Goals Worked
              </th>
              <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 pr-3">
                Goal %
              </th>
              <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 pr-3">
                Blocked
              </th>
              <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 pr-3">
                Completed %
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.team}
                className="border-b border-surface-border/70 dark:border-dark-border/70"
              >
                <td className="py-3 pr-3 text-sm font-medium text-ink dark:text-white">
                  {row.team}
                </td>
                <td className="py-3 pr-3 text-sm text-ink dark:text-white">{row.associates}</td>
                <td className="py-3 pr-3 text-sm text-ink dark:text-white">{row.tasks}</td>
                <td className="py-3 pr-3 text-sm text-ink dark:text-white">{row.goalsWorked}</td>
                <td className="py-3 pr-3 text-sm text-ink dark:text-white">{row.goalPercent}%</td>
                <td className="py-3 pr-3 text-sm text-ink dark:text-white">{row.blocked}</td>
                <td className="py-3 pr-3 text-sm text-ink dark:text-white">
                  {row.completionRate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const {
    associates = [],
    goals = [],
    standups = [],
    ready,
  } = useApp()

  const initialRange = getPresetRange('week')
  const [rangeType, setRangeType] = useState('week')
  const [customStart, setCustomStart] = useState(initialRange.start)
  const [customEnd, setCustomEnd] = useState(initialRange.end)
  const [selectedAssociateId, setSelectedAssociateId] = useState(associates[0]?.id || '')

  const range = useMemo(() => {
    if (rangeType === 'custom') {
      return {
        start: customStart,
        end: customEnd,
      }
    }
    return getPresetRange(rangeType)
  }, [rangeType, customStart, customEnd])

  const filteredStandups = useMemo(() => {
    return standups.filter((entry) => inDateRange(entry.date, range.start, range.end))
  }, [standups, range])

  const associateMap = useMemo(() => {
    return new Map(associates.map((associate) => [associate.id, associate]))
  }, [associates])

  const associateOptions = useMemo(() => {
    return associates
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [associates])

  const selectedAssociate = useMemo(() => {
    return associateOptions.find((associate) => associate.id === selectedAssociateId) || associateOptions[0] || null
  }, [associateOptions, selectedAssociateId])

  const normalizedSelectedAssociateId = selectedAssociate?.id || ''

  const allTaskRecords = useMemo(() => {
    const records = []

    filteredStandups.forEach((day) => {
      ;(day?.associates || []).forEach((associateEntry) => {
        if (associateEntry?.isOnLeave) return

        const associate = associateMap.get(associateEntry.associateId)
        const associateName = associate?.name || 'Unknown'
        const associateTeam = associate?.team || 'Unassigned'

        ;(associateEntry?.tasks || [])
          .filter(isFilledTask)
          .forEach((task) => {
            const goal = goals.find((item) => item.id === task.goalId)
            records.push({
              key: `${day.date}-${associateEntry.associateId}-${task.id}`,
              date: day.date,
              associateId: associateEntry.associateId,
              associateName,
              team: associateTeam,
              name: task.task.trim(),
              status: task.status || 'Not Started',
              priority: task.priority || 'Medium',
              blocker: task.blocker || 'None',
              allocation: Number.parseFloat(task.allocation || '0') || 0,
              goalId: task.goalId || '',
              goalName: goal?.name || 'No Goal',
              bucketName: task.bucketId || 'No Bucket',
            })
          })
      })
    })

    return records
  }, [filteredStandups, associateMap, goals])

  const totalAssociates = associates.length
  const totalTasks = allTaskRecords.length
  const totalGoals = goals.length
  const goalsWorkedSet = new Set(allTaskRecords.filter((task) => task.goalId).map((task) => task.goalId))
  const goalsWorked = goalsWorkedSet.size
  const blockedTasks = allTaskRecords.filter((task) => task.status === 'Blocked').length
  const completedTasks = allTaskRecords.filter((task) => task.status === 'Completed').length
  const averageAllocation = totalTasks
    ? (allTaskRecords.reduce((sum, task) => sum + task.allocation, 0) / totalTasks).toFixed(2)
    : '0.00'

  const individualTasks = useMemo(() => {
    if (!normalizedSelectedAssociateId) return []
    return allTaskRecords.filter((task) => task.associateId === normalizedSelectedAssociateId)
  }, [allTaskRecords, normalizedSelectedAssociateId])

  const individualGoalIds = new Set(individualTasks.filter((task) => task.goalId).map((task) => task.goalId))
  const individualGoalPercent = safePercent(individualGoalIds.size, totalGoals)
  const individualBlocked = individualTasks.filter((task) => task.status === 'Blocked').length
  const individualCompleted = individualTasks.filter((task) => task.status === 'Completed').length
  const individualCompletionRate = safePercent(individualCompleted, individualTasks.length)
  const individualLastUpdated = individualTasks.length
    ? individualTasks
        .map((task) => task.date)
        .slice()
        .sort((a, b) => b.localeCompare(a))[0]
    : '—'

  const groupedTeams = useMemo(() => {
    const teamMap = new Map()

    associates.forEach((associate) => {
      const team = associate.team?.trim() || 'Unassigned'
      if (!teamMap.has(team)) {
        teamMap.set(team, {
          team,
          associateIds: new Set(),
          associateNames: new Set(),
          tasks: [],
          goalIds: new Set(),
          blocked: 0,
          completed: 0,
        })
      }
      const entry = teamMap.get(team)
      entry.associateIds.add(associate.id)
      entry.associateNames.add(associate.name)
    })

    allTaskRecords.forEach((task) => {
      const team = task.team?.trim() || 'Unassigned'
      if (!teamMap.has(team)) {
        teamMap.set(team, {
          team,
          associateIds: new Set(),
          associateNames: new Set(),
          tasks: [],
          goalIds: new Set(),
          blocked: 0,
          completed: 0,
        })
      }

      const entry = teamMap.get(team)
      entry.tasks.push(task)
      entry.associateIds.add(task.associateId)
      entry.associateNames.add(task.associateName)
      if (task.goalId) entry.goalIds.add(task.goalId)
      if (task.status === 'Blocked') entry.blocked += 1
      if (task.status === 'Completed') entry.completed += 1
    })

    return Array.from(teamMap.values())
      .map((team) => ({
        ...team,
        associates: team.associateIds.size,
        goalsWorked: team.goalIds.size,
        goalPercent: safePercent(team.goalIds.size, totalGoals),
        completionRate: safePercent(team.completed, team.tasks.length),
      }))
      .sort((a, b) => a.team.localeCompare(b.team))
  }, [associates, allTaskRecords, totalGoals])

  const goalDistributionData = goals
    .map((goal, index) => ({
      label: goal.name,
      value: allTaskRecords.filter((task) => task.goalId === goal.id).length,
      color: goal.color || ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#db2777'][index % 5],
    }))
    .filter((item) => item.value > 0)

  const teamBarData = groupedTeams
    .map((team) => ({
      label: team.team,
      value: team.tasks.length,
    }))
    .filter((item) => item.value > 0)

  const dailyMap = new Map()
  allTaskRecords.forEach((task) => {
    dailyMap.set(task.date, (dailyMap.get(task.date) || 0) + 1)
  })

  const trendDates = []
  if (range.start && range.end) {
    let cursor = new Date(range.start)
    const endDate = new Date(range.end)
    while (cursor <= endDate) {
      trendDates.push(toISO(cursor))
      cursor = addDays(cursor, 1)
    }
  }

  const weeklyTrendLabels = trendDates.map((day) => formatDateShort(day))
  const weeklyTrendValues = trendDates.map((day) => dailyMap.get(day) || 0)

  if (!ready) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
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
            Dashboard
          </h2>
          <p className="text-sm text-ink-muted dark:text-dark-dynamic mt-1">
            Individual and team-level visibility filtered by the selected time range.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-ink-faint dark:text-dark-dynamic">
          <span className="badge bg-primary/10 text-primary">Analytics</span>
        </div>
      </section>

      <section className="card p-4 md:p-5">
        <div className="grid gap-4 xl:grid-cols-[180px_180px_180px_1fr]">
          <div>
            <label className="label">Period</label>
            <select
              className="select"
              value={rangeType}
              onChange={(e) => setRangeType(e.target.value)}
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="quarter">Quarter</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="label">Start Date</label>
            <input
              className="input"
              type="date"
              value={rangeType === 'custom' ? customStart : range.start}
              onChange={(e) => setCustomStart(e.target.value)}
              disabled={rangeType !== 'custom'}
            />
          </div>

          <div>
            <label className="label">End Date</label>
            <input
              className="input"
              type="date"
              value={rangeType === 'custom' ? customEnd : range.end}
              onChange={(e) => setCustomEnd(e.target.value)}
              disabled={rangeType !== 'custom'}
            />
          </div>

          <div>
            <label className="label">Associate</label>
            <select
              className="select"
              value={normalizedSelectedAssociateId}
              onChange={(e) => setSelectedAssociateId(e.target.value)}
            >
              {associateOptions.map((associate) => (
                <option key={associate.id} value={associate.id}>
                  {associate.name} ({associate.team})
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          title="Total Associates"
          value={totalAssociates}
          subtitle="People available in the system"
          icon={Users}
          tone="primary"
        />
        <StatCard
          title="Total Tasks"
          value={totalTasks}
          subtitle="Counted only in selected period"
          icon={ListTodo}
        />
        <StatCard
          title="Goals Worked"
          value={goalsWorked}
          subtitle="Unique goals touched in range"
          icon={Target}
        />
        <StatCard
          title="Blocked Tasks"
          value={blockedTasks}
          subtitle="Blocked items in selected period"
          icon={AlertTriangle}
          tone="warning"
        />
        <StatCard
          title="Completed Tasks"
          value={completedTasks}
          subtitle="Completed items in selected period"
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          title="Average Allocation"
          value={averageAllocation}
          subtitle="Average across counted tasks"
          icon={Percent}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Clock3 size={16} className="text-primary" />
            <h3 className="text-sm font-semibold text-ink dark:text-white">
              Individual Snapshot
            </h3>
          </div>
          <p className="text-xs text-ink-muted dark:text-dark-dynamic">
            Detailed view for the selected associate in the chosen date range.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-surface-border dark:border-dark-border p-3">
              <p className="text-xs text-ink-faint dark:text-dark-dynamic">Associate</p>
              <p className="text-sm font-medium text-ink dark:text-white">
                {selectedAssociate?.name || '—'}
              </p>
            </div>

            <div className="rounded-xl border border-surface-border dark:border-dark-border p-3">
              <p className="text-xs text-ink-faint dark:text-dark-dynamic">Team</p>
              <p className="text-sm font-medium text-ink dark:text-white">
                {selectedAssociate?.team || '—'}
              </p>
            </div>

            <div className="rounded-xl border border-surface-border dark:border-dark-border p-3">
              <p className="text-xs text-ink-faint dark:text-dark-dynamic">No. of Tasks Worked</p>
              <p className="text-sm font-medium text-ink dark:text-white">{individualTasks.length}</p>
            </div>

            <div className="rounded-xl border border-surface-border dark:border-dark-border p-3">
              <p className="text-xs text-ink-faint dark:text-dark-dynamic">Goal Coverage</p>
              <p className="text-sm font-medium text-ink dark:text-white">
                {individualGoalPercent}% ({individualGoalIds.size}/{totalGoals || 0})
              </p>
            </div>

            <div className="rounded-xl border border-surface-border dark:border-dark-border p-3">
              <p className="text-xs text-ink-faint dark:text-dark-dynamic">Blocked Tasks</p>
              <p className="text-sm font-medium text-ink dark:text-white">{individualBlocked}</p>
            </div>

            <div className="rounded-xl border border-surface-border dark:border-dark-border p-3">
              <p className="text-xs text-ink-faint dark:text-dark-dynamic">Completion Rate</p>
              <p className="text-sm font-medium text-ink dark:text-white">
                {individualCompletionRate}%
              </p>
            </div>

            <div className="rounded-xl border border-surface-border dark:border-dark-border p-3 sm:col-span-2">
              <p className="text-xs text-ink-faint dark:text-dark-dynamic">Last Updated</p>
              <p className="text-sm font-medium text-ink dark:text-white">{individualLastUpdated}</p>
            </div>
          </div>
        </div>

        <TaskListCard
          title="Associate Task Names"
          subtitle="Task names, allocation, and status for the selected associate in the chosen range."
          tasks={individualTasks}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {groupedTeams.map((team) => (
          <div key={team.team} className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Users size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-ink dark:text-white">{team.team}</h3>
            </div>
            <p className="text-xs text-ink-muted dark:text-dark-dynamic">
              Team-level totals for the selected date range.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div>
                <p className="text-xs text-ink-faint dark:text-dark-dynamic">Associates</p>
                <p className="text-sm font-medium text-ink dark:text-white">{team.associates}</p>
              </div>
              <div>
                <p className="text-xs text-ink-faint dark:text-dark-dynamic">No. of Tasks Worked</p>
                <p className="text-sm font-medium text-ink dark:text-white">{team.tasks.length}</p>
              </div>
              <div>
                <p className="text-xs text-ink-faint dark:text-dark-dynamic">Goals Worked</p>
                <p className="text-sm font-medium text-ink dark:text-white">
                  {team.goalsWorked}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-faint dark:text-dark-dynamic">Goal Coverage</p>
                <p className="text-sm font-medium text-ink dark:text-white">
                  {team.goalPercent}% ({team.goalsWorked}/{totalGoals || 0})
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-faint dark:text-dark-dynamic">Blocked Tasks</p>
                <p className="text-sm font-medium text-ink dark:text-white">{team.blocked}</p>
              </div>
              <div>
                <p className="text-xs text-ink-faint dark:text-dark-dynamic">Completion Rate</p>
                <p className="text-sm font-medium text-ink dark:text-white">
                  {team.completionRate}%
                </p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <ChartPanel
            title="Goal Distribution"
            subtitle="How often goals were used in counted tasks inside the selected range."
          >
            {goalDistributionData.length > 0 ? (
              <GoalDistributionChart data={goalDistributionData} />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-ink-muted dark:text-dark-dynamic">
                No goal usage yet.
              </div>
            )}
          </ChartPanel>
        </div>

        <div className="xl:col-span-2">
          <ChartPanel
            title="Team Task Load"
            subtitle="Bar chart showing counted tasks per team in the selected range."
          >
            {teamBarData.length > 0 ? (
              <TeamTaskBarChart data={teamBarData} />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-ink-muted dark:text-dark-dynamic">
                No team task data yet.
              </div>
            )}
          </ChartPanel>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <div className="card p-5">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-ink dark:text-white">Task Trend</h3>
            </div>
            <p className="text-xs text-ink-muted dark:text-dark-dynamic mt-1">
              Daily counted tasks across the selected date range.
            </p>
          </div>

          <div className="h-[260px]">
            <WeeklyTrendLineChart labels={weeklyTrendLabels} values={weeklyTrendValues} />
          </div>
        </div>

        <TeamSummaryTable
          rows={groupedTeams.map((team) => ({
            team: team.team,
            associates: team.associates,
            tasks: team.tasks.length,
            goalsWorked: team.goalsWorked,
            goalPercent: team.goalPercent,
            blocked: team.blocked,
            completionRate: team.completionRate,
          }))}
        />
      </section>
    </div>
  )
}