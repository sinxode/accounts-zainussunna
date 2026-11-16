import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

const variablesPath = fileURLToPath(new URL('./src/styles/design-system/variables.scss', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  css: {
    modules: {
      // generate scoped class names
      generateScopedName: '[name]__[local]___[hash:base64:5]',
    },
    preprocessorOptions: {
      scss: {
        // additionalData imports variables globally
        additionalData: `@import "${variablesPath}";\n`
      },
    },
  },
})
