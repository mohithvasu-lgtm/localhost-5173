import { useState } from 'react'
import {
  FileText,
  Trash2,
  CalendarDays,
  ClipboardList,
  Copy,
  Check,
} from 'lucide-react'
import { useApp } from '../data/AppContext'

export default function MOM() {
  const { momEntries = [], deleteMomEntry, ready } = useApp()
  const [copiedId, setCopiedId] = useState(null)

  async function handleCopy(content, id) {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(id)

      window.setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current))
      }, 2000)
    } catch (error) {
      console.error('Failed to copy MOM:', error)
      window.alert('Copy failed. Please try again.')
    }
  }

  if (!ready) {
    return (
      <div className="space-y-4">
        <div className="card p-5 animate-pulse">
          <div className="h-5 w-40 rounded bg-surface-dynamic dark:bg-dark-dynamic mb-3" />
          <div className="h-4 w-72 rounded bg-surface-dynamic dark:bg-dark-dynamic" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink dark:text-white">MOM</h2>
          <p className="text-sm text-ink-muted dark:text-dark-dynamic mt-1">
            Auto-generated minutes of meeting from daily stand-up updates.
          </p>
        </div>
      </section>

      {momEntries.length > 0 ? (
        <section className="space-y-4">
          {momEntries.map((entry) => (
            <article key={entry.id} className="card p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <ClipboardList size={16} className="text-primary" />
                    <h3 className="text-base font-semibold text-ink dark:text-white">
                      {entry.title}
                    </h3>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-muted dark:text-dark-dynamic">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={13} />
                      {entry.date}
                    </span>
                    <span className="badge bg-primary/10 text-primary">
                      {entry.type}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleCopy(entry.content, entry.id)}
                  >
                    {copiedId === entry.id ? <Check size={14} /> : <Copy size={14} />}
                    {copiedId === entry.id ? 'Copied' : 'Copy MOM'}
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => deleteMomEntry(entry.id)}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-surface-border dark:border-dark-border bg-surface-offset dark:bg-dark-offset p-4">
                <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-ink dark:text-white font-sans">
                  {entry.content}
                </pre>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="card p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileText size={20} />
          </div>
          <h3 className="text-base font-semibold text-ink dark:text-white">No MOM entries yet</h3>
          <p className="mt-2 text-sm text-ink-muted dark:text-dark-dynamic">
            Save a generated MOM from the Stand-up page and it will appear here.
          </p>
        </section>
      )}
    </div>
  )
}