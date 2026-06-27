export function distributeAllocation(count) {
  if (count === 0) return []
  if (count === 1) return [1]

  const base = +(1 / count).toFixed(2)
  const arr = Array(count).fill(base)
  const sum = arr.reduce((a, b) => a + b, 0)
  const diff = +(1 - sum).toFixed(2)

  arr[count - 1] = +(arr[count - 1] + diff).toFixed(2)
  return arr
}

export function totalAllocation(tasks) {
  return +tasks.reduce((sum, task) => sum + (parseFloat(task.allocation) || 0), 0).toFixed(2)
}

export function allocationWarning(tasks) {
  const total = totalAllocation(tasks)
  if (Math.abs(total - 1) < 0.001) return null
  if (total > 1) return `Over-allocated by ${+(total - 1).toFixed(2)} — total is ${total}`
  return `Under-allocated by ${+(1 - total).toFixed(2)} — total is ${total}`
}