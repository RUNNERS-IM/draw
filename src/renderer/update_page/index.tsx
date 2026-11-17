import '../errorReport'
import { createRoot } from 'react-dom/client'
import { RunnersUpdate } from '../../runners-account/runners-update'
import { t } from '../../shared/i18n'
import { APP_ICON, APP_ICON_DARK } from '../appIcon'
import { applyTextDirection } from '../i18n'

applyTextDirection()

const { answerUpdate, fitHeight, onUpdateOffer, updateOffer } = window.electronAPI

const Update = () => (
  <RunnersUpdate
    appIcon={APP_ICON}
    appIconDark={APP_ICON_DARK}
    t={t}
    offer={updateOffer}
    onOffer={onUpdateOffer}
    answer={answerUpdate}
    fitHeight={fitHeight}
  />
)

createRoot(document.getElementById('root')!).render(<Update />)
