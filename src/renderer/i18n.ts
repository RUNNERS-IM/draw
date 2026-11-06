// 창마다 처음에 불러 react-i18next 를 공용 번역에 잇는다.
import { setI18n } from 'react-i18next'
import i18next, { currentLocale } from '../shared/i18n'

setI18n(i18next)
document.documentElement.lang = currentLocale()

/** 글을 읽는 창에 아랍어 방향을 맞춘다. 그림판은 화면 좌표를 그대로 쓰므로 부르지 않는다. */
export function applyTextDirection() {
  document.documentElement.dir = currentLocale() === 'ar' ? 'rtl' : 'ltr'
}
