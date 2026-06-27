import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AppContext = createContext(null)

const STORAGE_KEYS = {
  associates: 'standup-associates',
  standups: 'standup-entries',
  momEntries: 'standup-mom-entries',
  goals: 'standup-goals',
  settings: 'standup-settings',
  buckets: 'standup-buckets',
  tasks: 'standup-tasks',
}

const DEFAULT_BUCKETS = [
  {
    id: crypto.randomUUID(),
    name: 'To Do',
    color: '#64748b',
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'In Progress',
    color: '#2563eb',
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Review',
    color: '#d97706',
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Done',
    color: '#16a34a',
    createdAt: new Date().toISOString(),
  },
]

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function normalizeBuckets(value) {
  if (!Array.isArray(value) || value.length === 0) return DEFAULT_BUCKETS
  return value
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

function normalizeAssociateIds(task = {}) {
  if (Array.isArray(task.associateIds)) {
    return [...new Set(task.associateIds.filter(Boolean))]
  }

  if (task.associateId) {
    return [task.associateId]
  }

  return []
}

function hasSameTaskTitle(a, b) {
  return normalizeText(a) === normalizeText(b)
}

function areSameAssociateSet(a = [], b = []) {
  if (a.length !== b.length) return false

  const sortedA = [...new Set(a.filter(Boolean))].sort()
  const sortedB = [...new Set(b.filter(Boolean))].sort()

  if (sortedA.length !== sortedB.length) return false

  return sortedA.every((value, index) => value === sortedB[index])
}

function normalizeTask(task = {}) {
  return {
    ...task,
    title: task.title?.trim?.() || '',
    associateIds: normalizeAssociateIds(task),
    associateId: '',
    bucketId: task.bucketId || '',
    goalId: task.goalId || '',
    status: task.status || 'Not Started',
    priority: task.priority || 'Medium',
    blocker: task.blocker || 'None',
    comments: task.comments || '',
    allocation: task.allocation || '1',
    standupDate: task.standupDate || '',
    linkedStandupTaskId: task.linkedStandupTaskId || '',
    subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || new Date().toISOString(),
  }
}

function normalizeTasks(value) {
  if (!Array.isArray(value)) return []
  return value.map(normalizeTask)
}

export function AppProvider({ children }) {
  const [associates, setAssociates] = useState([])
  const [standups, setStandups] = useState([])
  const [momEntries, setMomEntries] = useState([])
  const [goals, setGoals] = useState([])
  const [settings, setSettings] = useState({})
  const [buckets, setBuckets] = useState(DEFAULT_BUCKETS)
  const [tasks, setTasks] = useState([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setAssociates(loadFromStorage(STORAGE_KEYS.associates, []))
    setStandups(loadFromStorage(STORAGE_KEYS.standups, []))
    setMomEntries(loadFromStorage(STORAGE_KEYS.momEntries, []))
    setGoals(loadFromStorage(STORAGE_KEYS.goals, []))
    setSettings(loadFromStorage(STORAGE_KEYS.settings, {}))
    setBuckets(normalizeBuckets(loadFromStorage(STORAGE_KEYS.buckets, DEFAULT_BUCKETS)))
    setTasks(normalizeTasks(loadFromStorage(STORAGE_KEYS.tasks, [])))
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem(STORAGE_KEYS.associates, JSON.stringify(associates))
  }, [associates, ready])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem(STORAGE_KEYS.standups, JSON.stringify(standups))
  }, [standups, ready])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem(STORAGE_KEYS.momEntries, JSON.stringify(momEntries))
  }, [momEntries, ready])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(goals))
  }, [goals, ready])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings))
  }, [settings, ready])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem(STORAGE_KEYS.buckets, JSON.stringify(buckets))
  }, [buckets, ready])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks))
  }, [tasks, ready])

  function addAssociate(payload) {
    const newAssociate = {
      id: crypto.randomUUID(),
      name: payload.name,
      employeeId: payload.employeeId,
      team: payload.team,
      createdAt: new Date().toISOString(),
    }

    setAssociates((prev) => [newAssociate, ...prev])
  }

  function updateAssociate(id, updates) {
    setAssociates((prev) =>
      prev.map((associate) =>
        associate.id === id ? { ...associate, ...updates } : associate
      )
    )
  }

  function deleteAssociate(id) {
    setAssociates((prev) => prev.filter((associate) => associate.id !== id))
    setTasks((prev) =>
      prev
        .map((task) => ({
          ...task,
          associateIds: (task.associateIds || []).filter((associateId) => associateId !== id),
        }))
        .filter((task) => task.associateIds.length > 0 || !task.linkedStandupTaskId)
    )
  }

  function saveStandupForDate(date, associatesForDay) {
    setStandups((prev) => {
      const existingIndex = prev.findIndex((item) => item.date === date)

      const payload = {
        date,
        associates: associatesForDay,
        updatedAt: new Date().toISOString(),
      }

      if (existingIndex >= 0) {
        const cloned = [...prev]
        cloned[existingIndex] = payload
        return cloned
      }

      return [payload, ...prev]
    })
  }

  function deleteStandupByDate(date) {
    setStandups((prev) => prev.filter((item) => item.date !== date))
  }

  function addMomEntry(payload) {
    const newEntry = {
      id: crypto.randomUUID(),
      title: payload.title,
      date: payload.date,
      content: payload.content,
      type: payload.type || 'auto-generated',
      createdAt: new Date().toISOString(),
    }

    setMomEntries((prev) => {
      const filtered = prev.filter(
        (item) => !(item.date === payload.date && item.type === 'auto-generated')
      )
      return [newEntry, ...filtered]
    })
  }

  function deleteMomEntry(id) {
    setMomEntries((prev) => prev.filter((item) => item.id !== id))
  }

  function addBucket(payload) {
    const newBucket = {
      id: crypto.randomUUID(),
      name: payload.name?.trim() || 'Untitled Bucket',
      color: payload.color || '#64748b',
      createdAt: new Date().toISOString(),
    }

    setBuckets((prev) => [...prev, newBucket])
    return newBucket
  }

  function updateBucket(id, updates) {
    setBuckets((prev) =>
      prev.map((bucket) =>
        bucket.id === id ? { ...bucket, ...updates } : bucket
      )
    )
  }

  function deleteBucket(id) {
    setBuckets((prev) => prev.filter((bucket) => bucket.id !== id))
    setTasks((prev) =>
      prev.map((task) =>
        task.bucketId === id ? { ...task, bucketId: '' } : task
      )
    )
  }

  function addTask(payload) {
    const candidateAssociateIds = Array.isArray(payload.associateIds)
      ? [...new Set(payload.associateIds.filter(Boolean))]
      : payload.associateId
        ? [payload.associateId]
        : []

    const normalizedTitle = payload.title?.trim() || ''
    let resultTask = null

    setTasks((prev) => {
      const existing = prev.find((task) =>
        !task.linkedStandupTaskId &&
        hasSameTaskTitle(task.title, normalizedTitle) &&
        areSameAssociateSet(task.associateIds || [], candidateAssociateIds)
      )

      if (existing) {
        resultTask = normalizeTask({
          ...existing,
          ...payload,
          title: normalizedTitle,
          associateIds: candidateAssociateIds,
          subtasks: Array.isArray(payload.subtasks) ? payload.subtasks : existing.subtasks || [],
          updatedAt: new Date().toISOString(),
        })

        return prev.map((task) => (task.id === existing.id ? resultTask : task))
      }

      resultTask = normalizeTask({
        id: crypto.randomUUID(),
        title: normalizedTitle,
        associateIds: candidateAssociateIds,
        bucketId: payload.bucketId || '',
        goalId: payload.goalId || '',
        status: payload.status || 'Not Started',
        priority: payload.priority || 'Medium',
        blocker: payload.blocker || 'None',
        comments: payload.comments || '',
        allocation: payload.allocation || '1',
        standupDate: payload.standupDate || '',
        linkedStandupTaskId: payload.linkedStandupTaskId || '',
        subtasks: Array.isArray(payload.subtasks) ? payload.subtasks : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      return [resultTask, ...prev]
    })

    return resultTask
  }

  function updateTask(id, updates) {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task

        const nextAssociateIds = Array.isArray(updates.associateIds)
          ? updates.associateIds
          : updates.associateId
            ? [updates.associateId]
            : task.associateIds

        return normalizeTask({
          ...task,
          ...updates,
          associateIds: nextAssociateIds,
          subtasks: Array.isArray(updates.subtasks)
            ? updates.subtasks
            : task.subtasks,
          updatedAt: new Date().toISOString(),
        })
      })
    )
  }

  function deleteTask(id) {
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }

  function upsertTaskByLinkedStandupTaskId(linkedStandupTaskId, payload) {
    const candidateAssociateIds = Array.isArray(payload.associateIds)
      ? [...new Set(payload.associateIds.filter(Boolean))]
      : payload.associateId
        ? [payload.associateId]
        : []

    const normalizedTitle = payload.title?.trim() || ''
    let resultTask = null

    setTasks((prev) => {
      const existingByLinkedId = prev.find(
        (task) =>
          task.linkedStandupTaskId === linkedStandupTaskId ||
          task.id === linkedStandupTaskId
      )

      if (existingByLinkedId) {
        const sameTitle = hasSameTaskTitle(existingByLinkedId.title, normalizedTitle)
        const sameAssociates = areSameAssociateSet(
          existingByLinkedId.associateIds || [],
          candidateAssociateIds
        )

        if (sameTitle && sameAssociates) {
          resultTask = normalizeTask({
            ...existingByLinkedId,
            ...payload,
            title: existingByLinkedId.title,
            associateIds: candidateAssociateIds,
            linkedStandupTaskId:
              existingByLinkedId.linkedStandupTaskId || linkedStandupTaskId,
            subtasks: Array.isArray(payload.subtasks)
              ? payload.subtasks
              : existingByLinkedId.subtasks || [],
            updatedAt: new Date().toISOString(),
          })

          return prev.map((task) =>
            task.id === existingByLinkedId.id ? resultTask : task
          )
        }
      }

      resultTask = normalizeTask({
        id: crypto.randomUUID(),
        title: normalizedTitle,
        associateIds: candidateAssociateIds,
        bucketId: payload.bucketId || '',
        goalId: payload.goalId || '',
        status: payload.status || 'Not Started',
        priority: payload.priority || 'Medium',
        blocker: payload.blocker || 'None',
        comments: payload.comments || '',
        allocation: payload.allocation || '1',
        standupDate: payload.standupDate || '',
        linkedStandupTaskId,
        subtasks: Array.isArray(payload.subtasks) ? payload.subtasks : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      return [resultTask, ...prev]
    })

    return resultTask
  }

  const value = useMemo(
    () => ({
      associates,
      setAssociates,
      addAssociate,
      updateAssociate,
      deleteAssociate,

      standups,
      setStandups,
      saveStandupForDate,
      deleteStandupByDate,

      momEntries,
      setMomEntries,
      addMomEntry,
      deleteMomEntry,

      goals,
      setGoals,

      settings,
      setSettings,

      buckets,
      setBuckets,
      addBucket,
      updateBucket,
      deleteBucket,

      tasks,
      setTasks,
      addTask,
      updateTask,
      deleteTask,
      upsertTaskByLinkedStandupTaskId,

      ready,
    }),
    [associates, standups, momEntries, goals, settings, buckets, tasks, ready]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)

  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }

  return context
}