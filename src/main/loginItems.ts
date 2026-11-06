// 이 실행이 맥의 로그인 항목을 읽거나 써도 되는지 정한다.
// Why: Electron 은 지금 실행 중인 앱의 경로를 로그인 항목에 적는다. 개발 실행은 저장소 안의 Electron.app,
// 시험판은 지워질 .noindex 폴더의 앱이라, 적히면 사용자의 로그인 목록에 엉뚱한 경로가 남는다.
export function loginItemsAllowed(run: {
  isLinux: boolean
  isPackaged: boolean
  isTestBuild: boolean
}) {
  return !run.isLinux && run.isPackaged && !run.isTestBuild
}
