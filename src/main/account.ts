// RUNNERS 계정(2026-11-07 결정 2A): 하고 싶을 때만 설정 › 계정 칸에서 로그인한다. 로그인하지 않아도 그리기는 그대로다.
// 지금은 로그인해도 새로 생기는 기능이 없고, 나중에 Pro(스포트라이트 · 확대 · 저장 · 공유)를 풀 때 이 계정을 쓴다.
// 토큰 보관과 서버 부르기는 kit 의 createAccount 를 그대로 쓴다. 다른 RUNNERS 앱과 같은 계정 · 같은 비밀번호다.
import { app, BrowserWindow, ipcMain, safeStorage } from 'electron'
import path from 'node:path'
import { currentLocale } from '../shared/i18n'
import { createAccount, type Account } from './runners/account'

// 시험판에서만 DRAW_API_URL 로 이 컴퓨터 안의 시험 서버를 가리킬 수 있다. 출시판은 언제나 진짜 서버다.
const testServer = DRAW_TEST_BUILD ? process.env.DRAW_API_URL : undefined
const API_URL = testServer || 'https://server.system.runners.im'

let account: Account

/** 실패를 공통 로그인 창이 읽는 코드(SignInProblem)로 돌려준다. 성공이면 null.
 *  Why: ipcMain.handle 에서 던진 오류는 창에 「Error invoking remote method …」 로 감싸져 가서 코드를 읽을 수 없다. */
async function attempt(work: () => Promise<unknown>) {
  try {
    await work()
    return null
  } catch (error) {
    return error instanceof Error ? error.message : 'network'
  }
}

export function startAccount() {
  account = createAccount({
    project: 'DRAW',
    filePath: path.join(app.getPath('userData'), 'account.bin'),
    apiUrl: API_URL,
    safeStorage,
    isPackaged: app.isPackaged,
    userAgent: `Draw/${app.getVersion()}`
  })
  account.onChange(() => {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send('account_changed', account.current())
    }
  })

  ipcMain.handle('account_email', () => account.current())
  ipcMain.handle('account_sign_in', (_event, mode, email, password, code) =>
    attempt(() =>
      account.signIn(
        mode === 'signup' ? 'signup' : 'login',
        String(email),
        String(password),
        typeof code === 'string' ? code : undefined
      )
    )
  )
  ipcMain.handle('account_send_code', (_event, purpose, email) =>
    attempt(() =>
      account.sendCode(purpose === 'reset' ? 'reset' : 'signup', String(email), currentLocale())
    )
  )
  ipcMain.handle('account_reset_password', (_event, email, code, password) =>
    attempt(() => account.resetPassword(String(email), String(code), String(password)))
  )
  ipcMain.handle('account_sign_out', () => account.signOut())
}

/** 사용 통계를 보낼 때 쓰는 토큰. 로그아웃 상태면 null, 서버에 닿지 못하면 지금 토큰을 그대로 준다. */
export async function freshToken() {
  const result = await account.refresh()
  return result.ok ? result.token : account.accessToken()
}

/** 시험 모드가 로그인 · 로그아웃을 부른다(시험 서버로만). */
export const accountForTest = () => account
