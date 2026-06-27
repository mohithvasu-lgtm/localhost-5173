const KEYS = {
  ASSOCIATES: 'wlt_associates',
  GOALS: 'wlt_goals',
  STANDUPS: 'wlt_standups',
  SETTINGS: 'wlt_settings',
}

export function load(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function save(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.error('Storage write error:', e)
  }
}

export function loadAssociates() {
  return load(KEYS.ASSOCIATES) || []
}

export function saveAssociates(data) {
  save(KEYS.ASSOCIATES, data)
}

export function loadGoals() {
  return load(KEYS.GOALS) || []
}

export function saveGoals(data) {
  save(KEYS.GOALS, data)
}

export function loadStandups() {
  return load(KEYS.STANDUPS) || []
}

export function saveStandups(data) {
  save(KEYS.STANDUPS, data)
}

export function loadSettings() {
  return load(KEYS.SETTINGS) || { theme: 'light', managerName: 'Manager' }
}

export function saveSettings(data) {
  save(KEYS.SETTINGS, data)
}