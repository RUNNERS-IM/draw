// 오류 자동 수집(Sentry). index.ts 가 맨 먼저 불러, 다른 코드가 돌기 전에 켠다.
// DSN 은 출시 빌드에만 들어간다(MAIN_VITE_SENTRY_DSN). 비어 있으면 아무것도 보내지 않는다.
// 보낼 값 · 가릴 값은 runners-app-kit 의 error-report.ts 가 정한다.
import * as Sentry from '@sentry/electron/main'
import { app } from 'electron'
import { hostname, userInfo } from 'node:os'
import { startErrorReport } from './runners/error-report'

function userName() {
  try {
    return userInfo().username
  } catch {
    return ''
  }
}

const started = startErrorReport(Sentry, {
  dsn: import.meta.env.MAIN_VITE_SENTRY_DSN,
  release: `draw@${app.getVersion()}`,
  environment: app.isPackaged ? 'production' : 'development',
  hide: [hostname(), userName()]
})

/** 앱을 끄기 전에 쌓인 오류를 보낸다. 수집이 꺼져 있으면 바로 끝난다. */
export async function flushErrorReport() {
  if (started) {
    await Sentry.flush(2000)
  }
}
