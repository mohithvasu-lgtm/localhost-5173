import { useMemo, useState } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, ResponsiveContainer, Legend,
} from 'recharts'
import { Download, FileSpreadsheet, FileText, Search } from 'lucide-react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { useApp } from '../data/AppContext'

const STATUS_COLORS = {
  Completed: '#16a34a',
  'In Progress': '#2563eb',
  'Not Started': '#d97706',
  Hold: '#eab308',
  Delayed: '#dc2626',
}

const PRIORITY_COLORS = {
  Critical: '#dc2626',
  High: '#d97706',
  Medium: '#2563eb',
  Low: '#64748b',
}

function normalizeTaskTitle(title) {
  return (title || '').trim().replace(/\s+/g, ' ').toLowerCase()
}

function getTaskAssociateIds(task) {
  if (Array.isArray(task?.associateIds) && task.associateIds.length > 0) {
    return task.associateIds
  }

  if (task?.associateId) {
    return [task.associateId]
  }

  return []
}

function mergeComments(...comments) {
  return comments
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function dedupeTasks(tasks = []) {
  const map = new Map()

  tasks.forEach((task) => {
    const key = normalizeTaskTitle(task.title)
    if (!key) return

    if (!map.has(key)) {
      map.set(key, {
        ...task,
        associateIds: [...getTaskAssociateIds(task)],
      })
      return
    }

    const existing = map.get(key)

    existing.associateIds = Array.from(
      new Set([...getTaskAssociateIds(existing), ...getTaskAssociateIds(task)])
    )

    existing.comments = mergeComments(existing.comments, task.comments)
    existing.remarks = mergeComments(existing.remarks, task.remarks)
    existing.delayReason = mergeComments(existing.delayReason, task.delayReason)
    existing.dependencies = mergeComments(existing.dependencies, task.dependencies)

    if (!existing.priority && task.priority) existing.priority = task.priority
    if (!existing.status && task.status) existing.status = task.status
    if (!existing.source && task.source) existing.source = task.source
    if (!existing.startDate && task.startDate) existing.startDate = task.startDate
    if (!existing.endDate && task.endDate) existing.endDate = task.endDate
    if (!existing.estimatedDuration && task.estimatedDuration) {
      existing.estimatedDuration = task.estimatedDuration
    }
    if (!existing.sprintWeek && task.sprintWeek) existing.sprintWeek = task.sprintWeek
    if (!existing.completedOnTime && task.completedOnTime) {
      existing.completedOnTime = task.completedOnTime
    }
    if (!existing.createdAt && task.createdAt) existing.createdAt = task.createdAt
    if (!existing.updatedAt && task.updatedAt) existing.updatedAt = task.updatedAt

    if (existing.status !== 'Completed' && task.status === 'Completed') {
      existing.status = task.status
      existing.updatedAt = task.updatedAt || existing.updatedAt
    }
  })

  return Array.from(map.values())
}

function SummaryCard({ label, value, accent }) {
  return (
    <div className="card p-4 flex flex-col gap-1">
      <span className="text-xs text-ink-muted dark:text-dark-dynamic">{label}</span>
      <span className="text-2xl font-semibold" style={{ color: accent }}>{value}</span>
    </div>
  )
}

function getAgingBucket(createdAt) {
  const created = new Date(createdAt)
  if (Number.isNaN(created.getTime())) return '0-3 Days'
  const days = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24))
  if (days <= 3) return '0-3 Days'
  if (days <= 7) return '4-7 Days'
  if (days <= 14) return '8-14 Days'
  return '15+ Days'
}

function getWeekLabel(dateStr) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return 'Unknown'
  const firstDay = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d - firstDay) / 86400000 + firstDay.getDay() + 1) / 7)
  return `Week ${week}`
}

function getAssociateNames(task, associates) {
  return getTaskAssociateIds(task)
    .map((id) => associates.find((a) => a.id === id)?.name || id)
    .join(', ')
}

export default function TaskAnalysis() {
  const { associates = [], taskAnalysis = {}, updateTask } = useApp()
  const { newTasks = [], existingTasks = [] } = taskAnalysis

  const [filters, setFilters] = useState({
    assignee: '',
    priority: '',
    status: '',
    source: '',
    search: '',
  })

  const [newHeaderFilters, setNewHeaderFilters] = useState({
    task: '',
    assignee: '',
    priority: '',
    status: '',
    startDate: '',
    endDate: '',
    source: '',
    sprintWeek: '',
    remarks: '',
  })

  const [existingHeaderFilters, setExistingHeaderFilters] = useState({
    task: '',
    assignee: '',
    status: '',
    startDate: '',
    endDate: '',
    onTime: '',
    delayReason: '',
    dependencies: '',
  })

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function updateNewHeaderFilter(key, value) {
    setNewHeaderFilters((prev) => ({ ...prev, [key]: value }))
  }

  function updateExistingHeaderFilter(key, value) {
    setExistingHeaderFilters((prev) => ({ ...prev, [key]: value }))
  }

  function clearNewHeaderFilters() {
    setNewHeaderFilters({
      task: '',
      assignee: '',
      priority: '',
      status: '',
      startDate: '',
      endDate: '',
      source: '',
      sprintWeek: '',
      remarks: '',
    })
  }

  function clearExistingHeaderFilters() {
    setExistingHeaderFilters({
      task: '',
      assignee: '',
      status: '',
      startDate: '',
      endDate: '',
      onTime: '',
      delayReason: '',
      dependencies: '',
    })
  }

  const dedupedNewTasks = useMemo(() => dedupeTasks(newTasks), [newTasks])
  const dedupedExistingTasks = useMemo(() => dedupeTasks(existingTasks), [existingTasks])

  function matchesFilters(task) {
    if (filters.assignee && !getTaskAssociateIds(task).includes(filters.assignee)) return false
    if (filters.priority && task.priority !== filters.priority) return false
    if (filters.status && task.status !== filters.status) return false
    if (filters.source && task.source !== filters.source) return false
    if (
      filters.search &&
      !String(task.title || '').toLowerCase().includes(filters.search.toLowerCase())
    ) return false
    return true
  }

  const filteredNewTasks = useMemo(() => {
    return dedupedNewTasks.filter((task) => {
      if (!matchesFilters(task)) return false

      const assigneeNames = getAssociateNames(task, associates).toLowerCase()

      if (
        newHeaderFilters.task &&
        !String(task.title || '').toLowerCase().includes(newHeaderFilters.task.toLowerCase())
      ) return false

      if (
        newHeaderFilters.assignee &&
        !assigneeNames.includes(newHeaderFilters.assignee.toLowerCase())
      ) return false

      if (newHeaderFilters.priority && String(task.priority || '') !== newHeaderFilters.priority) return false
      if (newHeaderFilters.status && String(task.status || '') !== newHeaderFilters.status) return false
      if (newHeaderFilters.startDate && String(task.startDate || '') !== newHeaderFilters.startDate) return false
      if (newHeaderFilters.endDate && String(task.endDate || '') !== newHeaderFilters.endDate) return false
      if (newHeaderFilters.source && String(task.source || '') !== newHeaderFilters.source) return false

      if (
        newHeaderFilters.sprintWeek &&
        !String(task.sprintWeek || '').toLowerCase().includes(newHeaderFilters.sprintWeek.toLowerCase())
      ) return false

      if (
        newHeaderFilters.remarks &&
        !String(task.remarks || '').toLowerCase().includes(newHeaderFilters.remarks.toLowerCase())
      ) return false

      return true
    })
  }, [dedupedNewTasks, associates, filters, newHeaderFilters])

  const filteredExistingTasks = useMemo(() => {
    return dedupedExistingTasks.filter((task) => {
      if (!matchesFilters(task)) return false

      const assigneeNames = getAssociateNames(task, associates).toLowerCase()

      if (
        existingHeaderFilters.task &&
        !String(task.title || '').toLowerCase().includes(existingHeaderFilters.task.toLowerCase())
      ) return false

      if (
        existingHeaderFilters.assignee &&
        !assigneeNames.includes(existingHeaderFilters.assignee.toLowerCase())
      ) return false

      if (existingHeaderFilters.status && String(task.status || '') !== existingHeaderFilters.status) return false
      if (existingHeaderFilters.startDate && String(task.startDate || '') !== existingHeaderFilters.startDate) return false
      if (existingHeaderFilters.endDate && String(task.endDate || '') !== existingHeaderFilters.endDate) return false

      if (
        existingHeaderFilters.onTime &&
        String(task.completedOnTime || '') !== existingHeaderFilters.onTime
      ) return false

      if (
        existingHeaderFilters.delayReason &&
        !String(task.delayReason || '').toLowerCase().includes(existingHeaderFilters.delayReason.toLowerCase())
      ) return false

      if (
        existingHeaderFilters.dependencies &&
        !String(task.dependencies || '').toLowerCase().includes(existingHeaderFilters.dependencies.toLowerCase())
      ) return false

      return true
    })
  }, [dedupedExistingTasks, associates, filters, existingHeaderFilters])

  const allTasks = useMemo(
    () => dedupeTasks([...dedupedNewTasks, ...dedupedExistingTasks]),
    [dedupedNewTasks, dedupedExistingTasks]
  )

  const summary = useMemo(() => {
    const completed = allTasks.filter((t) => t.status === 'Completed')
    const completedOnTime = completed.filter((t) => t.completedOnTime !== 'No')
    const delayed = allTasks.filter((t) => t.status === 'Delayed' || t.completedOnTime === 'No')
    const onHold = allTasks.filter((t) => t.status === 'Hold')
    const inProgress = allTasks.filter((t) => t.status === 'In Progress')
    const notStarted = allTasks.filter((t) => t.status === 'Not Started')

    return {
      newCount: filteredNewTasks.length,
      existingCount: filteredExistingTasks.length,
      completedOnTime: completedOnTime.length,
      delayed: delayed.length,
      onHold: onHold.length,
      inProgress: inProgress.length,
      notStarted: notStarted.length,
      completionPct: allTasks.length
        ? Math.round((completed.length / allTasks.length) * 100)
        : 0,
    }
  }, [allTasks, filteredNewTasks.length, filteredExistingTasks.length])

  const statusPieData = useMemo(() => {
    return Object.keys(STATUS_COLORS)
      .map((status) => ({
        name: status,
        value: allTasks.filter((t) => t.status === status).length,
      }))
      .filter((d) => d.value > 0)
  }, [allTasks])

  const priorityPieData = useMemo(() => {
    return Object.keys(PRIORITY_COLORS)
      .map((priority) => ({
        name: priority,
        value: allTasks.filter((t) => t.priority === priority).length,
      }))
      .filter((d) => d.value > 0)
  }, [allTasks])

  const assigneeBarData = useMemo(() => {
    return associates
      .map((a) => ({
        name: a.name,
        count: allTasks.filter((t) => getTaskAssociateIds(t).includes(a.id)).length,
      }))
      .filter((d) => d.count > 0)
  }, [associates, allTasks])

  const weeklyCreatedData = useMemo(() => {
    const counts = {}
    allTasks.forEach((t) => {
      const label = getWeekLabel(t.createdAt)
      counts[label] = (counts[label] || 0) + 1
    })
    return Object.entries(counts).map(([week, count]) => ({ week, count }))
  }, [allTasks])

  const onTimeDonutData = useMemo(() => {
    const onTime = allTasks.filter((t) => t.completedOnTime === 'Yes').length
    const delayed = allTasks.filter((t) => t.completedOnTime === 'No').length
    return [
      { name: 'Completed On Time', value: onTime },
      { name: 'Delayed', value: delayed },
    ].filter((d) => d.value > 0)
  }, [allTasks])

  const agingData = useMemo(() => {
    const buckets = { '0-3 Days': 0, '4-7 Days': 0, '8-14 Days': 0, '15+ Days': 0 }
    allTasks.forEach((t) => {
      if (t.status !== 'Completed') {
        buckets[getAgingBucket(t.createdAt)] += 1
      }
    })
    return Object.entries(buckets).map(([range, count]) => ({ range, count }))
  }, [allTasks])

  const completionTrendData = useMemo(() => {
    const counts = {}
    allTasks
      .filter((t) => t.status === 'Completed')
      .forEach((t) => {
        const label = getWeekLabel(t.updatedAt)
        counts[label] = (counts[label] || 0) + 1
      })
    return Object.entries(counts).map(([week, completed]) => ({ week, completed }))
  }, [allTasks])

  const insights = useMemo(() => {
    const list = []
    list.push(`${summary.newCount} new task${summary.newCount === 1 ? '' : 's'} created this week.`)

    if (assigneeBarData.length) {
      const top = [...assigneeBarData].sort((a, b) => b.count - a.count)[0]
      if (top?.count) list.push(`${top.name} has the highest workload.`)
    }

    list.push(
      `${summary.delayed} task${summary.delayed === 1 ? '' : 's'} ${
        summary.delayed === 1 ? 'is' : 'are'
      } delayed.`
    )
    list.push(`${summary.completionPct}% tasks completed on time.`)

    const completedTasks = allTasks.filter(
      (t) => t.status === 'Completed' && t.startDate && t.updatedAt
    )

    if (completedTasks.length) {
      const avgDays =
        completedTasks.reduce((sum, t) => {
          const start = new Date(t.startDate)
          const end = new Date(t.updatedAt)
          const diff = (end - start) / (1000 * 60 * 60 * 24)
          return sum + (Number.isFinite(diff) ? diff : 0)
        }, 0) / completedTasks.length
      list.push(`Average completion time is ${avgDays.toFixed(1)} days.`)
    }

    return list
  }, [summary, assigneeBarData, allTasks])

  function handleDelayReasonChange(taskId, value) {
    updateTask(taskId, { delayReason: value })
  }

  function handleCompletedOnTimeChange(taskId, value) {
    updateTask(taskId, {
      completedOnTime: value,
      delayReason: value === 'Yes' ? '' : undefined,
    })
  }

  function exportExcel() {
    const wb = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        filteredNewTasks.map((t) => ({
          Task: t.title,
          Assignee: getAssociateNames(t, associates),
          Priority: t.priority,
          Status: t.status,
          CreatedDate: t.createdAt,
          StartDate: t.startDate,
          EndDate: t.endDate,
          EstimatedDuration: t.estimatedDuration,
          Source: t.source,
          SprintWeek: t.sprintWeek,
          Remarks: t.remarks,
        }))
      ),
      'New Tasks'
    )

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        filteredExistingTasks.map((t) => ({
          Task: t.title,
          Assignee: getAssociateNames(t, associates),
          Status: t.status,
          StartDate: t.startDate,
          TargetEndDate: t.endDate,
          CompletedOnTime: t.completedOnTime,
          DelayReason: t.delayReason,
          LastUpdated: t.updatedAt,
          Dependencies: t.dependencies,
        }))
      ),
      'Existing Tasks'
    )

    XLSX.writeFile(wb, `task-analysis-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  function exportCSV() {
    const ws = XLSX.utils.json_to_sheet(
      [...filteredNewTasks, ...filteredExistingTasks].map((t) => ({
        Task: t.title,
        Assignee: getAssociateNames(t, associates),
        Status: t.status,
        Priority: t.priority,
        StartDate: t.startDate,
        EndDate: t.endDate,
      }))
    )

    const csv = XLSX.utils.sheet_to_csv(ws)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `task-analysis-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  function exportPDF() {
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text('Task Analysis Report', 14, 15)
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22)
    doc.text(
      `New: ${summary.newCount}  Existing: ${summary.existingCount}  Delayed: ${summary.delayed}  Completion: ${summary.completionPct}%`,
      14,
      28
    )

    doc.autoTable({
      startY: 35,
      head: [['Task', 'Assignee', 'Status', 'Priority', 'Start', 'End']],
      body: [...filteredNewTasks, ...filteredExistingTasks].map((t) => [
        t.title,
        getAssociateNames(t, associates),
        t.status,
        t.priority,
        t.startDate || '—',
        t.endDate || '—',
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    })

    doc.save(`task-analysis-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  const priorityOptions = ['Critical', 'High', 'Medium', 'Low']
  const statusOptions = ['Not Started', 'In Progress', 'Hold', 'Delayed', 'Completed']
  const sourceOptions = ['Stand-up Meeting', 'Kanban Board', 'Scrum Meeting', 'Direct Assignment', 'Backlog']

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink dark:text-white">
            Task Analysis
          </h2>
          <p className="mt-1 text-sm text-ink-muted dark:text-dark-dynamic">
            Track new tasks created this week and monitor progress of ongoing work.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={exportExcel}>
            <FileSpreadsheet size={15} /> Excel
          </button>
          <button className="btn-secondary" onClick={exportCSV}>
            <Download size={15} /> CSV
          </button>
          <button className="btn-secondary" onClick={exportPDF}>
            <FileText size={15} /> PDF
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard label="New Tasks This Week" value={summary.newCount} accent="#2563eb" />
        <SummaryCard label="Existing Tasks" value={summary.existingCount} accent="#64748b" />
        <SummaryCard label="Completed On Time" value={summary.completedOnTime} accent="#16a34a" />
        <SummaryCard label="Delayed Tasks" value={summary.delayed} accent="#dc2626" />
        <SummaryCard label="On Hold" value={summary.onHold} accent="#eab308" />
        <SummaryCard label="In Progress" value={summary.inProgress} accent="#2563eb" />
        <SummaryCard label="Not Started" value={summary.notStarted} accent="#d97706" />
        <SummaryCard label="Completion %" value={`${summary.completionPct}%`} accent="#16a34a" />
      </section>

      <section className="card space-y-3 p-4">
        <h3 className="text-sm font-semibold text-ink dark:text-white">Auto Insights</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm text-ink-muted dark:text-dark-dynamic">
          {insights.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="card space-y-3 p-4">
        <h3 className="text-sm font-semibold text-ink dark:text-white">Filters</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <select
            className="input"
            value={filters.assignee}
            onChange={(e) => updateFilter('assignee', e.target.value)}
          >
            <option value="">All Assignees</option>
            {associates.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          <select
            className="input"
            value={filters.priority}
            onChange={(e) => updateFilter('priority', e.target.value)}
          >
            <option value="">All Priorities</option>
            {priorityOptions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            className="input"
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            className="input"
            value={filters.source}
            onChange={(e) => updateFilter('source', e.target.value)}
          >
            <option value="">All Sources</option>
            {sourceOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint dark:text-dark-dynamic" />
            <input
              className="input pl-8"
              placeholder="Search task"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card p-4">
          <h3 className="mb-3 text-sm font-semibold text-ink dark:text-white">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusPieData} dataKey="value" nameKey="name" outerRadius={90} label>
                {statusPieData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <h3 className="mb-3 text-sm font-semibold text-ink dark:text-white">Tasks by Assignee</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={assigneeBarData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <h3 className="mb-3 text-sm font-semibold text-ink dark:text-white">Tasks Created per Week</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={weeklyCreatedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <h3 className="mb-3 text-sm font-semibold text-ink dark:text-white">On-Time Completion Rate</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={onTimeDonutData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={90}
                label
              >
                {onTimeDonutData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.name === 'Delayed' ? '#dc2626' : '#16a34a'}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <h3 className="mb-3 text-sm font-semibold text-ink dark:text-white">Task Aging</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={agingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#d97706" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <h3 className="mb-3 text-sm font-semibold text-ink dark:text-white">Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={priorityPieData} dataKey="value" nameKey="name" outerRadius={90} label>
                {priorityPieData.map((entry) => (
                  <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4 md:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-ink dark:text-white">Completion Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={completionTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="completed" stroke="#16a34a" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card space-y-3 overflow-x-auto p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-ink dark:text-white">
            New Tasks Created This Week ({filteredNewTasks.length})
          </h3>
          <button className="btn-secondary" onClick={clearNewHeaderFilters}>
            Clear Header Filters
          </button>
        </div>

        <table className="w-full min-w-[1400px] text-sm">
          <thead>
            <tr className="border-b border-surface-border text-xs text-ink-muted dark:border-dark-border dark:text-dark-dynamic">
              <th className="py-2 text-left">Task Name</th>
              <th className="py-2 text-left">Assigned To</th>
              <th className="py-2 text-left">Priority</th>
              <th className="py-2 text-left">Status</th>
              <th className="py-2 text-left">Created</th>
              <th className="py-2 text-left">Start</th>
              <th className="py-2 text-left">End</th>
              <th className="py-2 text-left">Est. Duration</th>
              <th className="py-2 text-left">Source</th>
              <th className="py-2 text-left">Sprint/Week</th>
              <th className="py-2 text-left">Remarks</th>
            </tr>
            <tr className="border-b border-surface-border/70 dark:border-dark-border/70">
              <th className="py-2 pr-2">
                <input className="input w-full" placeholder="Filter task" value={newHeaderFilters.task} onChange={(e) => updateNewHeaderFilter('task', e.target.value)} />
              </th>
              <th className="py-2 pr-2">
                <input className="input w-full" placeholder="Filter assignee" value={newHeaderFilters.assignee} onChange={(e) => updateNewHeaderFilter('assignee', e.target.value)} />
              </th>
              <th className="py-2 pr-2">
                <select className="input w-full" value={newHeaderFilters.priority} onChange={(e) => updateNewHeaderFilter('priority', e.target.value)}>
                  <option value="">All</option>
                  {priorityOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </th>
              <th className="py-2 pr-2">
                <select className="input w-full" value={newHeaderFilters.status} onChange={(e) => updateNewHeaderFilter('status', e.target.value)}>
                  <option value="">All</option>
                  {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </th>
              <th className="py-2 pr-2"><span className="text-xs text-ink-faint dark:text-dark-dynamic">—</span></th>
              <th className="py-2 pr-2">
                <input type="date" className="input w-full" value={newHeaderFilters.startDate} onChange={(e) => updateNewHeaderFilter('startDate', e.target.value)} />
              </th>
              <th className="py-2 pr-2">
                <input type="date" className="input w-full" value={newHeaderFilters.endDate} onChange={(e) => updateNewHeaderFilter('endDate', e.target.value)} />
              </th>
              <th className="py-2 pr-2"><span className="text-xs text-ink-faint dark:text-dark-dynamic">—</span></th>
              <th className="py-2 pr-2">
                <select className="input w-full" value={newHeaderFilters.source} onChange={(e) => updateNewHeaderFilter('source', e.target.value)}>
                  <option value="">All</option>
                  {sourceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </th>
              <th className="py-2 pr-2">
                <input className="input w-full" placeholder="Filter week" value={newHeaderFilters.sprintWeek} onChange={(e) => updateNewHeaderFilter('sprintWeek', e.target.value)} />
              </th>
              <th className="py-2 pr-2">
                <input className="input w-full" placeholder="Filter remarks" value={newHeaderFilters.remarks} onChange={(e) => updateNewHeaderFilter('remarks', e.target.value)} />
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredNewTasks.length > 0 ? (
              filteredNewTasks.map((t) => (
                <tr key={t.id} className="border-b border-surface-border/70 dark:border-dark-border/70">
                  <td className="py-2 min-w-[220px]">
                    <input className="input w-full" value={t.title} onChange={(e) => updateTask(t.id, { title: e.target.value })} />
                  </td>
                  <td className="py-2 min-w-[200px]">
                    <select
                      multiple
                      className="input h-16 w-full"
                      value={getTaskAssociateIds(t)}
                      onChange={(e) =>
                        updateTask(t.id, {
                          associateIds: Array.from(e.target.selectedOptions).map((o) => o.value),
                        })
                      }
                    >
                      {associates.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 min-w-[130px]">
                    <select className="input w-full" value={t.priority || 'Medium'} onChange={(e) => updateTask(t.id, { priority: e.target.value })}>
                      <option>Critical</option>
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </td>
                  <td className="py-2 min-w-[150px]">
                    <select className="input w-full" value={t.status || 'Not Started'} onChange={(e) => updateTask(t.id, { status: e.target.value })}>
                      <option>Not Started</option>
                      <option>In Progress</option>
                      <option>Hold</option>
                      <option>Delayed</option>
                      <option>Completed</option>
                    </select>
                  </td>
                  <td className="py-2 min-w-[120px]">
                    {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-2 min-w-[150px]">
                    <input type="date" className={`input w-full ${!t.startDate ? 'border-red-400' : ''}`} value={t.startDate || ''} onChange={(e) => updateTask(t.id, { startDate: e.target.value })} />
                  </td>
                  <td className="py-2 min-w-[150px]">
                    <input type="date" className={`input w-full ${!t.endDate ? 'border-red-400' : ''}`} value={t.endDate || ''} onChange={(e) => updateTask(t.id, { endDate: e.target.value })} />
                  </td>
                  <td className="py-2 min-w-[130px]">
                    <input className="input w-full" value={t.estimatedDuration || ''} placeholder="e.g. 3 days" onChange={(e) => updateTask(t.id, { estimatedDuration: e.target.value })} />
                  </td>
                  <td className="py-2 min-w-[150px]">
                    <select className="input w-full" value={t.source || 'Direct Assignment'} onChange={(e) => updateTask(t.id, { source: e.target.value })}>
                      <option>Stand-up Meeting</option>
                      <option>Kanban Board</option>
                      <option>Scrum Meeting</option>
                      <option>Direct Assignment</option>
                      <option>Backlog</option>
                    </select>
                  </td>
                  <td className="py-2 min-w-[130px]">
                    <input className="input w-full" value={t.sprintWeek || ''} placeholder="e.g. Week 3" onChange={(e) => updateTask(t.id, { sprintWeek: e.target.value })} />
                  </td>
                  <td className="py-2 min-w-[200px]">
                    <input className="input w-full" value={t.remarks || ''} placeholder="Add remarks" onChange={(e) => updateTask(t.id, { remarks: e.target.value })} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={11} className="py-8 text-center text-sm text-ink-muted dark:text-dark-dynamic">
                  No new tasks created this week.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="card space-y-3 overflow-x-auto p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-ink dark:text-white">
            Existing Tasks ({filteredExistingTasks.length})
          </h3>
          <button className="btn-secondary" onClick={clearExistingHeaderFilters}>
            Clear Header Filters
          </button>
        </div>

        <table className="w-full min-w-[1300px] text-sm">
          <thead>
            <tr className="border-b border-surface-border text-xs text-ink-muted dark:border-dark-border dark:text-dark-dynamic">
              <th className="py-2 text-left">Task</th>
              <th className="py-2 text-left">Assigned To</th>
              <th className="py-2 text-left">Status</th>
              <th className="py-2 text-left">Start</th>
              <th className="py-2 text-left">Target End</th>
              <th className="py-2 text-left">On Time</th>
              <th className="py-2 text-left">Delay Reason</th>
              <th className="py-2 text-left">Last Updated</th>
              <th className="py-2 text-left">Dependencies</th>
            </tr>
            <tr className="border-b border-surface-border/70 dark:border-dark-border/70">
              <th className="py-2 pr-2">
                <input className="input w-full" placeholder="Filter task" value={existingHeaderFilters.task} onChange={(e) => updateExistingHeaderFilter('task', e.target.value)} />
              </th>
              <th className="py-2 pr-2">
                <input className="input w-full" placeholder="Filter assignee" value={existingHeaderFilters.assignee} onChange={(e) => updateExistingHeaderFilter('assignee', e.target.value)} />
              </th>
              <th className="py-2 pr-2">
                <select className="input w-full" value={existingHeaderFilters.status} onChange={(e) => updateExistingHeaderFilter('status', e.target.value)}>
                  <option value="">All</option>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Hold">Hold</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Completed">Completed</option>
                </select>
              </th>
              <th className="py-2 pr-2">
                <input type="date" className="input w-full" value={existingHeaderFilters.startDate} onChange={(e) => updateExistingHeaderFilter('startDate', e.target.value)} />
              </th>
              <th className="py-2 pr-2">
                <input type="date" className="input w-full" value={existingHeaderFilters.endDate} onChange={(e) => updateExistingHeaderFilter('endDate', e.target.value)} />
              </th>
              <th className="py-2 pr-2">
                <select className="input w-full" value={existingHeaderFilters.onTime} onChange={(e) => updateExistingHeaderFilter('onTime', e.target.value)}>
                  <option value="">All</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </th>
              <th className="py-2 pr-2">
                <input className="input w-full" placeholder="Filter reason" value={existingHeaderFilters.delayReason} onChange={(e) => updateExistingHeaderFilter('delayReason', e.target.value)} />
              </th>
              <th className="py-2 pr-2">
                <span className="text-xs text-ink-faint dark:text-dark-dynamic">—</span>
              </th>
              <th className="py-2 pr-2">
                <input className="input w-full" placeholder="Filter dependencies" value={existingHeaderFilters.dependencies} onChange={(e) => updateExistingHeaderFilter('dependencies', e.target.value)} />
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredExistingTasks.length > 0 ? (
              filteredExistingTasks.map((t) => (
                <tr key={t.id} className="border-b border-surface-border/70 dark:border-dark-border/70">
                  <td className="py-2 min-w-[220px]">
                    <input className="input w-full" value={t.title} onChange={(e) => updateTask(t.id, { title: e.target.value })} />
                  </td>
                  <td className="py-2 min-w-[220px]">
                    <select
                      multiple
                      className="input h-16 w-full"
                      value={getTaskAssociateIds(t)}
                      onChange={(e) =>
                        updateTask(t.id, {
                          associateIds: Array.from(e.target.selectedOptions).map((o) => o.value),
                        })
                      }
                    >
                      {associates.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 min-w-[150px]">
                    <select className="input w-full" value={t.status || 'Not Started'} onChange={(e) => updateTask(t.id, { status: e.target.value })}>
                      <option>Not Started</option>
                      <option>In Progress</option>
                      <option>Hold</option>
                      <option>Delayed</option>
                      <option>Completed</option>
                    </select>
                  </td>
                  <td className="py-2 min-w-[150px]">
                    <input type="date" className="input w-full" value={t.startDate || ''} onChange={(e) => updateTask(t.id, { startDate: e.target.value })} />
                  </td>
                  <td className="py-2 min-w-[150px]">
                    <input type="date" className="input w-full" value={t.endDate || ''} onChange={(e) => updateTask(t.id, { endDate: e.target.value })} />
                  </td>
                  <td className="py-2 min-w-[110px]">
                    <select className="input w-full" value={t.completedOnTime || ''} onChange={(e) => handleCompletedOnTimeChange(t.id, e.target.value)}>
                      <option value="">—</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </td>
                  <td className="py-2 min-w-[200px]">
                    <input
                      className="input w-full"
                      disabled={t.completedOnTime !== 'No'}
                      value={t.delayReason || ''}
                      onChange={(e) => handleDelayReasonChange(t.id, e.target.value)}
                      placeholder={t.completedOnTime === 'No' ? 'Enter reason' : ''}
                    />
                  </td>
                  <td className="py-2 min-w-[130px]">
                    {t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-2 min-w-[220px]">
                    <input
                      className="input w-full"
                      value={t.dependencies || ''}
                      placeholder="Enter dependencies"
                      onChange={(e) => updateTask(t.id, { dependencies: e.target.value })}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="py-8 text-center text-sm text-ink-muted dark:text-dark-dynamic">
                  No existing tasks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}