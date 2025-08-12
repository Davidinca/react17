import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx']
  },
  esbuild: {
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment'
  },
  server: {
    host: '0.0.0.0',       // Escucha en todas las interfaces
    port: 5173,            // Puedes cambiarlo si lo necesitas
    strictPort: true       // Evita que Vite cambie el puerto si está ocupado
  }
})