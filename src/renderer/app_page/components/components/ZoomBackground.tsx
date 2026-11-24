import type { Callback } from '../types'
import './ZoomBackground.scss'

import { zoomLevels } from '../constants'
import { useTranslation } from 'react-i18next'

const ZoomBackground = ({
  imageDataUrl,
  currentFocusPoint,
  currentZoomIndex,
  onStartExitZoom
}: {
  imageDataUrl: string
  currentFocusPoint: { x: number; y: number }
  currentZoomIndex: number
  onStartExitZoom: Callback
}) => {
  const { t } = useTranslation()
  const zoom = zoomLevels[currentZoomIndex]

  const handleHintClick = (event: any) => {
    event.stopPropagation()

    onStartExitZoom()
  }

  return (
    <div id="zoom_background">
      <img
        className="zoom_background__image"
        src={imageDataUrl}
        style={{
          '--background-zoom': zoom,
          '--cursor-x': `${currentFocusPoint.x}px`,
          '--cursor-y': `${currentFocusPoint.y}px`
        }}
      />

      <div className="zoom_background__hint" title={t('zoom.frozenHint')} onClick={handleHintClick}>
        <div className="zoom_background__hint-main">
          <div className="zoom_background__hint-title">{t('zoom.frozen')}</div>
        </div>
      </div>
    </div>
  )
}

export default ZoomBackground
