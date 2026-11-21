// Dựng thử trang Ngân hàng câu hỏi (đang tải) + thanh cây chủ đề.
import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'

vi.mock('../../../lib/supabase', () => ({ supabase: { from: () => { throw new Error('không gọi DB khi dựng thử') } } }))
vi.mock('../../../context/AuthContext', () => ({ useAuth: () => ({ canDelete: true, user: { id: 'gv' } }) }))
import QuestionsPage from '../../../pages/teacher/QuestionsPage'
import CayCauHoi from './CayCauHoi'

const khong = () => {}
describe('ngân hàng câu hỏi', () => {
  it('trang', () => expect(renderToString(<QuestionsPage />).length).toBeGreaterThan(200))
  it('cây chủ đề có số câu', () => {
    const html = renderToString(<CayCauHoi GRADES={['K3']} selectedGrade="K3" handleGradeChange={khong} topicsLoading={false} loading={false}
      gradeTopics={[{ id: 1, name: 'Chủ đề 1' }]} expandedTopics={{ 'Chủ đề 1': true }} selectedTopic="Chủ đề 1" handleTopicClick={khong}
      unitsByTopic={{ 'Chủ đề 1': [{ id: 'u', name: 'Đơn vị 1' }] }} selectedUnit={{ id: 'u', name: 'Đơn vị 1' }} handleUnitClick={khong}
      unitLessonTitles={[{ id: 't', name: 'Tiêu đề 1' }]} selectedLessonTitle={null} setSelectedLessonTitle={khong} setSelectedTopic={khong}
      countByTopic={{ 'Chủ đề 1': 5 }} countByUnit={{ u: 3 }} countByLessonTitle={{ t: 1 }} sidebarOpen setSidebarOpen={khong} />)
    expect(html).toContain('Đơn vị 1')
    expect(html).toContain('Tiêu đề 1')
  })
})
