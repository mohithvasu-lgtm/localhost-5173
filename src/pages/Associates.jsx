import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Users, Search, X } from 'lucide-react'
import { useApp } from '../data/AppContext'
import { nanoid } from '../utils/nanoid'

const EMPTY_FORM = {
  name: '',
  employeeId: '',
  team: '',
  status: 'active',
}

function StatusBadge({ status }) {
  const map = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    inactive: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    leave: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  }

  return (
    <span className={`badge ${map[status] || map.inactive}`}>
      {status === 'leave' ? 'On Leave' : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function AssociateModal({
  open,
  onClose,
  onSave,
  form,
  setForm,
  isEditing,
  errors,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-xl card p-5 animate-fade-in">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-semibold text-ink dark:text-white">
              {isEditing ? 'Edit Associate' : 'Add Associate'}
            </h2>
            <p className="text-sm text-ink-muted dark:text-dark-dynamic mt-1">
              Manage the 10 associates used in daily stand-up tracking.
            </p>
          </div>

          <button className="btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter associate name"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="label">Employee ID</label>
            <input
              className="input"
              value={form.employeeId}
              onChange={(e) => setForm(prev => ({ ...prev, employeeId: e.target.value.toUpperCase() }))}
              placeholder="EMP011"
            />
            {errors.employeeId && <p className="mt-1 text-xs text-red-600">{errors.employeeId}</p>}
          </div>

          <div>
            <label className="label">Team</label>
            <input
              className="input"
              value={form.team}
              onChange={(e) => setForm(prev => ({ ...prev, team: e.target.value }))}
              placeholder="Frontend / Backend / QA"
            />
            {errors.team && <p className="mt-1 text-xs text-red-600">{errors.team}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="label">Status</label>
            <select
              className="select"
              value={form.status}
              onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="leave">On Leave</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={onSave}>
            {isEditing ? 'Update Associate' : 'Add Associate'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Associates() {
  const { associates, setAssociates, ready } = useApp()

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  const filteredAssociates = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return associates

    return associates.filter((associate) =>
      associate.name.toLowerCase().includes(term) ||
      associate.employeeId.toLowerCase().includes(term) ||
      associate.team.toLowerCase().includes(term) ||
      associate.status.toLowerCase().includes(term)
    )
  }, [associates, search])

  const counts = useMemo(() => {
    return {
      total: associates.length,
      active: associates.filter(a => a.status === 'active').length,
      inactive: associates.filter(a => a.status === 'inactive').length,
      leave: associates.filter(a => a.status === 'leave').length,
    }
  }, [associates])

  function openCreateModal() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModalOpen(true)
  }

  function openEditModal(associate) {
    setEditingId(associate.id)
    setForm({
      name: associate.name || '',
      employeeId: associate.employeeId || '',
      team: associate.team || '',
      status: associate.status || 'active',
    })
    setErrors({})
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setErrors({})
  }

  function validateForm() {
    const nextErrors = {}

    if (!form.name.trim()) nextErrors.name = 'Name is required.'
    if (!form.employeeId.trim()) nextErrors.employeeId = 'Employee ID is required.'
    if (!form.team.trim()) nextErrors.team = 'Team is required.'

    const duplicateEmployeeId = associates.find((associate) =>
      associate.employeeId.toLowerCase() === form.employeeId.trim().toLowerCase() &&
      associate.id !== editingId
    )

    if (duplicateEmployeeId) {
      nextErrors.employeeId = 'Employee ID must be unique.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSave() {
    if (!validateForm()) return

    const payload = {
      name: form.name.trim(),
      employeeId: form.employeeId.trim(),
      team: form.team.trim(),
      status: form.status,
    }

    if (editingId) {
      setAssociates((prev) =>
        prev.map((associate) =>
          associate.id === editingId ? { ...associate, ...payload } : associate
        )
      )
    } else {
      setAssociates((prev) => [
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
    const associate = associates.find((a) => a.id === id)
    const confirmed = window.confirm(`Delete associate "${associate?.name}"?`)
    if (!confirmed) return

    setAssociates((prev) => prev.filter((associate) => associate.id !== id))
  }

  if (!ready) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="h-3 w-20 rounded bg-surface-dynamic dark:bg-dark-dynamic mb-3" />
            <div className="h-8 w-14 rounded bg-surface-dynamic dark:bg-dark-dynamic mb-2" />
            <div className="h-3 w-24 rounded bg-surface-dynamic dark:bg-dark-dynamic" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink dark:text-white">Associates</h2>
          <p className="text-sm text-ink-muted dark:text-dark-dynamic mt-1">
            Add, edit, search, and manage associates used in daily work logging.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn-primary" onClick={openCreateModal}>
            <Plus size={15} /> Add Associate
          </button>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-ink-muted dark:text-dark-dynamic">Total Associates</p>
              <h3 className="text-2xl font-semibold mt-1 text-ink dark:text-white">{counts.total}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <p className="text-xs text-ink-muted dark:text-dark-dynamic">Active</p>
          <h3 className="text-2xl font-semibold mt-1 text-green-700 dark:text-green-300">{counts.active}</h3>
        </div>

        <div className="card p-4">
          <p className="text-xs text-ink-muted dark:text-dark-dynamic">Inactive</p>
          <h3 className="text-2xl font-semibold mt-1 text-slate-700 dark:text-slate-300">{counts.inactive}</h3>
        </div>

        <div className="card p-4">
          <p className="text-xs text-ink-muted dark:text-dark-dynamic">On Leave</p>
          <h3 className="text-2xl font-semibold mt-1 text-amber-700 dark:text-amber-300">{counts.leave}</h3>
        </div>
      </section>

      {/* Search + table */}
      <section className="card p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-ink dark:text-white">Associate Directory</h3>
            <p className="text-xs text-ink-muted dark:text-dark-dynamic mt-1">
              Search by name, employee ID, team, or status.
            </p>
          </div>

          <div className="relative w-full md:max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint dark:text-dark-dynamic" />
            <input
              data-search-input
              className="input pl-9"
              placeholder="Search associates"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border dark:border-dark-border">
                <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 px-2">Name</th>
                <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 px-2">Employee ID</th>
                <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 px-2">Team</th>
                <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 px-2">Status</th>
                <th className="text-right text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssociates.length > 0 ? (
                filteredAssociates.map((associate) => (
                  <tr
                    key={associate.id}
                    className="border-b border-surface-border/70 dark:border-dark-border/70 hover:bg-surface-2 dark:hover:bg-dark-surface2"
                  >
                    <td className="py-3 px-2 text-sm font-medium text-ink dark:text-white">{associate.name}</td>
                    <td className="py-3 px-2 text-sm text-ink-muted dark:text-dark-dynamic">{associate.employeeId}</td>
                    <td className="py-3 px-2 text-sm text-ink dark:text-white">{associate.team}</td>
                    <td className="py-3 px-2 text-sm">
                      <StatusBadge status={associate.status} />
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="btn-icon"
                          onClick={() => openEditModal(associate)}
                          aria-label={`Edit ${associate.name}`}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="btn-icon text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                          onClick={() => handleDelete(associate.id)}
                          aria-label={`Delete ${associate.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-sm text-ink-muted dark:text-dark-dynamic">
                    No associates found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="grid gap-3 md:hidden">
          {filteredAssociates.length > 0 ? (
            filteredAssociates.map((associate) => (
              <div key={associate.id} className="rounded-xl border border-surface-border dark:border-dark-border bg-surface-2 dark:bg-dark-surface2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-ink dark:text-white">{associate.name}</h4>
                    <p className="text-xs text-ink-muted dark:text-dark-dynamic mt-1">{associate.employeeId}</p>
                    <p className="text-xs text-ink-faint dark:text-dark-dynamic mt-1">{associate.team}</p>
                  </div>
                  <StatusBadge status={associate.status} />
                </div>

                <div className="flex items-center justify-end gap-1 mt-4">
                  <button
                    className="btn-icon"
                    onClick={() => openEditModal(associate)}
                    aria-label={`Edit ${associate.name}`}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className="btn-icon text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                    onClick={() => handleDelete(associate.id)}
                    aria-label={`Delete ${associate.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-surface-border dark:border-dark-border p-8 text-center text-sm text-ink-muted dark:text-dark-dynamic">
              No associates found.
            </div>
          )}
        </div>
      </section>

      <AssociateModal
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