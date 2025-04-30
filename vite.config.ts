import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { viteStaticCopy } from 'vite-plugin-static-copy';
export default defineConfig({
  base: '/Profile-Adventure/', 
  plugins: [
    tailwindcss(),
    viteStaticCopy({
      targets: [
        {
          src: 'src/assets/models/terrain/*',
          dest: 'models'
        }
      ]
    })
  ],
})