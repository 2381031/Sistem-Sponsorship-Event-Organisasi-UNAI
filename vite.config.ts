import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

export default defineConfig({
  base: '/',
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss({content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}']}),
        autoprefixer(),
      ],
    },
  },
});
