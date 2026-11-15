import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// Ganti `site` dengan domain sendiri setelah dibeli (mis. https://dandielucky.com)
// Untuk sementara situs terbit di GitHub Pages: https://dandielucky.github.io
export default defineConfig({
  site: 'https://dandielucky.github.io',
  integrations: [mdx()],
  build: { inlineStylesheets: 'auto' },
  vite: {
    build: { assetsInlineLimit: 2048 },
    // Saat pratinjau dibuka lewat tunnel (trycloudflare/localtunnel), Host-nya bukan
    // localhost — tanpa daftar ini Vite menjawab 403 "Blocked request".
    server: { allowedHosts: ['.trycloudflare.com', '.loca.lt', '.ngrok-free.app'] },
    preview: { allowedHosts: ['.trycloudflare.com', '.loca.lt', '.ngrok-free.app'] },
  },
});
