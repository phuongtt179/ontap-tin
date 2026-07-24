import { Component } from 'react'
import { RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('Lỗi giao diện:', error)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-3">😵</div>
          <h1 className="text-lg font-bold text-gray-800 mb-1">Có lỗi xảy ra</h1>
          <p className="text-sm text-gray-500 mb-4">
            Trang gặp trục trặc hiển thị (thường do tiện ích mở rộng trình duyệt). Thử tải lại trang nhé.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700"
          >
            <RefreshCw size={15} /> Tải lại trang
          </button>
        </div>
      </div>
    )
  }
}
