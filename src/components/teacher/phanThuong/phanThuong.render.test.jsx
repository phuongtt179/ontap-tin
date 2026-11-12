// Dựng thử trang Phần thưởng: 3 tab + form quà (hook giả lập — không gọi DB).
import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'

vi.mock('../../../lib/supabase', () => ({ supabase: { from: () => { throw new Error('không gọi DB khi dựng thử') } } }))
vi.mock('../../../hooks/useGrades', () => ({ useGrades: () => ({ grades: ['K3', 'K5'] }) }))
import RewardsPage from '../../../pages/teacher/RewardsPage'
import TabQua from './TabQua'
import TabYeuCau from './TabYeuCau'
import TabNguong from './TabNguong'
import FormQua from './FormQua'

const khong = () => {}
const QUA = [{ id: 1, name: 'Bút chì', emoji: '✏️', is_active: true, grade: 'K3', sticker_cost: 5 }, { id: 2, name: 'Kẹo', emoji: '🍬', is_active: false, grade: null, sticker_cost: 2 }]
const YC = [{ id: 9, student_id: 'a', status: 'pending', sticker_cost: 5, created_at: '2026-11-12T08:00:00Z', reward_items: { name: 'Bút chì', emoji: '✏️' }, profiles: { full_name: 'An', id: 'a' }, class_name: '4A' }]
const h = (them = {}) => ({
  tab: 'items', setTab: khong, items: QUA, requests: YC, configs: { K3: 15 }, loading: false, gradeFilter: '__all__', setGradeFilter: khong,
  showForm: false, setShowForm: khong, editItem: null, formName: '', setFormName: khong, formEmoji: '🎁', setFormEmoji: khong, formGrade: '', setFormGrade: khong,
  formCost: 10, setFormCost: khong, saving: false, fulfilling: null, filterStatus: 'pending', setFilterStatus: khong, sortBy: 'date', sortAsc: false,
  editingThreshold: { K3: 15 }, setEditingThreshold: khong, savingConfig: null, saveThreshold: khong, openAdd: khong, openEdit: khong, saveItem: khong,
  deleteItem: khong, toggleActive: khong, fulfillRequest: khong, cancelRequest: khong, toggleSort: khong,
  pendingCount: 1, filteredReqs: YC, displayItems: QUA, ...them,
})

describe('trang Phần thưởng', () => {
  it('đang tải (chưa gọi DB khi dựng)', () => expect(renderToString(<RewardsPage />)).toContain('animate-spin'))
  it('tab quà', () => expect(renderToString(<TabQua h={h()} grades={['K3']} />)).toContain('Bút chì'))
  it('tab yêu cầu', () => expect(renderToString(<TabYeuCau h={h({ tab: 'requests' })} />)).toContain('An'))
  it('tab ngưỡng', () => expect(renderToString(<TabNguong h={h({ tab: 'config' })} grades={['K3', 'K5']} />)).toContain('K5'))
  it('form thêm quà', () => expect(renderToString(<FormQua h={h({ showForm: true })} grades={['K3']} />)).toContain('🍬'))
})
