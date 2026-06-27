export function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateShort(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

export function getWeekRange(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diffToMon = day === 0 ? -6 : 1 - day
  const mon = new Date(d)
  mon.setDate(d.getDate() + diffToMon)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)

  return {
    start: mon.toISOString().split('T')[0],
    end: sun.toISOString().split('T')[0],
  }
}

export function getMonthRange(date = new Date()) {
  const y = date.getFullYear()
  const m = date.getMonth()
  const start = new Date(y, m, 1).toISOString().split('T')[0]
  const end = new Date(y, m + 1, 0).toISOString().split('T')[0]
  return { start, end }
}

export function isInRange(iso, start, end) {
  return iso >= start && iso <= end
}

export function getLast7Days() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}