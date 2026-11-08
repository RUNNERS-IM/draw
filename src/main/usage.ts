// 사용 통계: 동의한 사람의 기능 사용 횟수만 kit 의 createUsageStats 로 모아 보낸다. 동의 전에는 세지도 보내지도 않는다.
// 묻는 창은 설정 창 위에 뜬다. 맨 처음 켤 때는 바로 그리게 두고, 다음에 켤 때나 설정을 처음 열 때 묻는다.
import { app, ipcMain } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { freshToken } from './account'
import { createUsageStats, type UsageStats } from './runners/usage-stats'

const FLUSH_EVERY_MS = 6 * 60 * 60 * 1000

// 시험판은 진짜 서버로 보내지 않는다. DRAW_API_URL 로 이 컴퓨터 안의 시험 서버를 줬을 때만 그곳으로 보낸다.
const testEndpoint = process.env.DRAW_API_URL
  ? `${process.env.DRAW_API_URL}/api/mobile/usage`
  : null

const filePath = () => path.join(app.getPath('userData'), 'usage-stats.json')

const create = () =>
  createUsageStats({
    version: app.getVersion(),
    filePath: filePath(),
    token: freshToken,
    userAgent: `Draw/${app.getVersion()}`,
    ...(DRAW_TEST_BUILD ? { endpoint: testEndpoint } : {})
  })

let usage: UsageStats

export function startUsage() {
  usage = create()

  ipcMain.handle('usage_consent', () => usage.consent())
  ipcMain.handle('set_usage_consent', (_event, granted) => {
    usage.setConsent(granted === true)
  })

  void usage.flush()
  setInterval(() => void usage.flush(), FLUSH_EVERY_MS).unref()
}

export const shouldAskUsage = () => usage.shouldAsk()
export const countUsage = (feature: string) => usage.count(feature)
export const saveUsage = () => usage.save()

/** 시험 모드가 지금 상태를 읽는다. */
export const usageForTest = () => usage

/** 시험 모드가 저장 파일을 비우거나 채운 뒤 처음 켠 것처럼 다시 읽는다. */
export function restartUsageForTest(saved?: unknown) {
  fs.rmSync(filePath(), { force: true })
  if (saved) {
    fs.writeFileSync(filePath(), JSON.stringify(saved))
  }
  usage = create()
}
