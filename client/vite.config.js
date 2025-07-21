import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import flowbiteReact from 'flowbite-react/plugin/vite'
import strip from '@rollup/plugin-strip'
import { obfuscator } from 'rollup-obfuscator'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    flowbiteReact(),
    strip({
      include: ['**/*.{js,ts,jsx,tsx}'],
      functions: ['console.log', 'console.debug', 'console.warn', 'console.error', 'debugger'],
    }),
    obfuscator({
      include: ['**/assets/**/*.js'], // aplica solo al código final
      compact: true,
      controlFlowFlattening: true,
      deadCodeInjection: true,
      stringArray: true,
      stringArrayEncoding: ['base64'],
      stringArrayRotate: true,
      unicodeEscapeSequence: false,
    })
  ],
  build: {
    sourcemap: false,
    minify: 'terser',
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
