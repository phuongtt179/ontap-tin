import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Mã bản build: nhúng vào code (__BUILD_ID__) và ghi ra /version.json.
// Tab đang mở lâu ngày tự so với version.json → thấy khác thì mời tải lại (BanMoi.jsx).
const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || String(Date.now())

const ghiVersion = {
  name: 'ghi-version-json',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ id: BUILD_ID }) })
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss(), ghiVersion],
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
})
