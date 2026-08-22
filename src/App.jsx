import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SelectedGradeProvider } from './context/SelectedGradeContext'
import { HeaderStatsProvider } from './context/HeaderStatsContext'
import { ProtectedRoute } from './components/ui/ProtectedRoute'
import Layout from './components/ui/Layout'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import QuestionsPage from './pages/teacher/QuestionsPage'
import ExamsPage from './pages/teacher/ExamsPage'
import TopicsPage from './pages/teacher/TopicsPage'
import GradesPage from './pages/teacher/GradesPage'
import ClassesPage from './pages/teacher/ClassesPage'
import StudentsPage from './pages/teacher/StudentsPage'
import ExamStatsPage from './pages/teacher/ExamStatsPage'
import ExamResultsPage from './pages/teacher/ExamResultsPage'
import LessonsPage from './pages/teacher/LessonsPage'
import LessonSubmissionsPage from './pages/teacher/LessonSubmissionsPage'
import AssistantsPage from './pages/teacher/AssistantsPage'
import AiAssistantPage from './pages/teacher/AiAssistantPage'
import StudentNotesPage from './pages/teacher/StudentNotesPage'
import AttendancePage from './pages/teacher/AttendancePage'
import RewardsPage from './pages/teacher/RewardsPage'
import Sb3PreviewPage from './pages/teacher/Sb3PreviewPage'
import MessagesInboxPage from './pages/teacher/MessagesInboxPage'
import MessagesPage from './pages/student/MessagesPage'
import StudentDashboard from './pages/student/StudentDashboard'
import PracticePage from './pages/student/PracticePage'
import HistoryPage from './pages/student/HistoryPage'
import StudentExamsPage from './pages/student/ExamsPage'
import LearnPage from './pages/student/LearnPage'
import LessonPage from './pages/student/LessonPage'
import JoinCoursePage from './pages/student/JoinCoursePage'
import NotesPage from './pages/student/NotesPage'

function RootRedirect() {
  const { profile, loading } = useAuth()
  if (loading) return null
  if (!profile) return <Navigate to="/login" replace />
  if (profile.role === 'teacher' || profile.role === 'assistant') return <Navigate to="/teacher" replace />
  return <Navigate to="/student/learn" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SelectedGradeProvider>
        <HeaderStatsProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Teacher routes */}
          <Route path="/teacher" element={
            <ProtectedRoute role="teacher">
              <Layout><TeacherDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/teacher/questions" element={
            <ProtectedRoute role="teacher">
              <Layout><QuestionsPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/teacher/topics" element={
            <ProtectedRoute role="teacher">
              <Layout><TopicsPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/teacher/exams" element={
            <ProtectedRoute role="teacher">
              <Layout><ExamsPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/teacher/grades" element={
            <ProtectedRoute role="teacher">
              <Layout><GradesPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/teacher/classes" element={
            <ProtectedRoute role="teacher">
              <Layout><ClassesPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/teacher/students" element={
            <ProtectedRoute role="teacher">
              <Layout><StudentsPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/teacher/exam-stats" element={
            <ProtectedRoute role="teacher">
              <Layout><ExamStatsPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/teacher/exams/:id/results" element={
            <ProtectedRoute role="teacher">
              <Layout><ExamResultsPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/teacher/lessons" element={
            <ProtectedRoute role="teacher">
              <Layout><LessonsPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/teacher/lessons/:id/submissions" element={
            <ProtectedRoute role="teacher">
              <Layout><LessonSubmissionsPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/teacher/assistants" element={
            <ProtectedRoute role="teacher">
              <Layout><AssistantsPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/teacher/ai-assistant" element={
            <ProtectedRoute role="teacher">
              <Layout><AiAssistantPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/teacher/notes" element={
            <ProtectedRoute role="teacher">
              <Layout><StudentNotesPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/teacher/attendance" element={
            <ProtectedRoute role="teacher">
              <Layout><AttendancePage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/teacher/rewards" element={
            <ProtectedRoute role="teacher">
              <Layout><RewardsPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/teacher/messages" element={
            <ProtectedRoute role="teacher">
              <Layout><MessagesInboxPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/teacher/sb3-preview" element={
            <ProtectedRoute role="teacher">
              <Layout><Sb3PreviewPage /></Layout>
            </ProtectedRoute>
          } />

          {/* Student messages */}
          <Route path="/student/messages" element={
            <ProtectedRoute role="student">
              <Layout><MessagesPage /></Layout>
            </ProtectedRoute>
          } />

          {/* Student routes */}
          <Route path="/student" element={
            <ProtectedRoute role="student">
              <Layout><StudentDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/student/practice" element={
            <ProtectedRoute role="student">
              <Layout><PracticePage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/student/history" element={
            <ProtectedRoute role="student">
              <Layout><HistoryPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/student/exams" element={
            <ProtectedRoute role="student">
              <Layout><StudentExamsPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/student/learn" element={
            <ProtectedRoute role="student">
              <Layout><LearnPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/student/learn/:id" element={
            <ProtectedRoute role="student">
              <Layout><LessonPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/student/courses" element={
            <ProtectedRoute role="student">
              <Layout><JoinCoursePage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/student/notes" element={
            <ProtectedRoute role="student">
              <Layout><NotesPage /></Layout>
            </ProtectedRoute>
          } />
        </Routes>
        </HeaderStatsProvider>
        </SelectedGradeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
