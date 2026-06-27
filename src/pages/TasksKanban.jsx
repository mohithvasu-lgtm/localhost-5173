import { useMemo, useState } from 'react'
import {
  KanbanSquare,
  Plus,
  Search,
  FolderKanban,
  CheckSquare,
  Square,
  Trash2,
  Pencil,
  X,
} from 'lucide-react'
import { useApp } from '../data/AppContext'
import { nanoid } from '../utils/nanoid'

const VIEW_OPTIONS = [
  { value: 'bucket', label: 'Group by Bucket' },
  { value: 'assignee', label: 'Group by Assigned To' },
]

const BUCKET_COLORS = [
  '#64748b',
  '#2563eb',
  '#d97706',
  '#16a34a',
  '#7c3aed',
  '#db2777',
]

const EMPTY_BUCKET_FORM = {
  name: '',
  color: '#64748b',
}

const EMPTY_TASK_FORM = {
  title: '',
  associateIds: [],
  bucketId: '',
  goalId: '',
  status: 'Not Started',
  priority: 'Medium',
  blocker: 'None',
  comments: '',
  allocation: '1',
  subtasksText: '',
}

const EMPTY_EDIT_FORM = {
  title: '',
  associateIds: [],
  bucketId: '',
  goalId: '',
  status: 'Not Started',
  priority: 'Medium',
  blocker: 'None',
  comments: '',
  allocation: '1',
  subtasks: [],
  newSubtaskTitle: '',
}

function getTaskAssociateIds(task) {
  if (Array.isArray(task.associateIds) && task.associateIds.length > 0) {
    return task.associateIds
  }

  if (task.associateId) {
    return [task.associateId]
  }

  return []
}

function TaskCard({
  task,
  associateNames,
  bucketName,
  goalName,
  onEdit,
  onDelete,
  onToggleSubtask,
}) {
  const subtasks = task.subtasks || []
  const completedSubtasks = subtasks.filter((item) => item.done).length

  return (
    <div className="card p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-ink dark:text-white break-words">
            {task.title || 'Untitled task'}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-ink-muted dark:text-dark-dynamic">
            <span>{associateNames || 'Unassigned'}</span>
            <span>•</span>
            <span>{bucketName}</span>
            {goalName && (
              <>
                <span>•</span>
                <span>{goalName}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            className="btn-icon"
            onClick={() => onEdit(task)}
            aria-label={`Edit ${task.title}`}
          >
            <Pencil size={15} />
          </button>

          <button
            className="btn-icon text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
            onClick={() => onDelete(task.id)}
            aria-label={`Delete ${task.title}`}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-full bg-surface-offset dark:bg-dark-offset px-2 py-1 text-ink dark:text-white">
          {task.status}
        </span>
        <span className="rounded-full bg-surface-offset dark:bg-dark-offset px-2 py-1 text-ink dark:text-white">
          {task.priority}
        </span>
        <span className="rounded-full bg-surface-offset dark:bg-dark-offset px-2 py-1 text-ink dark:text-white">
          Allocation {task.allocation}
        </span>
      </div>

      <div>
        <p className="text-xs font-medium text-ink dark:text-white mb-2">
          Subtasks ({completedSubtasks}/{subtasks.length})
        </p>

        {subtasks.length > 0 ? (
          <div className="space-y-2">
            {subtasks.map((subtask) => (
              <button
                key={subtask.id}
                type="button"
                onClick={() => onToggleSubtask(task.id, subtask.id)}
                className="w-full flex items-center gap-2 text-left text-sm text-ink-muted dark:text-dark-dynamic"
              >
                {subtask.done ? <CheckSquare size={16} /> : <Square size={16} />}
                <span className={subtask.done ? 'line-through opacity-70' : ''}>
                  {subtask.title}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-muted dark:text-dark-dynamic">
            No subtasks added.
          </p>
        )}
      </div>

      {task.comments?.trim() && (
        <p className="text-sm text-ink-muted dark:text-dark-dynamic leading-6">
          {task.comments}
        </p>
      )}
    </div>
  )
}

function EditTaskModal({
  open,
  onClose,
  form,
  setForm,
  associates,
  buckets,
  goals,
  onToggleAssociate,
  onSave,
  onAddSubtask,
  onToggleEditSubtask,
  onChangeSubtaskTitle,
  onDeleteSubtask,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-3xl card p-5 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-semibold text-ink dark:text-white">Edit Task</h2>
            <p className="text-sm text-ink-muted dark:text-dark-dynamic mt-1">
              Update task details, ownership, and subtasks.
            </p>
          </div>

          <button className="btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-4">
          <div>
            <label className="label">Task Title</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Enter task title"
            />
          </div>

          <div>
            <label className="label">Assigned To</label>
            <div className="rounded-xl border border-surface-border dark:border-dark-border p-3 space-y-2 max-h-52 overflow-y-auto">
              {associates.length > 0 ? (
                associates.map((associate) => {
                  const checked = form.associateIds.includes(associate.id)

                  return (
                    <label
                      key={associate.id}
                      className="flex items-center gap-2 text-sm text-ink dark:text-white"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleAssociate(associate.id)}
                      />
                      <span>
                        {associate.name} {associate.team ? `(${associate.team})` : ''}
                      </span>
                    </label>
                  )
                })
              ) : (
                <p className="text-sm text-ink-muted dark:text-dark-dynamic">
                  No associates available.
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="label">Bucket</label>
              <select
                className="select"
                value={form.bucketId}
                onChange={(e) => setForm((prev) => ({ ...prev, bucketId: e.target.value }))}
              >
                <option value="">Select bucket</option>
                {buckets.map((bucket) => (
                  <option key={bucket.id} value={bucket.id}>
                    {bucket.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Goal</label>
              <select
                className="select"
                value={form.goalId}
                onChange={(e) => setForm((prev) => ({ ...prev, goalId: e.target.value }))}
              >
                <option value="">Select goal</option>
                {goals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Status</label>
              <select
                className="select"
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>

            <div>
              <label className="label">Priority</label>
              <select
                className="select"
                value={form.priority}
                onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div>
              <label className="label">Allocation</label>
              <input
                className="input"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={form.allocation}
                onChange={(e) => setForm((prev) => ({ ...prev, allocation: e.target.value }))}
              />
            </div>

            <div>
              <label className="label">Blocker</label>
              <input
                className="input"
                value={form.blocker}
                onChange={(e) => setForm((prev) => ({ ...prev, blocker: e.target.value }))}
                placeholder="None / Waiting for review / etc."
              />
            </div>
          </div>

          <div>
            <label className="label">Subtasks</label>
            <div className="space-y-3">
              {form.subtasks.length > 0 ? (
                form.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="rounded-xl border border-surface-border dark:border-dark-border p-3 flex items-center gap-3"
                  >
                    <button
                      type="button"
                      className="shrink-0 text-ink-muted dark:text-dark-dynamic"
                      onClick={() => onToggleEditSubtask(subtask.id)}
                      aria-label={`Toggle ${subtask.title}`}
                    >
                      {subtask.done ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>

                    <input
                      className="input flex-1"
                      value={subtask.title}
                      onChange={(e) => onChangeSubtaskTitle(subtask.id, e.target.value)}
                      placeholder="Subtask title"
                    />

                    <button
                      type="button"
                      className="btn-icon text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0"
                      onClick={() => onDeleteSubtask(subtask.id)}
                      aria-label={`Delete ${subtask.title}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-ink-muted dark:text-dark-dynamic">
                  No subtasks added.
                </p>
              )}

              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  value={form.newSubtaskTitle}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, newSubtaskTitle: e.target.value }))
                  }
                  placeholder="Add a new subtask"
                />
                <button type="button" className="btn-secondary" onClick={onAddSubtask}>
                  <Plus size={15} /> Add
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="label">Comments</label>
            <textarea
              className="input min-h-[100px] resize-y"
              value={form.comments}
              onChange={(e) => setForm((prev) => ({ ...prev, comments: e.target.value }))}
              placeholder="Add context, updates, or notes"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={onSave}>Save Changes</button>
        </div>
      </div>
    </div>
  )
}

export default function TasksKanban() {
  const {
    associates = [],
    goals = [],
    buckets = [],
    tasks = [],
    addBucket,
    addTask,
    updateTask,
    deleteTask,
    ready,
  } = useApp()

  const [viewMode, setViewMode] = useState('bucket')
  const [search, setSearch] = useState('')
  const [bucketForm, setBucketForm] = useState(EMPTY_BUCKET_FORM)
  const [taskForm, setTaskForm] = useState({
    ...EMPTY_TASK_FORM,
    bucketId: buckets[0]?.id || '',
  })
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM)

  const filteredTasks = useMemo(() => {
    const term = search.trim().toLowerCase()

    return tasks.filter((task) => {
      if (!term) return true

      const assignedAssociates = associates.filter((item) =>
        getTaskAssociateIds(task).includes(item.id)
      )
      const bucket = buckets.find((item) => item.id === task.bucketId)
      const goal = goals.find((item) => item.id === task.goalId)

      return (
        task.title?.toLowerCase().includes(term) ||
        task.comments?.toLowerCase().includes(term) ||
        (task.subtasks || []).some((subtask) =>
          subtask.title?.toLowerCase().includes(term)
        ) ||
        assignedAssociates.some(
          (associate) =>
            associate?.name?.toLowerCase().includes(term) ||
            associate?.team?.toLowerCase().includes(term)
        ) ||
        bucket?.name?.toLowerCase().includes(term) ||
        goal?.name?.toLowerCase().includes(term)
      )
    })
  }, [tasks, associates, buckets, goals, search])

  const groupedTasks = useMemo(() => {
    if (viewMode === 'assignee') {
      const grouped = associates.reduce((acc, associate) => {
        acc[associate.id] = {
          key: associate.id,
          title: associate.name,
          subtitle: associate.team || 'No team',
          tasks: filteredTasks.filter((task) =>
            getTaskAssociateIds(task).includes(associate.id)
          ),
        }
        return acc
      }, {})

      const unassignedTasks = filteredTasks.filter(
        (task) => getTaskAssociateIds(task).length === 0
      )

      if (unassignedTasks.length > 0) {
        grouped.unassigned = {
          key: 'unassigned',
          title: 'Unassigned',
          subtitle: 'No associate linked',
          tasks: unassignedTasks,
        }
      }

      return Object.values(grouped)
    }

    const grouped = buckets.reduce((acc, bucket) => {
      acc[bucket.id] = {
        key: bucket.id,
        title: bucket.name,
        subtitle: 'Bucket',
        color: bucket.color,
        tasks: filteredTasks.filter((task) => task.bucketId === bucket.id),
      }
      return acc
    }, {})

    const noBucketTasks = filteredTasks.filter((task) => !task.bucketId)
    if (noBucketTasks.length > 0) {
      grouped.unbucketed = {
        key: 'unbucketed',
        title: 'No Bucket',
        subtitle: 'Tasks without bucket',
        color: '#94a3b8',
        tasks: noBucketTasks,
      }
    }

    return Object.values(grouped)
  }, [viewMode, filteredTasks, associates, buckets])

  function toggleAssociateSelection(id) {
    setTaskForm((prev) => ({
      ...prev,
      associateIds: prev.associateIds.includes(id)
        ? prev.associateIds.filter((item) => item !== id)
        : [...prev.associateIds, id],
    }))
  }

  function toggleEditAssociateSelection(id) {
    setEditForm((prev) => ({
      ...prev,
      associateIds: prev.associateIds.includes(id)
        ? prev.associateIds.filter((item) => item !== id)
        : [...prev.associateIds, id],
    }))
  }

  function openEditModal(task) {
    setEditingTaskId(task.id)
    setEditForm({
      title: task.title || '',
      associateIds: getTaskAssociateIds(task),
      bucketId: task.bucketId || '',
      goalId: task.goalId || '',
      status: task.status || 'Not Started',
      priority: task.priority || 'Medium',
      blocker: task.blocker || 'None',
      comments: task.comments || '',
      allocation: task.allocation || '1',
      subtasks: Array.isArray(task.subtasks)
        ? task.subtasks.map((subtask) => ({
            id: subtask.id,
            title: subtask.title || '',
            done: Boolean(subtask.done),
          }))
        : [],
      newSubtaskTitle: '',
    })
  }

  function closeEditModal() {
    setEditingTaskId(null)
    setEditForm(EMPTY_EDIT_FORM)
  }

  function handleAddBucket() {
    if (!bucketForm.name.trim()) return

    addBucket({
      name: bucketForm.name.trim(),
      color: bucketForm.color,
    })

    setBucketForm(EMPTY_BUCKET_FORM)
  }

  function handleAddTask() {
    if (!taskForm.title.trim()) return

    const subtasks = taskForm.subtasksText
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((title) => ({
        id: nanoid(),
        title,
        done: false,
      }))

    addTask({
      title: taskForm.title.trim(),
      associateIds: taskForm.associateIds,
      bucketId: taskForm.bucketId,
      goalId: taskForm.goalId,
      status: taskForm.status,
      priority: taskForm.priority,
      blocker: taskForm.blocker,
      comments: taskForm.comments,
      allocation: taskForm.allocation,
      subtasks,
    })

    setTaskForm({
      ...EMPTY_TASK_FORM,
      bucketId: buckets[0]?.id || '',
    })
  }

  function handleAddEditSubtask() {
    const title = editForm.newSubtaskTitle.trim()
    if (!title) return

    setEditForm((prev) => ({
      ...prev,
      subtasks: [
        ...prev.subtasks,
        {
          id: nanoid(),
          title,
          done: false,
        },
      ],
      newSubtaskTitle: '',
    }))
  }

  function handleToggleEditSubtask(subtaskId) {
    setEditForm((prev) => ({
      ...prev,
      subtasks: prev.subtasks.map((subtask) =>
        subtask.id === subtaskId
          ? { ...subtask, done: !subtask.done }
          : subtask
      ),
    }))
  }

  function handleChangeEditSubtaskTitle(subtaskId, value) {
    setEditForm((prev) => ({
      ...prev,
      subtasks: prev.subtasks.map((subtask) =>
        subtask.id === subtaskId
          ? { ...subtask, title: value }
          : subtask
      ),
    }))
  }

  function handleDeleteEditSubtask(subtaskId) {
    setEditForm((prev) => ({
      ...prev,
      subtasks: prev.subtasks.filter((subtask) => subtask.id !== subtaskId),
    }))
  }

  function handleSaveEdit() {
    if (!editingTaskId || !editForm.title.trim()) return

    updateTask(editingTaskId, {
      title: editForm.title.trim(),
      associateIds: editForm.associateIds,
      bucketId: editForm.bucketId,
      goalId: editForm.goalId,
      status: editForm.status,
      priority: editForm.priority,
      blocker: editForm.blocker,
      comments: editForm.comments,
      allocation: editForm.allocation,
      subtasks: editForm.subtasks
        .map((subtask) => ({
          ...subtask,
          title: subtask.title.trim(),
        }))
        .filter((subtask) => subtask.title),
    })

    closeEditModal()
  }

  function handleToggleSubtask(taskId, subtaskId) {
    const task = tasks.find((item) => item.id === taskId)
    if (!task) return

    updateTask(taskId, {
      subtasks: (task.subtasks || []).map((subtask) =>
        subtask.id === subtaskId
          ? { ...subtask, done: !subtask.done }
          : subtask
      ),
    })
  }

  if (!ready) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-5 animate-pulse">
            <div className="h-5 w-40 rounded bg-surface-dynamic dark:bg-dark-dynamic mb-4" />
            <div className="h-10 rounded bg-surface-dynamic dark:bg-dark-dynamic mb-3" />
            <div className="h-24 rounded bg-surface-dynamic dark:bg-dark-dynamic" />
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
            Buckets / Tasks / Kanban
          </h2>
          <p className="text-sm text-ink-muted dark:text-dark-dynamic mt-1">
            Track tasks by bucket or by assigned associate with subtask progress.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="badge bg-surface-offset dark:bg-dark-offset text-ink dark:text-white">
            {tasks.length} tasks
          </span>
          <span className="badge bg-surface-offset dark:bg-dark-offset text-ink dark:text-white">
            {buckets.length} buckets
          </span>
          <span className="badge bg-surface-offset dark:bg-dark-offset text-ink dark:text-white">
            {associates.length} associates
          </span>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <div className="card p-4 md:p-5 space-y-4">
          <div className="flex items-center gap-2">
            <FolderKanban size={18} className="text-primary" />
            <h3 className="text-sm font-semibold text-ink dark:text-white">Add Bucket</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <input
              className="input"
              placeholder="Bucket name"
              value={bucketForm.name}
              onChange={(e) =>
                setBucketForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />

            <div className="flex items-center gap-2">
              {BUCKET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-xl border-2 ${
                    bucketForm.color === color ? 'border-ink dark:border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() =>
                    setBucketForm((prev) => ({ ...prev, color }))
                  }
                  aria-label={`Select ${color}`}
                />
              ))}
            </div>
          </div>

          <button className="btn-primary" onClick={handleAddBucket}>
            <Plus size={15} /> Add Bucket
          </button>
        </div>

        <div className="card p-4 md:p-5 space-y-4">
          <div className="flex items-center gap-2">
            <KanbanSquare size={18} className="text-primary" />
            <h3 className="text-sm font-semibold text-ink dark:text-white">Board View</h3>
          </div>

          <select
            className="select"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            {VIEW_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint dark:text-dark-dynamic"
            />
            <input
              className="input pl-9"
              placeholder="Search tasks, goal, bucket, associate"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="card p-4 md:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Plus size={18} className="text-primary" />
          <h3 className="text-sm font-semibold text-ink dark:text-white">Add Task</h3>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div>
            <label className="label">Task Title</label>
            <input
              className="input"
              value={taskForm.title}
              onChange={(e) =>
                setTaskForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter task title"
            />
          </div>

          <div>
            <label className="label">Assigned To</label>
            <div className="rounded-xl border border-surface-border dark:border-dark-border p-3 space-y-2 max-h-44 overflow-y-auto">
              {associates.length > 0 ? (
                associates.map((associate) => {
                  const checked = taskForm.associateIds.includes(associate.id)

                  return (
                    <label
                      key={associate.id}
                      className="flex items-center gap-2 text-sm text-ink dark:text-white"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAssociateSelection(associate.id)}
                      />
                      <span>
                        {associate.name} {associate.team ? `(${associate.team})` : ''}
                      </span>
                    </label>
                  )
                })
              ) : (
                <p className="text-sm text-ink-muted dark:text-dark-dynamic">
                  No associates available.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="label">Bucket</label>
            <select
              className="select"
              value={taskForm.bucketId}
              onChange={(e) =>
                setTaskForm((prev) => ({ ...prev, bucketId: e.target.value }))
              }
            >
              <option value="">Select bucket</option>
              {buckets.map((bucket) => (
                <option key={bucket.id} value={bucket.id}>
                  {bucket.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Goal</label>
            <select
              className="select"
              value={taskForm.goalId}
              onChange={(e) =>
                setTaskForm((prev) => ({ ...prev, goalId: e.target.value }))
              }
            >
              <option value="">Select goal</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Status</label>
            <select
              className="select"
              value={taskForm.status}
              onChange={(e) =>
                setTaskForm((prev) => ({ ...prev, status: e.target.value }))
              }
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>

          <div>
            <label className="label">Priority</label>
            <select
              className="select"
              value={taskForm.priority}
              onChange={(e) =>
                setTaskForm((prev) => ({ ...prev, priority: e.target.value }))
              }
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div>
            <label className="label">Allocation</label>
            <input
              className="input"
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={taskForm.allocation}
              onChange={(e) =>
                setTaskForm((prev) => ({ ...prev, allocation: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="label">Blocker</label>
            <input
              className="input"
              value={taskForm.blocker}
              onChange={(e) =>
                setTaskForm((prev) => ({ ...prev, blocker: e.target.value }))
              }
              placeholder="None / Waiting for review / etc."
            />
          </div>
        </div>

        <div>
          <label className="label">Subtasks</label>
          <textarea
            className="input min-h-[100px] resize-y"
            placeholder={'Enter one subtask per line\nExample:\nCreate draft\nReview with QA\nShare with client'}
            value={taskForm.subtasksText}
            onChange={(e) =>
              setTaskForm((prev) => ({ ...prev, subtasksText: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="label">Comments</label>
          <textarea
            className="input min-h-[88px] resize-y"
            placeholder="Add context, updates, or notes"
            value={taskForm.comments}
            onChange={(e) =>
              setTaskForm((prev) => ({ ...prev, comments: e.target.value }))
            }
          />
        </div>

        <button className="btn-primary" onClick={handleAddTask}>
          <Plus size={15} /> Add Task
        </button>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {groupedTasks.map((group) => (
          <div key={group.key} className="card p-4 md:p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-ink dark:text-white">
                  {group.title}
                </h3>
                <p className="text-xs text-ink-muted dark:text-dark-dynamic mt-1">
                  {group.subtitle}
                </p>
              </div>

              <span className="badge bg-surface-offset dark:bg-dark-offset text-ink dark:text-white">
                {group.tasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {group.tasks.length > 0 ? (
                group.tasks.map((task) => {
                  const assignedAssociates = associates.filter((item) =>
                    getTaskAssociateIds(task).includes(item.id)
                  )
                  const bucket = buckets.find((item) => item.id === task.bucketId)
                  const goal = goals.find((item) => item.id === task.goalId)

                  return (
                    <TaskCard
                      key={task.id}
                      task={task}
                      associateNames={
                        assignedAssociates.length > 0
                          ? assignedAssociates.map((item) => item.name).join(', ')
                          : 'Unassigned'
                      }
                      bucketName={bucket?.name || 'No Bucket'}
                      goalName={goal?.name || ''}
                      onEdit={openEditModal}
                      onDelete={deleteTask}
                      onToggleSubtask={handleToggleSubtask}
                    />
                  )
                })
              ) : (
                <div className="rounded-xl border border-dashed border-surface-border dark:border-dark-border p-6 text-center">
                  <p className="text-sm text-ink-muted dark:text-dark-dynamic">
                    No tasks in this group.
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </section>

      <EditTaskModal
        open={Boolean(editingTaskId)}
        onClose={closeEditModal}
        form={editForm}
        setForm={setEditForm}
        associates={associates}
        buckets={buckets}
        goals={goals}
        onToggleAssociate={toggleEditAssociateSelection}
        onSave={handleSaveEdit}
        onAddSubtask={handleAddEditSubtask}
        onToggleEditSubtask={handleToggleEditSubtask}
        onChangeSubtaskTitle={handleChangeEditSubtaskTitle}
        onDeleteSubtask={handleDeleteEditSubtask}
      />
    </div>
  )
}