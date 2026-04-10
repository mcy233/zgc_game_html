import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

/** GitHub Pages 项目站为 https://用户.github.io/仓库名/ ，构建时需 base=/仓库名/；本地不设 VITE_BASE_PATH 即可 */
function viteBase(): string {
  const raw = process.env.VITE_BASE_PATH;
  if (!raw || raw === '/') return '/';
  const withSlash = raw.endsWith('/') ? raw : `${raw}/`;
  return withSlash.startsWith('/') ? withSlash : `/${withSlash}`;
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: viteBase(),
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
