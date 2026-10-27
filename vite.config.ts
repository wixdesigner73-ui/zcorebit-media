import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

// Injects the public site URL into index.html (canonical, Open Graph, JSON-LD)
// and writes a 404.html copy so GitHub Pages can serve the SPA on deep links.
function siteHtml(siteUrl: string): Plugin {
  let outDir = 'dist';
  return {
    name: 'zcorebit-site-html',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    transformIndexHtml(html) {
      return html.replaceAll('__SITE_URL__', siteUrl.replace(/\/$/, ''));
    },
    closeBundle() {
      const index = path.join(outDir, 'index.html');
      if (fs.existsSync(index)) fs.copyFileSync(index, path.join(outDir, '404.html'));
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const siteUrl = env.VITE_SITE_URL || 'https://media.zcorebit.com';
  return {
    base: env.VITE_BASE || '/',
    plugins: [react(), siteHtml(siteUrl)],
    css: {
      preprocessorOptions: {
        scss: { api: 'modern-compiler' },
      },
    },
    build: {
      target: 'es2020',
      cssCodeSplit: true,
      sourcemap: false,
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks: {
            three: ['three'],
            motion: ['gsap', 'gsap/ScrollTrigger', 'lenis'],
            react: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
  };
});
