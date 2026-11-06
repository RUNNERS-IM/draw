// 화면 글 번역. 메인 프로세스와 창이 같은 locales/<언어>.json 을 쓴다.
// 메인은 setLocale 로, 창은 preload 가 넘긴 window.electronAPI.locale 로 언어를 정한다.
import i18next from 'i18next'

const files = import.meta.glob<Record<string, string>>('../../locales/*.json', {
  eager: true,
  import: 'default'
})
const resources = Object.fromEntries(
  Object.entries(files).map(([path, translation]) => [
    path.replace(/^.*\/(.+)\.json$/, '$1'),
    { translation }
  ])
)
const codes = Object.keys(resources)

/** `de-AT` · `zh-Hant-TW` 같은 말을 정확히 같은 코드 → 언어 부분 순서로 찾는다. 없으면 null. */
function matchLocale(tag: string) {
  const normalized = tag.replace(/_/g, '-')
  const exact = codes.find((code) => code.toLowerCase() === normalized.toLowerCase())
  if (exact) {
    return exact
  }
  const language = normalized.split('-')[0].toLowerCase()
  if (language === 'zh') {
    // Why: 대만 · 홍콩 · 마카오는 번체를 쓰고, 나머지 중국어는 간체로 읽는다.
    return /-(hant|tw|hk|mo)\b/i.test(normalized) ? 'zh-Hant' : 'zh-Hans'
  }
  return codes.includes(language) ? language : null
}

/** 사람의 언어 목록에서 표가 있는 첫 언어를 고른다. 없으면 영어. */
export function pickLocale(tags: readonly string[]) {
  for (const tag of tags) {
    const code = matchLocale(tag)
    if (code) {
      return code
    }
  }
  return 'en'
}

function startingLocale() {
  if (typeof window === 'undefined') {
    return 'en'
  }
  const fromMain = window.electronAPI?.locale
  return pickLocale(fromMain ? [fromMain] : navigator.languages)
}

i18next.init({
  resources,
  lng: startingLocale(),
  fallbackLng: 'en',
  // Why: 열쇠가 'tool.brush' 처럼 점이 든 납작한 이름이고, 메시지 안에 쌍점이 들어가도 나뉘면 안 된다.
  keySeparator: false,
  nsSeparator: false,
  // Why: 표를 함께 묶어 두어 기다릴 일이 없다. 창이 그려지기 전에 글이 준비되어 있어야 한다.
  initAsync: false,
  // Why: 글은 React 가 이스케이프하고, 메인은 HTML 로 내보내지 않는다.
  interpolation: { escapeValue: false }
})

export function setLocale(tags: readonly string[]) {
  i18next.changeLanguage(pickLocale(tags))
}

export function currentLocale() {
  return i18next.language
}

export function t(key: string, vars?: Record<string, string | number>) {
  return i18next.t(key, vars ?? {})
}

export default i18next
