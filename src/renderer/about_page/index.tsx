import { createRoot } from 'react-dom/client'
import { RunnersAbout } from '../../runners-account/runners-about'
import { currentLocale, t } from '../../shared/i18n'
import { applyTextDirection } from '../i18n'

applyTextDirection()

// THIRD_PARTY_NOTICES.md 는 누를 때만 읽어 정보 창을 여는 시간을 늘리지 않는다.
const loadNotices = () => import('../../../THIRD_PARTY_NOTICES.md?raw').then((file) => file.default)

const { closeWindow, fitHeight, getVersion, openExternal } = window.electronAPI

createRoot(document.getElementById('root')!).render(
  <RunnersAbout
    appId="draw"
    appName="Draw"
    appIcon="../assets/icon.png"
    website="https://runners.im/draw"
    github="https://github.com/RUNNERS-IM/draw"
    locale={currentLocale()}
    t={t}
    version={getVersion}
    openExternal={openExternal}
    closeWindow={closeWindow}
    fitHeight={fitHeight}
    loadNotices={loadNotices}
  />
)
