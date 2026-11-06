// https 주소만 연다. 목록에 오타나 로컬 경로가 들어가도 다른 것을 실행하지 않게, 그 밖의 값은 빈 문자열로 돌려준다.
export function safeUrl(url: string | null | undefined) {
  const trimmed = String(url ?? '').trim()
  try {
    return new URL(trimmed).protocol === 'https:' ? trimmed : ''
  } catch {
    return ''
  }
}
