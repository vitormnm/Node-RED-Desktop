import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Utilities
import { fileURLToPath, URL } from 'node:url'
import Fonts from 'unplugin-fonts/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',   //electron
  plugins: [
    vue(),
    Fonts({
      fontsource: {
        families: [
          {
            name: 'Roboto',
            weights: [100, 300, 400, 500, 700, 900],
            styles: ['normal', 'italic'],
          },
        ],
      },
    }),

  ],



  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ],
  },
})
