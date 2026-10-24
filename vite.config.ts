import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' makes the build work on GitHub Pages sub-paths, Netlify and Vercel alike
export default defineConfig({ base: './', plugins: [react()] })
