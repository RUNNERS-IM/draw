import { resolve } from 'node:path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { version } from './package.json'

const pages = ['app_page', 'extended_toolbar_page', 'settings_page', 'panel_page', 'update_page']

// 시험판 화면 찍기 코드(src/main/testShots.ts)와 그 연결 자리는 출시 빌드(DRAW_RELEASE=1)에 들어가지 않는다.
// DRAW_VERSION 은 화면 쪽 오류 수집이 판 이름에 쓴다. 출시 작업이 판 번호를 올린 뒤 빌드하므로 package.json 판이 맞다.
const define = {
  DRAW_TEST_BUILD: JSON.stringify(process.env.DRAW_RELEASE !== '1'),
  DRAW_VERSION: JSON.stringify(version)
}

export default defineConfig({
  main: {
    // Why: electron-store 11 은 ESM 전용이라 CJS 로 묶이는 메인에서 require 할 수 없어 함께 묶는다.
    build: { externalizeDeps: { exclude: ['electron-store'] } },
    define
  },
  preload: {
    define,
    build: {
      rollupOptions: {
        input: Object.fromEntries(
          pages.map((page) => [page, resolve(__dirname, `src/preload/${page}.ts`)])
        )
      }
    }
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    plugins: [react()],
    define,
    build: {
      rollupOptions: {
        input: Object.fromEntries(
          pages.map((page) => [page, resolve(__dirname, `src/renderer/${page}/index.html`)])
        )
      }
    }
  }
})
