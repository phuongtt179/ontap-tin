import { apiFetch } from '../lib/apiFetch'
import { prepareTasks } from './gradePrep.js'

export { parseTestCases } from './gradePrep.js'

// Bundle all tasks for a student into 1 API call
// submissions: array indexed by task (null = not submitted)
// taskDefs: array of {instructions} objects
// Returns: { results: [{taskIndex, score, comment}] }
export async function gradeStudent(submissions, taskDefs) {
  const preparedTasks = await prepareTasks(submissions, taskDefs)
  if (preparedTasks.length === 0) return { results: [] }

  const res = await apiFetch('/api/grade', { tasks: preparedTasks })

  if (res.status === 429) {
    const err = await res.json().catch(() => ({}))
    const e = new Error(err.error || 'quota_rpm')
    e.quotaType = err.error || 'quota_rpm'
    throw e
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ? `grade_error (${err.error})` : 'grade_error')
  }
  return res.json()
}
