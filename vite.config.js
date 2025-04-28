import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración de Vite
export default defineConfig({
  plugins: [react()],
  root: './',   // Asegura que la raíz sea la carpeta actual.
  build: {
    outDir: 'dist',  // Esto genera la carpeta 'dist' donde se compilarán los archivos de producción
  },
});
