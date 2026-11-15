// electron.vite.config.ts 의 define 이 메인 · preload · 화면 코드에 채우는 값. 출시 빌드(DRAW_RELEASE=1)에서는 false 다.
declare const DRAW_TEST_BUILD: boolean
// package.json 의 판 번호.
declare const DRAW_VERSION: string

// 오류 자동 수집(Sentry)이 보낼 곳. 출시 빌드만 GitHub 비밀값으로 채우고, 비어 있으면 아무것도 보내지 않는다.
interface ImportMetaEnv {
  readonly MAIN_VITE_SENTRY_DSN?: string
  readonly VITE_SENTRY_DSN?: string
}
