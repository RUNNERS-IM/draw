// 설정 › 정보 탭(2026-11-08 창 통일): 따로 뜨던 정보 창 대신 kit 의 RunnersAbout 을 탭 안에 그대로 넣는다.
import { RunnersAbout } from '../../../runners-account/runners-about'
import { currentLocale, t } from '../../../shared/i18n'
import { APP_ICON, APP_ICON_DARK } from '../../appIcon'

// THIRD_PARTY_NOTICES.md 는 누를 때만 읽어 설정 창을 여는 시간을 늘리지 않는다.
const loadNotices = () =>
  import('../../../../THIRD_PARTY_NOTICES.md?raw').then((file) => file.default)

const { getVersion, openExternal } = window.electronAPI

const AboutTab = () => (
  <RunnersAbout
    appId="draw"
    appName="Draw"
    appIcon={APP_ICON}
    appIconDark={APP_ICON_DARK}
    website="https://runners.im/draw"
    github="https://github.com/RUNNERS-IM/draw"
    locale={currentLocale()}
    t={t}
    version={getVersion}
    openExternal={openExternal}
    loadNotices={loadNotices}
    embedded
  />
)

export default AboutTab
