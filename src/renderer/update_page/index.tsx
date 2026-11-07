import { createRoot } from 'react-dom/client'
import { RunnersUpdate } from '../../runners-account/runners-update'
import { t } from '../../shared/i18n'
import { applyTextDirection } from '../i18n'

applyTextDirection()

const { answerUpdate, fitHeight, onUpdateOffer, updateOffer } = window.electronAPI

createRoot(document.getElementById('root')!).render(
  <RunnersUpdate
    appIcon="../assets/icon.png"
    t={t}
    offer={updateOffer}
    onOffer={onUpdateOffer}
    answer={answerUpdate}
    fitHeight={fitHeight}
  />
)
