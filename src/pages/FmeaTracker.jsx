import { useMemo, useState } from 'react'
import { ShieldAlert, Plus, Search, Trash2, Pencil, X, AlertTriangle, Download } from 'lucide-react'
import { useApp } from '../data/AppContext'
import { formatDate } from '../utils/date'

const EMPTY_FORM = {
  fmeaId: '',
  technicalIssue: '',
  latestUpdate: '',
  ownerId: '',
  dateLastUpdate: new Date().toISOString().slice(0, 10),
  dependency: '',
  status: 'Open',
}

function daysSince(dateStr) {
  if (!dateStr) return 0
  const then = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor(
    (now.setHours(0, 0, 0, 0) - then.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)
  )
  return diff >= 0 ? diff : 0
}

function getStatusTone(status) {
  if (status === 'Closed') {
    return 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300'
  }
  if (status === 'Blocked') {
    return 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300'
  }
  if (status === 'In Progress') {
    return 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'
  }
  return 'bg-surface-offset dark:bg-dark-offset text-ink dark:text-white'
}

function escapeCsvValue(value) {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function exportFmeasToCsv(fmeas, associates) {
  const headers = [
    'FMEA ID',
    'Technical Issue',
    'Follow Up - Summary',
    'Latest Update',
    'Owner',
    'Date - Last Update',
    'Dependency',
    'Status',
    'Date - Since Last Status',
    'Days Since Last Change',
  ]

  const rows = fmeas.map((item) => {
    const owner = associates.find((a) => a.id === item.ownerId)

    return [
      item.fmeaId,
      item.technicalIssue,
      item.followUpSummary,
      item.latestUpdate,
      owner?.name || 'Unassigned',
      item.dateLastUpdate,
      item.dependency,
      item.status,
      item.dateSinceLastStatus,
      daysSince(item.dateSinceLastStatus),
    ]
  })

  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `fmea-tracker-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function EditFmeaModal({ open, form, setForm, associates, onClose, onSave }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl card p-5 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-5">
          <h2 className="text-lg font-semibold text-ink dark:text-white">Edit FMEA Item</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-4">
          <div>
            <label className="label">FMEA ID</label>
            <input
              className="input"
              value={form.fmeaId}
              onChange={(e) => setForm((prev) => ({ ...prev, fmeaId: e.target.value }))}
              placeholder="e.g. FMEA-045"
            />
          </div>

          <div>
            <label className="label">Technical Issue</label>
            <input
              className="input"
              value={form.technicalIssue}
              onChange={(e) => setForm((prev) => ({ ...prev, technicalIssue: e.target.value }))}
              placeholder="Describe the technical issue"
            />
          </div>

          {form.followUpSummary && (
            <div>
              <label className="label">Follow Up - Summary (auto-generated history)</label>
              <div className="rounded-xl border border-surface-border dark:border-dark-border p-3 max-h-40 overflow-y-auto text-sm text-ink-muted dark:text-dark-dynamic whitespace-pre-line">
                {form.followUpSummary}
              </div>
            </div>
          )}

          <div>
            <label className="label">Latest Update</label>
            <textarea
              className="input min-h-[80px] resize-y"
              value={form.latestUpdate}
              onChange={(e) => setForm((prev) => ({ ...prev, latestUpdate: e.target.value }))}
              placeholder="Most recent update from owner"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Owner</label>
              <select
                className="select"
                value={form.ownerId}
                onChange={(e) => setForm((prev) => ({ ...prev, ownerId: e.target.value }))}
              >
                <option value="">Select owner</option>
                {associates.map((associate) => (
                  <option key={associate.id} value={associate.id}>
                    {associate.name} {associate.team ? `(${associate.team})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Date - Last Update</label>
              <input
                className="input"
                type="date"
                value={form.dateLastUpdate}
                onChange={(e) => setForm((prev) => ({ ...prev, dateLastUpdate: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Dependency</label>
              <input
                className="input"
                value={form.dependency}
                onChange={(e) => setForm((prev) => ({ ...prev, dependency: e.target.value }))}
                placeholder="e.g. Waiting on vendor, another team, etc."
              />
            </div>

            <div>
              <label className="label">Status</label>
              <select
                className="select"
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Blocked">Blocked</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
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

export default function FmeaTracker() {
  const {
    associates = [],
    fmeas = [],
    addFmea,
    updateFmea,
    deleteFmea,
    ready,
  } = useApp()

  const [search, setSearch] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)

  const filteredFmeas = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return fmeas

    return fmeas.filter((item) => {
      const owner = associates.find((a) => a.id === item.ownerId)
      return (
        item.fmeaId?.toLowerCase().includes(term) ||
        item.technicalIssue?.toLowerCase().includes(term) ||
        item.followUpSummary?.toLowerCase().includes(term) ||
        item.latestUpdate?.toLowerCase().includes(term) ||
        item.dependency?.toLowerCase().includes(term) ||
        owner?.name?.toLowerCase().includes(term)
      )
    })
  }, [fmeas, associates, search])

  const sortedFmeas = useMemo(() => {
    return [...filteredFmeas].sort((a, b) => {
      const timeA = a?.dateLastUpdate ? new Date(a.dateLastUpdate).getTime() : 0
      const timeB = b?.dateLastUpdate ? new Date(b.dateLastUpdate).getTime() : 0
      return timeB - timeA
    })
  }, [filteredFmeas])

  function handleAdd() {
    if (!form.fmeaId.trim() || !form.technicalIssue.trim()) return
    addFmea(form)
    setForm({ ...EMPTY_FORM, dateLastUpdate: new Date().toISOString().slice(0, 10) })
  }

  function openEdit(item) {
    setEditingId(item.id)
    setEditForm({
      fmeaId: item.fmeaId,
      technicalIssue: item.technicalIssue,
      followUpSummary: item.followUpSummary,
      latestUpdate: item.latestUpdate,
      ownerId: item.ownerId,
      dateLastUpdate: item.dateLastUpdate,
      dependency: item.dependency,
      status: item.status,
    })
  }

  function closeEdit() {
    setEditingId(null)
    setEditForm(EMPTY_FORM)
  }

  function handleSaveEdit() {
    if (!editingId || !editForm.fmeaId.trim() || !editForm.technicalIssue.trim()) return
    updateFmea(editingId, editForm)
    closeEdit()
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
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink dark:text-white">
            FMEA Tracker
          </h2>
          <p className="text-sm text-ink-muted dark:text-dark-dynamic mt-1">
            Track technical issues, owner follow-ups, and status changes over time.
          </p>
        </div>

        <span className="badge bg-surface-offset dark:bg-dark-offset text-ink dark:text-white">
          {fmeas.length} items
        </span>
      </section>

      <section className="card p-4 md:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert size={18} className="text-primary" />
          <h3 className="text-sm font-semibold text-ink dark:text-white">Add FMEA Item</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">FMEA ID</label>
            <input
              className="input"
              value={form.fmeaId}
              onChange={(e) => setForm((prev) => ({ ...prev, fmeaId: e.target.value }))}
              placeholder="e.g. FMEA-045 or your own ID"
            />
          </div>

          <div>
            <label className="label">Technical Issue</label>
            <input
              className="input"
              value={form.technicalIssue}
              onChange={(e) => setForm((prev) => ({ ...prev, technicalIssue: e.target.value }))}
              placeholder="Describe the technical issue"
            />
          </div>
        </div>

        <div>
          <label className="label">Latest Update</label>
          <textarea
            className="input min-h-[70px] resize-y"
            value={form.latestUpdate}
            onChange={(e) => setForm((prev) => ({ ...prev, latestUpdate: e.target.value }))}
            placeholder="Most recent update from owner"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Owner</label>
            <select
              className="select"
              value={form.ownerId}
              onChange={(e) => setForm((prev) => ({ ...prev, ownerId: e.target.value }))}
            >
              <option value="">Select owner</option>
              {associates.map((associate) => (
                <option key={associate.id} value={associate.id}>
                  {associate.name} {associate.team ? `(${associate.team})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Date - Last Update</label>
            <input
              className="input"
              type="date"
              value={form.dateLastUpdate}
              onChange={(e) => setForm((prev) => ({ ...prev, dateLastUpdate: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Dependency</label>
            <input
              className="input"
              value={form.dependency}
              onChange={(e) => setForm((prev) => ({ ...prev, dependency: e.target.value }))}
              placeholder="e.g. Waiting on vendor, another team, etc."
            />
          </div>

          <div>
            <label className="label">Status</label>
            <select
              className="select"
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Blocked">Blocked</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        <button className="btn-primary" onClick={handleAdd}>
          <Plus size={15} /> Add FMEA Item
        </button>
      </section>

      <section className="card p-4 md:p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint dark:text-dark-dynamic"
            />
            <input
              className="input pl-9"
              placeholder="Search by FMEA ID, technical issue, owner, dependency"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            className="btn-secondary shrink-0"
            onClick={() => exportFmeasToCsv(sortedFmeas, associates)}
          >
            <Download size={15} /> Export CSV
          </button>
        </div>

        {sortedFmeas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border dark:border-dark-border">
                  <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 pr-3">FMEA ID</th>
                  <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 pr-3">TECHNICAL ISSUE</th>
                  <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 pr-3">FOLLOW UP - SUMMARY</th>
                  <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 pr-3">LATEST UPDATE</th>
                  <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 pr-3">OWNER</th>
                  <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 pr-3">DATE - LAST UPDATE</th>
                  <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 pr-3">DEPENDENCY</th>
                  <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 pr-3">STATUS</th>
                  <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 pr-3">DATE - SINCE LAST STATUS</th>
                  <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 pr-3">DAYS SINCE LAST CHANGE</th>
                  <th className="text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 pr-3">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {sortedFmeas.map((item) => {
                  const owner = associates.find((a) => a.id === item.ownerId)

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-surface-border/70 dark:border-dark-border/70"
                    >
                      <td className="py-3 pr-3 text-sm font-medium text-ink dark:text-white whitespace-nowrap">
                        {item.fmeaId}
                      </td>
                      <td className="py-3 pr-3 text-sm font-medium text-ink dark:text-white max-w-[220px]">
                        {item.technicalIssue}
                      </td>
                      <td className="py-3 pr-3 text-xs text-ink-muted dark:text-dark-dynamic max-w-[220px] whitespace-pre-line">
                        {item.followUpSummary}
                      </td>
                      <td className="py-3 pr-3 text-sm text-ink-muted dark:text-dark-dynamic max-w-[220px]">
                        {item.latestUpdate}
                      </td>
                      <td className="py-3 pr-3 text-sm text-ink dark:text-white">
                        {owner?.name || 'Unassigned'}
                      </td>
                      <td className="py-3 pr-3 text-sm text-ink dark:text-white whitespace-nowrap">
                        {item.dateLastUpdate ? formatDate(item.dateLastUpdate) : '—'}
                      </td>
                      <td className="py-3 pr-3 text-sm text-ink-muted dark:text-dark-dynamic">
                        {item.dependency || '—'}
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${getStatusTone(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-sm text-ink dark:text-white whitespace-nowrap">
                        {item.dateSinceLastStatus ? formatDate(item.dateSinceLastStatus) : '—'}
                      </td>
                      <td className="py-3 pr-3 text-sm text-ink dark:text-white">
                        {daysSince(item.dateSinceLastStatus)}
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-1">
                          <button
                            className="btn-icon"
                            onClick={() => openEdit(item)}
                            aria-label={`Edit ${item.technicalIssue}`}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="btn-icon text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                            onClick={() => deleteFmea(item.id)}
                            aria-label={`Delete ${item.technicalIssue}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-surface-border dark:border-dark-border p-8 text-center">
            <AlertTriangle size={20} className="mx-auto mb-2 text-ink-faint dark:text-dark-dynamic" />
            <p className="text-sm text-ink-muted dark:text-dark-dynamic">
              No FMEA items found.
            </p>
          </div>
        )}
      </section>

      <EditFmeaModal
        open={Boolean(editingId)}
        form={editForm}
        setForm={setEditForm}
        associates={associates}
        onClose={closeEdit}
        onSave={handleSaveEdit}
      />
    </div>
  )
}