// 화면 쪽 오류 자동 수집(Sentry). 창마다 입구 파일 맨 위에서 불러온다.
// 보낸 오류는 메인 쪽 Sentry 를 거쳐 나가므로, 메인에서 수집이 꺼져 있으면 여기서도 아무것도 나가지 않는다.
import * as Sentry from '@sentry/electron/renderer'
import { startErrorReport } from '../runners-account/error-report'

startErrorReport(Sentry, { dsn: import.meta.env.VITE_SENTRY_DSN, release: `draw@${DRAW_VERSION}` })
