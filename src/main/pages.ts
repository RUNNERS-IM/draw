// 창이 여는 화면 주소와 preload 파일 자리. electron-vite 가 out/renderer/<쪽>/ · out/preload/<쪽>.js 로 묶는다.
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

export type PageName =
  | 'app_page'
  | 'extended_toolbar_page'
  | 'about_page'
  | 'settings_page'
  | 'panel_page'
  | 'update_page'

export function pageUrl(page: PageName): string {
  const devServer = process.env.ELECTRON_RENDERER_URL
  if (devServer) {
    return `${devServer}/${page}/index.html`
  }
  return pathToFileURL(join(__dirname, `../renderer/${page}/index.html`)).href
}

export function preloadPath(page: PageName): string {
  return join(__dirname, `../preload/${page}.js`)
}
