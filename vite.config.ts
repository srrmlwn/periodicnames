import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { prerenderNames } from './scripts/prerenderNames'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), prerenderNames()],
})
