import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Copy,
  Plus,
  Save,
  Trash2,
  AlertCircle,
  Search,
  UserMinus,
  RotateCcw,
  FileText,
  CheckSquare,
  Square,
} from 'lucide-react'
import { useApp } from '../data/AppContext'
import { nanoid } from '../utils/nanoid'
import { todayISO, formatDate } from '../utils/date'
import {
  distributeAllocation,
  totalAllocation,
  allocationWarning,
} from '../utils/allocation'

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed', 'Blocked']
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical']
const BLOCKER_OPTIONS = [
  'None',
  'Waiting for Review',
  'Waiting for Requirement',
  'Waiting for Dependency',
  'Waiting for Client',
]

function createEmptyTask(goalId = '', allocation = '1', bucketId = '') {
  return {
    id: nanoid(),
    linkedTaskId: '',
    task: '',
    goalId,
    bucketId,
    status: 'Not Started',
    priority: 'Medium',
    blocker: 'None',
    comments: '',
    commentsBase: '',
    allocation: String(allocation),
    subtasks: [],
    subtasksInput: '',
    isSynced: false,
    matchedExistingTask: false,
  }
}

function createStandupRecord(date, associates) {
  return {
    id: nanoid(),
    date,
    updatedAt: new Date().toISOString(),
    associates: associates.map((associate) => ({
      associateId: associate.id,
      isOnLeave: false,
      tasks: [createEmptyTask('', '1')],
    })),
  }
}

function isFilledTask(task) {
  return Boolean(task?.task?.trim())
}

function normalizeTaskName(value = '') {
  return value.trim().toLowerCase()
}

function formatDatedComment(date, comment) {
  const text = comment?.trim()
  if (!text) return ''
  return `[${date}] ${text}`
}

function buildMergedComments(baseComments, newComment, date) {
  const base = (baseComments || '').trim()
  const dated = formatDatedComment(date, newComment)

  if (!dated) return base
  if (!base) return dated
  return `${base}\n\n${dated}`
}

function getStatusClass(status) {
  switch (status) {
    case 'Completed':
      return 'status-completed'
    case 'In Progress':
      return 'status-in-progress'
    case 'Blocked':
      return 'status-blocked'
    default:
      return 'status-not-started'
  }
}

function getPriorityClass(priority) {
  switch (priority) {
    case 'Critical':
      return 'priority-critical'
    case 'High':
      return 'priority-high'
    case 'Medium':
      return 'priority-medium'
    default:
      return 'priority-low'
  }
}

function rebalanceTasks(tasks = []) {
  const allocations = distributeAllocation(tasks.length)
  return tasks.map((task, index) => ({
    ...task,
    allocation: String(allocations[index]),
  }))
}

function AssociateTaskCard({
  associate,
  associateEntry,
  goals,
  buckets,
  taskNameSuggestions,
  onAddTask,
  onDeleteTask,
  onDuplicateTask,
  onTaskChange,
  onToggleSubtask,
  onAddSubtaskFromInput,
  onDoneTask,
  onMarkLeave,
}) {
  const safeTasks = associateEntry?.tasks ?? [createEmptyTask()]
  const filledTasks = safeTasks.filter(isFilledTask)
  const total = totalAllocation(filledTasks)
  const warning = filledTasks.length > 0 ? allocationWarning(filledTasks) : null
  const datalistId = `task-suggestions-${associate.id}`

  return (
    <div className="card p-4 md:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-ink dark:text-white">{associate.name}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-xs text-ink-muted dark:text-dark-dynamic">{associate.employeeId}</span>
            <span className="text-xs text-ink-faint dark:text-dark-dynamic">•</span>
            <span className="text-xs text-ink-muted dark:text-dark-dynamic">{associate.team}</span>
            <span className="text-xs text-ink-faint dark:text-dark-dynamic">•</span>
            <span className="text-xs text-ink-muted dark:text-dark-dynamic">
              {filledTasks.length} counted task{filledTasks.length !== 1 ? 's' : ''}
            </span>
            <span className="text-xs text-ink-faint dark:text-dark-dynamic">•</span>
            <span
              className={`text-xs font-medium ${
                warning ? 'text-amber-700 dark:text-amber-300' : 'text-green-700 dark:text-green-300'
              }`}
            >
              Allocation total: {filledTasks.length > 0 ? total : '0'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn-secondary text-red-600 hover:text-red-700"
            onClick={() => onMarkLeave(associate.id)}
          >
            <UserMinus size={15} /> Mark Leave
          </button>
          <button className="btn-primary" onClick={() => onAddTask(associate.id)}>
            <Plus size={15} /> Add Task
          </button>
        </div>
      </div>

      {warning && (
        <div className="mb-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
          {warning}
        </div>
      )}

      {safeTasks.length > 0 && safeTasks.some((task) => !isFilledTask(task)) && (
        <div className="mb-4 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/20 px-3 py-2 text-sm text-blue-800 dark:text-blue-300">
          Only rows with a filled Task Name are counted in totals, charts, and reports.
        </div>
      )}

      <datalist id={datalistId}>
        {taskNameSuggestions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <div className="space-y-4">
        {safeTasks.map((task, taskIndex) => (
          <div
            key={task.id}
            className="rounded-2xl border border-surface-border dark:border-dark-border bg-surface-2 dark:bg-dark-surface2 p-4"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-ink-muted dark:text-dark-dynamic">
                  Task {taskIndex + 1}
                </span>
                <span className={getStatusClass(task.status)}>{task.status}</span>
                <span className={getPriorityClass(task.priority)}>{task.priority}</span>
                {!isFilledTask(task) && (
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    Not counted
                  </span>
                )}
                {isFilledTask(task) && (
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                      task.isSynced
                        ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
                    }`}
                  >
                    {task.isSynced ? 'Done' : 'Draft'}
                  </span>
                )}
                {task.matchedExistingTask && (
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
                    Existing task linked
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  className="btn-secondary"
                  onClick={() => onDoneTask(associate.id, task.id)}
                  disabled={!isFilledTask(task)}
                >
                  <Save size={15} /> {task.isSynced ? 'Update' : 'Done'}
                </button>

                <button
                  className="btn-icon"
                  onClick={() => onDuplicateTask(associate.id, task.id)}
                  aria-label="Duplicate task"
                >
                  <Copy size={15} />
                </button>

                <button
                  className="btn-icon text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={() => onDeleteTask(associate.id, task.id)}
                  aria-label="Delete task"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-4 xl:grid-cols-2">
                <div>
                  <label className="label">
                    Task Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    list={datalistId}
                    className={`input ${!isFilledTask(task) ? 'border-amber-300 dark:border-amber-700' : ''}`}
                    placeholder="Enter today's task update"
                    value={task.task}
                    onChange={(e) => onTaskChange(associate.id, task.id, 'task', e.target.value)}
                  />
                  {!isFilledTask(task) && (
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                      Task name is required for this row to be counted.
                    </p>
                  )}
                  {task.matchedExistingTask && (
                    <p className="mt-1 text-xs text-primary">
                      Existing task details were auto-filled from Tasks/Kanban.
                    </p>
                  )}
                </div>

                <div>
                  <label className="label">Goal</label>
                  <select
                    className="select"
                    value={task.goalId}
                    onChange={(e) => onTaskChange(associate.id, task.id, 'goalId', e.target.value)}
                  >
                    <option value="">Select goal</option>
                    {goals?.map((goal) => (
                      <option key={goal.id} value={goal.id}>
                        {goal.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label className="label">Bucket</label>
                  <select
                    className="select"
                    value={task.bucketId || ''}
                    onChange={(e) => onTaskChange(associate.id, task.id, 'bucketId', e.target.value)}
                  >
                    <option value="">Select bucket</option>
                    {buckets?.map((bucket) => (
                      <option key={bucket.id} value={bucket.id}>
                        {bucket.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Status</label>
                  <select
                    className="select"
                    value={task.status}
                    onChange={(e) => onTaskChange(associate.id, task.id, 'status', e.target.value)}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Priority</label>
                  <select
                    className="select"
                    value={task.priority}
                    onChange={(e) => onTaskChange(associate.id, task.id, 'priority', e.target.value)}
                  >
                    {PRIORITY_OPTIONS.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Blocker</label>
                  <select
                    className="select"
                    value={task.blocker}
                    onChange={(e) => onTaskChange(associate.id, task.id, 'blocker', e.target.value)}
                  >
                    {BLOCKER_OPTIONS.map((blocker) => (
                      <option key={blocker} value={blocker}>
                        {blocker}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div>
                  <label className="label">Allocation</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={task.allocation}
                    onChange={(e) => onTaskChange(associate.id, task.id, 'allocation', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Comments</label>
                  <textarea
                    className="input min-h-[88px] resize-y"
                    placeholder={
                      task.matchedExistingTask
                        ? 'Add today’s update. It will be appended with the current date in Tasks/Kanban.'
                        : 'Add blockers, progress notes, or context'
                    }
                    value={task.comments}
                    onChange={(e) => onTaskChange(associate.id, task.id, 'comments', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label">Subtasks</label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      className="input"
                      placeholder="Type a subtask and press Add"
                      value={task.subtasksInput || ''}
                      onChange={(e) =>
                        onTaskChange(associate.id, task.id, 'subtasksInput', e.target.value)
                      }
                    />
                    <button
                      type="button"
                      className="btn-secondary shrink-0"
                      onClick={() => onAddSubtaskFromInput(associate.id, task.id)}
                    >
                      <Plus size={15} /> Add
                    </button>
                  </div>

                  {task.subtasks?.length > 0 ? (
                    <div className="space-y-2">
                      {task.subtasks.map((subtask) => (
                        <button
                          key={subtask.id}
                          type="button"
                          className="w-full flex items-center gap-2 text-left text-sm text-ink-muted dark:text-dark-dynamic"
                          onClick={() => onToggleSubtask(associate.id, task.id, subtask.id)}
                        >
                          {subtask.done ? <CheckSquare size={16} /> : <Square size={16} />}
                          <span className={subtask.done ? 'line-through opacity-70' : ''}>
                            {subtask.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-ink-muted dark:text-dark-dynamic">
                      No subtasks added.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LeaveCard({ associate, onRestore }) {
  return (
    <div className="card p-4 md:p-5 border-red-200 dark:border-red-900/30">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-semibold text-ink dark:text-white">{associate.name}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-xs text-ink-muted dark:text-dark-dynamic">{associate.employeeId}</span>
            <span className="text-xs text-ink-faint dark:text-dark-dynamic">•</span>
            <span className="text-xs text-ink-muted dark:text-dark-dynamic">{associate.team}</span>
            <span className="text-xs text-ink-faint dark:text-dark-dynamic">•</span>
            <span className="rounded-full bg-red-100 px-2 py-1 text-[11px] font-medium text-red-700 dark:bg-red-950/30 dark:text-red-300">
              On leave for this date
            </span>
          </div>
        </div>

        <button className="btn-secondary" onClick={() => onRestore(associate.id)}>
          <RotateCcw size={15} /> Restore
        </button>
      </div>
    </div>
  )
}

export default function StandupEntry() {
  const {
    associates = [],
    goals = [],
    buckets = [],
    tasks = [],
    standups = [],
    setStandups,
    addMomEntry,
    upsertTaskByLinkedStandupTaskId,
    deleteTask,
    ready,
  } = useApp()

  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [search, setSearch] = useState('')
  const [showLeaveCards, setShowLeaveCards] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState(null)

  const taskNameSuggestions = useMemo(() => {
    return [...new Set(
      tasks
        .map((task) => task.title?.trim())
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b))
  }, [tasks])

  const taskLookupByName = useMemo(() => {
    const map = new Map()

    tasks.forEach((task) => {
      const normalized = normalizeTaskName(task.title)
      if (!normalized || map.has(normalized)) return
      map.set(normalized, task)
    })

    return map
  }, [tasks])

  const standupRecord = useMemo(() => {
    return standups.find((entry) => entry.date === selectedDate) || null
  }, [standups, selectedDate])

  useEffect(() => {
    if (!ready) return

    if (!standupRecord) {
      setStandups((prev = []) => [
        ...prev,
        createStandupRecord(selectedDate, associates),
      ])
    }
  }, [ready, standupRecord, selectedDate, associates, setStandups])

  const activeRecord = useMemo(() => {
    return (
      standups.find((entry) => entry.date === selectedDate) ||
      createStandupRecord(selectedDate, associates)
    )
  }, [standups, selectedDate, associates])

  const associatesWithEntries = useMemo(() => {
    const term = search.trim().toLowerCase()

    return associates
      .filter((associate) => {
        if (!term) return true
        return (
          associate.name.toLowerCase().includes(term) ||
          associate.employeeId.toLowerCase().includes(term) ||
          associate.team.toLowerCase().includes(term)
        )
      })
      .map((associate) => {
        const associateEntry =
          activeRecord?.associates?.find((entry) => entry.associateId === associate.id) || {
            associateId: associate.id,
            isOnLeave: false,
            tasks: [createEmptyTask('', '1')],
          }

        return {
          associate,
          associateEntry,
        }
      })
  }, [associates, activeRecord, search])

  const visibleAssociates = associatesWithEntries.filter(
    ({ associateEntry }) => !associateEntry.isOnLeave
  )
  const leaveAssociates = associatesWithEntries.filter(
    ({ associateEntry }) => associateEntry.isOnLeave
  )

  const groupedVisibleAssociates = useMemo(() => {
    const grouped = visibleAssociates.reduce((acc, item) => {
      const team = item.associate?.team?.trim() || 'Unassigned'
      if (!acc[team]) acc[team] = []
      acc[team].push(item)
      return acc
    }, {})

    return Object.entries(grouped).sort(([teamA], [teamB]) =>
      teamA.localeCompare(teamB)
    )
  }, [visibleAssociates])

  function buildTaskFromExisting(existingTask, typedTitle) {
    return {
      id: nanoid(),
      linkedTaskId: existingTask.id,
      task: typedTitle || existingTask.title || '',
      goalId: existingTask.goalId || '',
      bucketId: existingTask.bucketId || '',
      status: existingTask.status || 'Not Started',
      priority: existingTask.priority || 'Medium',
      blocker: existingTask.blocker || 'None',
      comments: '',
      commentsBase: existingTask.comments || '',
      allocation: existingTask.allocation || '1',
      subtasks: Array.isArray(existingTask.subtasks)
        ? existingTask.subtasks.map((subtask) => ({
            id: subtask.id || nanoid(),
            title: subtask.title || '',
            done: Boolean(subtask.done),
          }))
        : [],
      subtasksInput: '',
      isSynced: false,
      matchedExistingTask: true,
    }
  }

  function syncTaskToBoard(associateId, task) {
    if (!task?.id || !task?.task?.trim()) return task

    const linkedExistingTask =
      task.linkedTaskId
        ? tasks.find((item) => item.id === task.linkedTaskId)
        : taskLookupByName.get(normalizeTaskName(task.task))

    const mergedComments = buildMergedComments(
      linkedExistingTask?.comments ?? task.commentsBase ?? '',
      task.comments || '',
      selectedDate
    )

    const standupLinkedId = linkedExistingTask?.id || task.linkedTaskId || task.id

    const syncedTask = upsertTaskByLinkedStandupTaskId(standupLinkedId, {
      title: task.task.trim(),
      associateIds: [associateId],
      bucketId: task.bucketId || linkedExistingTask?.bucketId || '',
      goalId: task.goalId || linkedExistingTask?.goalId || '',
      status: task.status || linkedExistingTask?.status || 'Not Started',
      priority: task.priority || linkedExistingTask?.priority || 'Medium',
      blocker: task.blocker || linkedExistingTask?.blocker || 'None',
      comments: mergedComments,
      allocation: task.allocation || linkedExistingTask?.allocation || '1',
      standupDate: selectedDate,
      subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
    })

    if (!syncedTask?.id) return task

    return {
      ...task,
      linkedTaskId: syncedTask.id,
      commentsBase: mergedComments,
      comments: '',
      matchedExistingTask: true,
      isSynced: true,
    }
  }

  function updateRecord(mutator) {
    setStandups((prev = []) => {
      const index = prev.findIndex((entry) => entry.date === selectedDate)

      if (index === -1) {
        const newRecord = createStandupRecord(selectedDate, associates)
        const mutated = mutator(newRecord)
        return [...prev, { ...mutated, updatedAt: new Date().toISOString() }]
      }

      const clone = structuredClone(prev[index])
      const updated = mutator(clone)
      updated.updatedAt = new Date().toISOString()

      const next = [...prev]
      next[index] = updated
      return next
    })

    setLastSavedAt(
      new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    )
  }

  function ensureAssociateEntry(record, associateId) {
    let entry = record.associates.find((item) => item.associateId === associateId)

    if (!entry) {
      entry = {
        associateId,
        isOnLeave: false,
        tasks: [createEmptyTask()],
      }
      record.associates.push(entry)
    }

    return entry
  }

  function markTaskAsDraft(task) {
    return {
      ...task,
      isSynced: false,
    }
  }

  function handleAddTask(associateId) {
    updateRecord((record) => {
      const entry = ensureAssociateEntry(record, associateId)
      const nextTasks = [...(entry.tasks ?? []), createEmptyTask('', '1', buckets[0]?.id || '')]
      entry.tasks = rebalanceTasks(nextTasks)
      return record
    })
  }

  function handleDeleteTask(associateId, taskId) {
    updateRecord((record) => {
      const entry = ensureAssociateEntry(record, associateId)
      const currentTasks = entry.tasks ?? []
      const taskToDelete = currentTasks.find((task) => task.id === taskId)

      if (taskToDelete?.linkedTaskId) {
        deleteTask(taskToDelete.linkedTaskId)
      }

      const remainingTasks =
        currentTasks.length === 1
          ? [createEmptyTask('', '1', buckets[0]?.id || '')]
          : currentTasks.filter((task) => task.id !== taskId)

      entry.tasks = rebalanceTasks(remainingTasks)
      return record
    })
  }

  function handleDuplicateTask(associateId, taskId) {
    updateRecord((record) => {
      const entry = ensureAssociateEntry(record, associateId)
      const currentTasks = entry.tasks ?? []
      const task = currentTasks.find((item) => item.id === taskId)
      if (!task) return record

      const nextTasks = [
        ...currentTasks,
        {
          ...task,
          id: nanoid(),
          linkedTaskId: '',
          comments: '',
          commentsBase: '',
          matchedExistingTask: false,
          isSynced: false,
          subtasks: Array.isArray(task.subtasks)
            ? task.subtasks.map((subtask) => ({
                ...subtask,
                id: nanoid(),
              }))
            : [],
        },
      ]

      entry.tasks = rebalanceTasks(nextTasks)
      return record
    })
  }

  function handleTaskChange(associateId, taskId, field, value) {
    updateRecord((record) => {
      const entry = ensureAssociateEntry(record, associateId)
      entry.tasks = (entry.tasks ?? []).map((task) => {
        if (task.id !== taskId) return task

        if (field === 'task') {
          const typedValue = value
          const matchedTask = taskLookupByName.get(normalizeTaskName(typedValue))

          if (matchedTask) {
            const preservedComment = task.comments || ''
            return markTaskAsDraft({
              ...buildTaskFromExisting(matchedTask, typedValue),
              id: task.id,
              comments: preservedComment,
            })
          }

          return markTaskAsDraft({
            ...task,
            task: typedValue,
            linkedTaskId: '',
            matchedExistingTask: false,
          })
        }

        return markTaskAsDraft({ ...task, [field]: value })
      })
      return record
    })
  }

  function handleAddSubtaskFromInput(associateId, taskId) {
    updateRecord((record) => {
      const entry = ensureAssociateEntry(record, associateId)
      entry.tasks = (entry.tasks ?? []).map((task) => {
        if (task.id !== taskId) return task

        const title = task.subtasksInput?.trim()
        if (!title) return task

        return markTaskAsDraft({
          ...task,
          subtasksInput: '',
          subtasks: [
            ...(task.subtasks || []),
            {
              id: nanoid(),
              title,
              done: false,
            },
          ],
        })
      })
      return record
    })
  }

  function handleToggleSubtask(associateId, taskId, subtaskId) {
    updateRecord((record) => {
      const entry = ensureAssociateEntry(record, associateId)
      entry.tasks = (entry.tasks ?? []).map((task) => {
        if (task.id !== taskId) return task

        return markTaskAsDraft({
          ...task,
          subtasks: (task.subtasks || []).map((subtask) =>
            subtask.id === subtaskId
              ? { ...subtask, done: !subtask.done }
              : subtask
          ),
        })
      })
      return record
    })
  }

  function handleDoneTask(associateId, taskId) {
    updateRecord((record) => {
      const entry = ensureAssociateEntry(record, associateId)
      entry.tasks = (entry.tasks ?? []).map((task) => {
        if (task.id !== taskId) return task
        return syncTaskToBoard(associateId, task)
      })
      return record
    })
  }

  function handleMarkLeave(associateId) {
    updateRecord((record) => {
      const entry = ensureAssociateEntry(record, associateId)

      ;(entry.tasks || []).forEach((task) => {
        if (task.linkedTaskId) {
          deleteTask(task.linkedTaskId)
        }
      })

      entry.isOnLeave = true
      entry.tasks = [createEmptyTask('', '1', buckets[0]?.id || '')]
      return record
    })
  }

  function handleRestore(associateId) {
    updateRecord((record) => {
      const entry = ensureAssociateEntry(record, associateId)
      entry.isOnLeave = false
      if (!entry.tasks?.length) {
        entry.tasks = [createEmptyTask('', '1', buckets[0]?.id || '')]
      }
      return record
    })
  }

  function handleManualSave() {
    updateRecord((record) => {
      record.associates = (record.associates || []).map((entry) => ({
        ...entry,
        tasks: (entry.tasks || []).map((task) =>
          isFilledTask(task) ? syncTaskToBoard(entry.associateId, task) : task
        ),
      }))
      return record
    })
  }

  function handleGenerateMom() {
    const currentStandup =
      standups.find((entry) => entry.date === selectedDate) || activeRecord

    if (!currentStandup) return

    const lines = (currentStandup.associates || [])
      .filter((entry) => !entry?.isOnLeave)
      .map((entry) => {
        const associateName =
          associates.find((associate) => associate.id === entry.associateId)?.name || 'Unknown'

        const tasks = (entry.tasks || [])
          .filter(isFilledTask)
          .map((task) => task.task.trim())

        return `${associateName} - ${tasks.length ? tasks.join(', ') : 'No task updated'}`
      })

    const content = [`Standup ${selectedDate}`, '', ...lines].join('\n')

    addMomEntry({
      title: `Standup ${selectedDate}`,
      date: selectedDate,
      content,
      type: 'auto-generated',
    })

    setLastSavedAt(
      new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    )
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const activeTag = document.activeElement?.tagName?.toLowerCase()
        if (['input', 'textarea', 'select'].includes(activeTag)) return

        e.preventDefault()
        const firstAssociate = visibleAssociates[0]
        if (firstAssociate) handleAddTask(firstAssociate.associate.id)
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleManualSave()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [visibleAssociates])

  if (!ready) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-5 animate-pulse">
            <div className="h-5 w-48 rounded bg-surface-dynamic dark:bg-dark-dynamic mb-4" />
            <div className="grid gap-3">
              <div className="h-10 rounded bg-surface-dynamic dark:bg-dark-dynamic" />
              <div className="h-10 rounded bg-surface-dynamic dark:bg-dark-dynamic" />
              <div className="h-20 rounded bg-surface-dynamic dark:bg-dark-dynamic" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink dark:text-white">
            Stand-up Entry
          </h2>
          <p className="text-sm text-ink-muted dark:text-dark-dynamic mt-1">
            Capture daily updates quickly for all associates in one screen.
          </p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex items-center gap-2 rounded-xl border border-surface-border dark:border-dark-border bg-surface dark:bg-dark-surface px-3 py-2">
            <CalendarDays size={16} className="text-ink-muted dark:text-dark-dynamic" />
            <input
              type="date"
              className="bg-transparent text-sm text-ink dark:text-white outline-none"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <button className="btn-secondary" onClick={handleManualSave}>
            <Save size={15} /> Save All
          </button>

          <button className="btn-primary" onClick={handleGenerateMom}>
            <FileText size={15} /> Generate MOM
          </button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint dark:text-dark-dynamic"
          />
          <input
            data-search-input
            className="input pl-9"
            placeholder="Search associate by name, employee ID, or team"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 text-primary px-3 py-2 text-sm">
          <AlertCircle size={16} />
          <span>Draft mode active</span>
          {lastSavedAt && <span className="text-xs opacity-80">• Last saved {lastSavedAt}</span>}
        </div>
      </section>

      <section className="card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-ink dark:text-white">
              Working date: {formatDate(selectedDate)}
            </h3>
            <p className="text-xs text-ink-muted dark:text-dark-dynamic mt-1">
              Existing task names auto-fill linked details. New stand-up comments are appended to
              Tasks/Kanban with the current date when you click Done or Save All.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="badge bg-surface-offset dark:bg-dark-offset text-ink dark:text-white">
              {visibleAssociates.length} active associates
            </span>
            <span className="badge bg-surface-offset dark:bg-dark-offset text-ink dark:text-white">
              {leaveAssociates.length} on leave
            </span>
            <span className="badge bg-surface-offset dark:bg-dark-offset text-ink dark:text-white">
              {goals.length} goals available
            </span>
            <span className="badge bg-surface-offset dark:bg-dark-offset text-ink dark:text-white">
              {buckets.length} buckets available
            </span>
          </div>
        </div>
      </section>

      {leaveAssociates.length > 0 && (
        <section className="card p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-ink dark:text-white">Associates on leave</h3>
              <p className="text-xs text-ink-muted dark:text-dark-dynamic mt-1">
                These associates are hidden from stand-up entry only for the selected date.
              </p>
            </div>

            <button className="btn-secondary" onClick={() => setShowLeaveCards((prev) => !prev)}>
              {showLeaveCards ? 'Hide Leave List' : 'Show Leave List'}
            </button>
          </div>

          {showLeaveCards && (
            <div className="space-y-3">
              {leaveAssociates.map(({ associate }) => (
                <LeaveCard key={associate.id} associate={associate} onRestore={handleRestore} />
              ))}
            </div>
          )}
        </section>
      )}

      <section className="space-y-6">
        {groupedVisibleAssociates.length > 0 ? (
          groupedVisibleAssociates.map(([team, members]) => (
            <div key={team} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-ink dark:text-white">{team}</h3>
                  <p className="text-xs text-ink-muted dark:text-dark-dynamic mt-1">
                    {members.length} associate{members.length !== 1 ? 's' : ''} in this team
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {members.map(({ associate, associateEntry }) => (
                  <AssociateTaskCard
                    key={associate.id}
                    associate={associate}
                    associateEntry={associateEntry}
                    goals={goals}
                    buckets={buckets}
                    taskNameSuggestions={taskNameSuggestions}
                    onAddTask={handleAddTask}
                    onDeleteTask={handleDeleteTask}
                    onDuplicateTask={handleDuplicateTask}
                    onTaskChange={handleTaskChange}
                    onToggleSubtask={handleToggleSubtask}
                    onAddSubtaskFromInput={handleAddSubtaskFromInput}
                    onDoneTask={handleDoneTask}
                    onMarkLeave={handleMarkLeave}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-surface-border dark:border-dark-border p-10 text-center">
            <h3 className="text-sm font-semibold text-ink dark:text-white">No active associates found</h3>
            <p className="text-sm text-ink-muted dark:text-dark-dynamic mt-2">
              Try another search term or restore associates from the leave section.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}