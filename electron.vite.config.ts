import { resolve } from 'node:path';
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';

const pages = ['app_page', 'extended_toolbar_page', 'about_page', 'settings_page', 'panel_page', 'update_page'];

export default defineConfig({
  main: {
    // Why: electron-store 11 은 ESM 전용이라 CJS 로 묶이는 메인에서 require 할 수 없어 함께 묶는다.
    build: { externalizeDeps: { exclude: ['electron-store'] } },
    // 시험판 화면 찍기 코드(src/main/testShots.ts)는 출시 빌드(DRAW_RELEASE=1)에 들어가지 않는다.
    define: { DRAW_TEST_BUILD: JSON.stringify(process.env.DRAW_RELEASE !== '1') },
  },
  preload: {
    build: {
      rollupOptions: {
        input: Object.fromEntries(pages.map((page) => [page, resolve(__dirname, `src/preload/${page}.ts`)])),
      },
    },
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    plugins: [react()],
    build: {
      rollupOptions: {
        input: Object.fromEntries(pages.map((page) => [page, resolve(__dirname, `src/renderer/${page}/index.html`)])),
      },
    },
  },
});
