// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Dominio custom per le demo. Nessun `base`: le route restano `/<slug>`.
export default defineConfig({
  site: 'https://demo.zenith-studio.it',
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
});
