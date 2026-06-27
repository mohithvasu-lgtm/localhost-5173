import { useEffect, useMemo, useState } from 'react'
import {
  FileText,
  Filter,
  AlertTriangle,
  CheckCircle2,
  ListTodo,
  Users,
  Download,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  X,
} from 'lucide-react'
import { useApp } from '../data/AppContext'

function isFilledTask(task) {
  return Boolean(task?.task?.trim())
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
          <p className="text-xs font-medium text-ink-muted dark:text-dark-dynamic mb-1">{title}</p>
          <h3 className="text-2xl font-semibold tracking-tight text-ink dark:text-white">{value}</h3>
          <p className="text-xs text-ink-faint dark:text-dark-dynamic mt-1">{subtitle}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconMap[tone] || iconMap.default}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  )
}

function escapeCsvValue(value) {
  const safe = String(value ?? '')
  if (safe.includes('"') || safe.includes(',') || safe.includes('\n')) {
    return `"${safe.replace(/"/g, '""')}"`
  }
  return safe
}

function downloadCsv(filename, rows) {
  if (!rows.length) return

  const headers = Object.keys(rows[0])
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((header) => escapeCsvValue(row[header])).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function SortableHeader({ label, column, sortConfig, onSort }) {
  const isActive = sortConfig.key === column

  return (
    <th className="text-left py-3 pr-3">
      <button
        type="button"
        onClick={() => onSort(column)}
        className={`inline-flex items-center gap-1 text-xs font-medium ${
          isActive ? 'text-primary' : 'text-ink-muted dark:text-dark-dynamic'
        }`}
      >
        {label}
        <ArrowUpDown size={13} />
      </button>
    </th>
  )
}

function FilterChip({ active, label, onClick, tone = 'default' }) {
  const activeStyles = {
    default: 'bg-primary text-white border-primary',
    success: 'bg-green-600 text-white border-green-600',
    warning: 'bg-amber-500 text-white border-amber-500',
    danger: 'bg-rose-600 text-white border-rose-600',
    neutral: 'bg-ink text-white border-ink dark:bg-white dark:text-ink dark:border-white',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? activeStyles[tone] || activeStyles.default
          : 'border-surface-border bg-surface text-ink-muted dark:border-dark-border dark:bg-dark-surface dark:text-dark-dynamic'
      }`}
    >
      {label}
    </button>
  )
}

export default function Reports() {
  const { associates, standups, ready } = useApp()
  const [selectedAssociate, setSelectedAssociate] = useState('all')
  const [selectedDate, setSelectedDate] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [selectedStatuses, setSelectedStatuses] = useState([])
  const [selectedPriorities, setSelectedPriorities] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({
    date: true,
    associate: true,
    task: true,
    status: true,
    priority: true,
    blocker: true,
    allocation: true,
  })

  const reportRows = useMemo(() => {
    const rows = []

    standups.forEach((day) => {
      ;(day.associates || []).forEach((associateEntry) => {
        if (associateEntry.isOnLeave) return

        const associate = associates.find((a) => a.id === associateEntry.associateId)
        if (!associate) return

        ;(associateEntry.tasks || [])
          .filter(isFilledTask)
          .forEach((task) => {
            rows.push({
              id: `${day.date}-${associate.id}-${task.id}`,
              date: day.date,
              associateId: associate.id,
              associateName: associate.name,
              employeeId: associate.employeeId,
              team: associate.team,
              taskName: task.task,
              goalId: task.goalId || '',
              status: task.status || 'Not Started',
              priority: task.priority || 'Medium',
              blocker: task.blocker || 'None',
              allocation: task.allocation || '0',
              comments: task.comments || '',
            })
          })
      })
    })

    return rows
  }, [standups, associates])

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return reportRows.filter((row) => {
      const associateMatch =
        selectedAssociate === 'all' || row.associateId === selectedAssociate
      const dateMatch =
        selectedDate === 'all' || row.date === selectedDate

      const searchMatch =
        !query ||
        row.associateName.toLowerCase().includes(query) ||
        row.team.toLowerCase().includes(query) ||
        row.taskName.toLowerCase().includes(query) ||
        row.status.toLowerCase().includes(query) ||
        row.priority.toLowerCase().includes(query) ||
        row.blocker.toLowerCase().includes(query)

      const statusMatch =
        selectedStatuses.length === 0 || selectedStatuses.includes(row.status)

      const priorityMatch =
        selectedPriorities.length === 0 || selectedPriorities.includes(row.priority)

      return associateMatch && dateMatch && searchMatch && statusMatch && priorityMatch
    })
  }, [
    reportRows,
    selectedAssociate,
    selectedDate,
    searchQuery,
    selectedStatuses,
    selectedPriorities,
  ])

  const sortedRows = useMemo(() => {
    const rows = [...filteredRows]

    rows.sort((a, b) => {
      const aValue = String(a[sortConfig.key] ?? '').toLowerCase()
      const bValue = String(b[sortConfig.key] ?? '').toLowerCase()

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return rows
  }, [filteredRows, sortConfig])

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage

  const paginatedRows = useMemo(() => {
    return sortedRows.slice(startIndex, endIndex)
  }, [sortedRows, startIndex, endIndex])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedAssociate, selectedDate, searchQuery, rowsPerPage, selectedStatuses, selectedPriorities])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const summary = useMemo(() => {
    const totalTasks = sortedRows.length
    const completed = sortedRows.filter((row) => row.status === 'Completed').length
    const blocked = sortedRows.filter((row) => row.status === 'Blocked').length
    const associatesCovered = new Set(sortedRows.map((row) => row.associateId)).size

    return {
      totalTasks,
      completed,
      blocked,
      associatesCovered,
    }
  }, [sortedRows])

  const associateSummary = useMemo(() => {
    const grouped = new Map()

    sortedRows.forEach((row) => {
      if (!grouped.has(row.associateId)) {
        grouped.set(row.associateId, {
          associateId: row.associateId,
          associateName: row.associateName,
          employeeId: row.employeeId,
          team: row.team,
          totalTasks: 0,
          completed: 0,
          blocked: 0,
          allocationSum: 0,
        })
      }

      const item = grouped.get(row.associateId)
      item.totalTasks += 1
      if (row.status === 'Completed') item.completed += 1
      if (row.status === 'Blocked') item.blocked += 1

      const allocation = parseFloat(row.allocation)
      if (!Number.isNaN(allocation)) {
        item.allocationSum += allocation
      }
    })

    return Array.from(grouped.values()).map((item) => ({
      ...item,
      avgAllocation: item.totalTasks ? (item.allocationSum / item.totalTasks).toFixed(2) : '0.00',
      completionRate: item.totalTasks
        ? Math.round((item.completed / item.totalTasks) * 100)
        : 0,
    }))
  }, [sortedRows])

  const blockedRows = sortedRows.filter((row) => row.status === 'Blocked')
  const availableDates = [...new Set(reportRows.map((row) => row.date))].sort((a, b) => b.localeCompare(a))

  function handleSort(column) {
    setSortConfig((current) => {
      if (current.key === column) {
        return {
          key: column,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        }
      }

      return {
        key: column,
        direction: 'asc',
      }
    })
  }

  function handleColumnToggle(columnKey) {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }))
  }

  function toggleArrayFilter(value, setter) {
    setter((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    )
  }

  function clearQuickFilters() {
    setSelectedStatuses([])
    setSelectedPriorities([])
  }

  function handleExportCurrentView() {
    const exportRows = sortedRows.map((row) => ({
      Date: row.date,
      Associate: row.associateName,
      EmployeeID: row.employeeId,
      Team: row.team,
      Task: row.taskName,
      Status: row.status,
      Priority: row.priority,
      Blocker: row.blocker,
      Allocation: row.allocation,
      Comments: row.comments,
    }))

    const fileName = `reports-current-view-${selectedDate}-${selectedAssociate}.csv`
    downloadCsv(fileName, exportRows)
  }

  function handleExportBlockedTasks() {
    const exportRows = blockedRows.map((row) => ({
      Date: row.date,
      Associate: row.associateName,
      EmployeeID: row.employeeId,
      Team: row.team,
      Task: row.taskName,
      Blocker: row.blocker,
      Allocation: row.allocation,
      Comments: row.comments,
    }))

    const fileName = `reports-blocked-tasks-${selectedDate}-${selectedAssociate}.csv`
    downloadCsv(fileName, exportRows)
  }

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
          <h2 className="text-xl font-semibold tracking-tight text-ink dark:text-white">Reports</h2>
          <p className="text-sm text-ink-muted dark:text-dark-dynamic mt-1">
            Date-wise and associate-wise reporting across saved stand-up entries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="btn-secondary"
            onClick={handleExportCurrentView}
            disabled={sortedRows.length === 0}
          >
            <Download size={15} /> Export Current View
          </button>

          <button
            className="btn-secondary"
            onClick={handleExportBlockedTasks}
            disabled={blockedRows.length === 0}
          >
            <Download size={15} /> Export Blocked Tasks
          </button>

          <span className="badge bg-primary/10 text-primary">Step 13 Quick Filters</span>
        </div>
      </section>

      <section className="card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-ink dark:text-white">Filters</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="label">Associate</label>
            <select
              className="select"
              value={selectedAssociate}
              onChange={(e) => setSelectedAssociate(e.target.value)}
            >
              <option value="all">All Associates</option>
              {associates.map((associate) => (
                <option key={associate.id} value={associate.id}>
                  {associate.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Date</label>
            <select
              className="select"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            >
              <option value="all">All Dates</option>
              {availableDates.map((date) => (
                <option key={date} value={date}>
                  {date}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Search</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint dark:text-dark-dynamic" />
              <input
                type="text"
                className="input pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Task, associate, team, blocker..."
              />
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <div className="mb-2 text-xs font-medium text-ink-muted dark:text-dark-dynamic">
              Quick Status Filters
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                label="Completed"
                active={selectedStatuses.includes('Completed')}
                onClick={() => toggleArrayFilter('Completed', setSelectedStatuses)}
                tone="success"
              />
              <FilterChip
                label="In Progress"
                active={selectedStatuses.includes('In Progress')}
                onClick={() => toggleArrayFilter('In Progress', setSelectedStatuses)}
                tone="default"
              />
              <FilterChip
                label="Blocked"
                active={selectedStatuses.includes('Blocked')}
                onClick={() => toggleArrayFilter('Blocked', setSelectedStatuses)}
                tone="danger"
              />
              <FilterChip
                label="Not Started"
                active={selectedStatuses.includes('Not Started')}
                onClick={() => toggleArrayFilter('Not Started', setSelectedStatuses)}
                tone="neutral"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-medium text-ink-muted dark:text-dark-dynamic">
              Quick Priority Filters
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                label="High"
                active={selectedPriorities.includes('High')}
                onClick={() => toggleArrayFilter('High', setSelectedPriorities)}
                tone="danger"
              />
              <FilterChip
                label="Medium"
                active={selectedPriorities.includes('Medium')}
                onClick={() => toggleArrayFilter('Medium', setSelectedPriorities)}
                tone="warning"
              />
              <FilterChip
                label="Low"
                active={selectedPriorities.includes('Low')}
                onClick={() => toggleArrayFilter('Low', setSelectedPriorities)}
                tone="success"
              />
            </div>
          </div>

          <div>
            <button type="button" className="btn-secondary" onClick={clearQuickFilters}>
              <X size={14} /> Clear Quick Filters
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Tasks"
          value={summary.totalTasks}
          subtitle="After all active filters"
          icon={ListTodo}
          tone="primary"
        />
        <StatCard
          title="Completed"
          value={summary.completed}
          subtitle="Tasks marked completed"
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          title="Blocked"
          value={summary.blocked}
          subtitle="Needs follow-up"
          icon={AlertTriangle}
          tone="warning"
        />
        <StatCard
          title="Associates"
          value={summary.associatesCovered}
          subtitle="Represented in current view"
          icon={Users}
        />
      </section>

      <section className="card p-5">
        <div className="mb-4 flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-primary" />
                <h3 className="text-sm font-semibold text-ink dark:text-white">Daily Task Report</h3>
              </div>
              <p className="text-xs text-ink-muted dark:text-dark-dynamic mt-1">
                Searchable, sortable, paginated, and customizable task-level report.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-ink-muted dark:text-dark-dynamic">Rows per page</label>
              <select
                className="select !w-auto min-w-[88px]"
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-surface-border dark:border-dark-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Columns3 size={16} className="text-primary" />
              <h4 className="text-sm font-semibold text-ink dark:text-white">Visible Columns</h4>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="flex items-center gap-2 text-sm text-ink dark:text-white">
                <input
                  type="checkbox"
                  checked={columnVisibility.date}
                  onChange={() => handleColumnToggle('date')}
                />
                Date
              </label>

              <label className="flex items-center gap-2 text-sm text-ink dark:text-white">
                <input
                  type="checkbox"
                  checked={columnVisibility.associate}
                  onChange={() => handleColumnToggle('associate')}
                />
                Associate
              </label>

              <label className="flex items-center gap-2 text-sm text-ink dark:text-white">
                <input
                  type="checkbox"
                  checked={columnVisibility.task}
                  onChange={() => handleColumnToggle('task')}
                />
                Task
              </label>

              <label className="flex items-center gap-2 text-sm text-ink dark:text-white">
                <input
                  type="checkbox"
                  checked={columnVisibility.status}
                  onChange={() => handleColumnToggle('status')}
                />
                Status
              </label>

              <label className="flex items-center gap-2 text-sm text-ink dark:text-white">
                <input
                  type="checkbox"
                  checked={columnVisibility.priority}
                  onChange={() => handleColumnToggle('priority')}
                />
                Priority
              </label>

              <label className="flex items-center gap-2 text-sm text-ink dark:text-white">
                <input
                  type="checkbox"
                  checked={columnVisibility.blocker}
                  onChange={() => handleColumnToggle('blocker')}
                />
                Blocker
              </label>

              <label className="flex items-center gap-2 text-sm text-ink dark:text-white">
                <input
                  type="checkbox"
                  checked={columnVisibility.allocation}
                  onChange={() => handleColumnToggle('allocation')}
                />
                Allocation
              </label>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border dark:border-dark-border">
                {columnVisibility.date && (
                  <SortableHeader label="Date" column="date" sortConfig={sortConfig} onSort={handleSort} />
                )}
                {columnVisibility.associate && (
                  <SortableHeader label="Associate" column="associateName" sortConfig={sortConfig} onSort={handleSort} />
                )}
                {columnVisibility.task && (
                  <SortableHeader label="Task" column="taskName" sortConfig={sortConfig} onSort={handleSort} />
                )}
                {columnVisibility.status && (
                  <SortableHeader label="Status" column="status" sortConfig={sortConfig} onSort={handleSort} />
                )}
                {columnVisibility.priority && (
                  <SortableHeader label="Priority" column="priority" sortConfig={sortConfig} onSort={handleSort} />
                )}
                {columnVisibility.blocker && (
                  <SortableHeader label="Blocker" column="blocker" sortConfig={sortConfig} onSort={handleSort} />
                )}
                {columnVisibility.allocation && (
                  <SortableHeader label="Allocation" column="allocation" sortConfig={sortConfig} onSort={handleSort} />
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length > 0 ? (
                paginatedRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-surface-border/70 dark:border-dark-border/70"
                  >
                    {columnVisibility.date && (
                      <td className="py-3 pr-3 text-sm text-ink dark:text-white">{row.date}</td>
                    )}
                    {columnVisibility.associate && (
                      <td className="py-3 pr-3">
                        <div>
                          <p className="text-sm font-medium text-ink dark:text-white">{row.associateName}</p>
                          <p className="text-xs text-ink-faint dark:text-dark-dynamic">{row.team}</p>
                        </div>
                      </td>
                    )}
                    {columnVisibility.task && (
                      <td className="py-3 pr-3 text-sm text-ink dark:text-white">{row.taskName}</td>
                    )}
                    {columnVisibility.status && (
                      <td className="py-3 pr-3 text-sm text-ink dark:text-white">{row.status}</td>
                    )}
                    {columnVisibility.priority && (
                      <td className="py-3 pr-3 text-sm text-ink dark:text-white">{row.priority}</td>
                    )}
                    {columnVisibility.blocker && (
                      <td className="py-3 pr-3 text-sm text-ink dark:text-white">{row.blocker}</td>
                    )}
                    {columnVisibility.allocation && (
                      <td className="py-3 pr-3 text-sm text-ink dark:text-white">{row.allocation}</td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-sm text-ink-muted dark:text-dark-dynamic">
                    No report data found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-surface-border pt-4 dark:border-dark-border md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-ink-muted dark:text-dark-dynamic">
            Showing {sortedRows.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, sortedRows.length)} of {sortedRows.length} rows
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={15} /> Prev
            </button>

            <div className="px-3 py-2 text-sm text-ink dark:text-white">
              Page {currentPage} of {totalPages}
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </section>

      <section className="card p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-ink dark:text-white">Associate Summary</h3>
          <p className="text-xs text-ink-muted dark:text-dark-dynamic mt-1">
            Performance summary by associate for the selected report view.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border dark:border-dark-border">
                <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 pr-3">Associate</th>
                <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 pr-3">Employee ID</th>
                <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 pr-3">Team</th>
                <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 pr-3">Tasks</th>
                <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 pr-3">Completed</th>
                <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 pr-3">Blocked</th>
                <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 pr-3">Completion %</th>
                <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 pr-3">Avg Allocation</th>
              </tr>
            </thead>
            <tbody>
              {associateSummary.length > 0 ? (
                associateSummary.map((row) => (
                  <tr
                    key={row.associateId}
                    className="border-b border-surface-border/70 dark:border-dark-border/70"
                  >
                    <td className="py-3 pr-3 text-sm font-medium text-ink dark:text-white">{row.associateName}</td>
                    <td className="py-3 pr-3 text-sm text-ink dark:text-white">{row.employeeId}</td>
                    <td className="py-3 pr-3 text-sm text-ink dark:text-white">{row.team}</td>
                    <td className="py-3 pr-3 text-sm text-ink dark:text-white">{row.totalTasks}</td>
                    <td className="py-3 pr-3 text-sm text-ink dark:text-white">{row.completed}</td>
                    <td className="py-3 pr-3 text-sm text-ink dark:text-white">{row.blocked}</td>
                    <td className="py-3 pr-3 text-sm text-ink dark:text-white">{row.completionRate}%</td>
                    <td className="py-3 pr-3 text-sm text-ink dark:text-white">{row.avgAllocation}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-sm text-ink-muted dark:text-dark-dynamic">
                    No associate summary available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-ink dark:text-white">Blocked Tasks</h3>
          <p className="text-xs text-ink-muted dark:text-dark-dynamic mt-1">
            Focus list for follow-up and dependency resolution.
          </p>
        </div>

        <div className="space-y-3">
          {blockedRows.length > 0 ? (
            blockedRows.map((row) => (
              <div
                key={row.id}
                className="rounded-2xl border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-950/20 p-4"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink dark:text-white">{row.taskName}</p>
                    <p className="text-xs text-ink-muted dark:text-dark-dynamic mt-1">
                      {row.associateName} • {row.date} • {row.team}
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-300 mt-2">
                      Blocker: {row.blocker}
                    </p>
                    {row.comments && (
                      <p className="text-sm text-ink dark:text-white mt-2">
                        Comments: {row.comments}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-ink-faint dark:text-dark-dynamic">
                    Allocation: {row.allocation}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-surface-border dark:border-dark-border p-8 text-center text-sm text-ink-muted dark:text-dark-dynamic">
              No blocked tasks in the selected report view.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}