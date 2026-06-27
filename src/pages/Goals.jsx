import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Pencil, Trash2, Target, Search, X, Palette } from 'lucide-react'
import { useApp } from '../data/AppContext'
import { nanoid } from '../utils/nanoid'

const GOAL_COLORS = [
  '#01696f',
  '#006494',
  '#437a22',
  '#da7101',
  '#7a39bb',
  '#a12c7b',
  '#a13544',
  '#d19900',
]

const EMPTY_FORM = {
  name: '',
  color: '#01696f',
  description: '',
}

function GoalModal({
  open,
  onClose,
  onSave,
  form,
  setForm,
  isEditing,
  errors,
}) {
  console.log('GoalModal render, open =', open)

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-[10000] w-full max-w-2xl card p-5 animate-fade-in">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-semibold text-ink dark:text-white">
              {isEditing ? 'Edit Goal' : 'Add Goal'}
            </h2>
            <p className="text-sm text-ink-muted dark:text-dark-dynamic mt-1">
              Define reusable work buckets for stand-up task tagging.
            </p>
          </div>

          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-4">
          <div>
            <label className="label">Goal Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Example: Release Planning"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="label">Goal Color</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {GOAL_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, color }))}
                  className={`w-9 h-9 rounded-xl border-2 transition-all ${
                    form.color === color
                      ? 'border-ink dark:border-white scale-105'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-surface-border dark:border-dark-border bg-surface-2 dark:bg-dark-surface2 p-3">
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                className="w-12 h-10 rounded border-0 bg-transparent p-0 cursor-pointer"
              />
              <input
                className="input"
                value={form.color}
                onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                placeholder="#01696f"
              />
            </div>
            {errors.color && <p className="mt-1 text-xs text-red-600">{errors.color}</p>}
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[120px] resize-y"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this goal is used for..."
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={onSave}>
            {isEditing ? 'Update Goal' : 'Add Goal'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function GoalCard({ goal, onEdit, onDelete }) {
  return (
    <div className="card p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span
            className="w-4 h-4 rounded-full mt-1 shrink-0"
            style={{ backgroundColor: goal.color }}
          />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-ink dark:text-white truncate">
              {goal.name}
            </h3>
            <p className="text-xs text-ink-faint dark:text-dark-dynamic mt-1">
              {goal.color}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            className="btn-icon"
            onClick={() => onEdit(goal)}
            aria-label={`Edit ${goal.name}`}
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            className="btn-icon text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
            onClick={() => onDelete(goal.id)}
            aria-label={`Delete ${goal.name}`}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <p className="text-sm text-ink-muted dark:text-dark-dynamic leading-6">
        {goal.description || 'No description added.'}
      </p>
    </div>
  )
}

export default function Goals() {
  const { goals = [], setGoals, ready } = useApp()

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  console.log('Goals render, modalOpen =', modalOpen)

  useEffect(() => {
    console.log('modalOpen changed ->', modalOpen)
  }, [modalOpen])

  const filteredGoals = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return goals

    return goals.filter((goal) =>
      goal.name?.toLowerCase().includes(term) ||
      goal.description?.toLowerCase().includes(term) ||
      goal.color?.toLowerCase().includes(term)
    )
  }, [goals, search])

  function openCreateModal() {
    console.log('openCreateModal fired')
    setEditingId(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModalOpen(true)
  }

  function openEditModal(goal) {
    console.log('openEditModal fired for', goal?.id)
    setEditingId(goal.id)
    setForm({
      name: goal.name || '',
      color: goal.color || '#01696f',
      description: goal.description || '',
    })
    setErrors({})
    setModalOpen(true)
  }

  function closeModal() {
    console.log('closeModal fired')
    setModalOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setErrors({})
  }

  function validateForm() {
    const nextErrors = {}

    if (!form.name.trim()) nextErrors.name = 'Goal name is required.'

    const duplicateGoal = goals.find((goal) =>
      goal.name?.toLowerCase() === form.name.trim().toLowerCase() &&
      goal.id !== editingId
    )

    if (duplicateGoal) {
      nextErrors.name = 'Goal name must be unique.'
    }

    if (!/^#([0-9A-Fa-f]{6})$/.test(form.color.trim())) {
      nextErrors.color = 'Use a valid hex color like #01696f.'
    }

    console.log('validateForm errors =', nextErrors)

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSave() {
    console.log('handleSave fired')

    if (!validateForm()) return
    if (typeof setGoals !== 'function') {
      console.log('setGoals is not a function')
      return
    }

    const payload = {
      name: form.name.trim(),
      color: form.color.trim(),
      description: form.description.trim(),
    }

    console.log('saving payload =', payload)

    if (editingId) {
      setGoals((prev = []) =>
        prev.map((goal) =>
          goal.id === editingId ? { ...goal, ...payload } : goal
        )
      )
    } else {
      setGoals((prev = []) => [
        ...prev,
        {
          id: nanoid(),
          ...payload,
        },
      ])
    }

    closeModal()
  }

  function handleDelete(id) {
    console.log('handleDelete fired for', id)

    const goal = goals.find((g) => g.id === id)
    const confirmed = window.confirm(`Delete goal "${goal?.name || 'this goal'}"?`)
    if (!confirmed) return
    if (typeof setGoals !== 'function') {
      console.log('setGoals is not a function')
      return
    }

    setGoals((prev = []) => prev.filter((goal) => goal.id !== id))
  }

  if (!ready) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="h-4 w-32 rounded bg-surface-dynamic dark:bg-dark-dynamic mb-3" />
            <div className="h-3 w-full rounded bg-surface-dynamic dark:bg-dark-dynamic mb-2" />
            <div className="h-3 w-3/4 rounded bg-surface-dynamic dark:bg-dark-dynamic" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink dark:text-white">Goals</h2>
          <p className="text-sm text-ink-muted dark:text-dark-dynamic mt-1">
            Create reusable goals for classifying work during stand-up updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              console.log('ADD GOAL CLICKED')
              openCreateModal()
            }}
          >
            <Plus size={15} />
            Add Goal
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-ink-muted dark:text-dark-dynamic">Total Goals</p>
              <h3 className="text-2xl font-semibold mt-1 text-ink dark:text-white">
                {goals.length}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Target size={18} />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <p className="text-xs text-ink-muted dark:text-dark-dynamic">Custom Colors</p>
          <h3 className="text-2xl font-semibold mt-1 text-ink dark:text-white">
            {new Set(goals.map((goal) => goal.color).filter(Boolean)).size}
          </h3>
        </div>

        <div className="card p-4">
          <p className="text-xs text-ink-muted dark:text-dark-dynamic">Descriptions Added</p>
          <h3 className="text-2xl font-semibold mt-1 text-ink dark:text-white">
            {goals.filter((goal) => goal.description?.trim()).length}
          </h3>
        </div>
      </section>

      <section className="card p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-ink dark:text-white">Goal Library</h3>
            <p className="text-xs text-ink-muted dark:text-dark-dynamic mt-1">
              Search goals by name, description, or color code.
            </p>
          </div>

          <div className="relative w-full md:max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint dark:text-dark-dynamic"
            />
            <input
              data-search-input
              className="input pl-9"
              placeholder="Search goals"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredGoals.length > 0 ? (
          filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="md:col-span-2 xl:col-span-3 rounded-xl border border-dashed border-surface-border dark:border-dark-border p-10 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-surface-offset dark:bg-dark-offset flex items-center justify-center">
              <Palette size={20} className="text-ink-muted dark:text-dark-dynamic" />
            </div>
            <h3 className="text-sm font-semibold text-ink dark:text-white">No goals found</h3>
            <p className="text-sm text-ink-muted dark:text-dark-dynamic mt-2">
              Try a different search term or add a new goal.
            </p>
          </div>
        )}
      </section>

      <GoalModal
        open={modalOpen}
        onClose={closeModal}
        onSave={handleSave}
        form={form}
        setForm={setForm}
        isEditing={Boolean(editingId)}
        errors={errors}
      />
    </div>
  )
}