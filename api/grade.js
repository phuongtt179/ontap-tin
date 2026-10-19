import { gradeTasks } from './_gradeCore.js'
import { requireUser, studentAiDirect, STAFF } from './_auth.js'

export const config = { maxDuration: 60 }   // đủ thời gian thử lại + chuyển model dự phòng khi Google quá tải

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  // Mặc định chỉ giáo viên/trợ giảng được gọi AI chấm (học sinh không tương tác trực tiếp với AI)
  if (!(await requireUser(req, res, studentAiDirect() ? null : STAFF))) return

  const { tasks } = req.body || {}
  if (!Array.isArray(tasks) || tasks.length === 0)
    return res.status(400).json({ error: 'no_tasks' })

  const r = await gradeTasks(tasks)
  return res.status(r.status).json(r.body)
}
