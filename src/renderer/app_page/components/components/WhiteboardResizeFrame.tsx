import type { Callback } from '../types'
import './WhiteboardResizeFrame.scss'
import { useTranslation } from 'react-i18next'

// 안내 글은 가운데 작은 단추 위에 두 줄까지만 놓는다. 마지막 띄어쓰기에서만 나눠 「두 번 / 클릭」처럼 된다.
const splitHint = (text: string) => {
  const at = text.lastIndexOf(' ')
  return at > 0 ? [text.slice(0, at), text.slice(at + 1)] : [text]
}

const RESIZE_HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']
const CENTER_SNAP_HANDLE = 'center'

const WhiteboardResizeFrame = ({
  onStartMove,
  onStartResize,
  onSnapResize,
  onApply
}: {
  onStartMove: Callback
  onStartResize: Callback
  onSnapResize: Callback
  onApply: Callback
}) => {
  const { t } = useTranslation()

  return (
    <div className="whiteboard-resize-frame" onPointerDown={onStartMove} onDoubleClick={onApply}>
      <div className="whiteboard-resize-frame__hint">
        {splitHint(t('whiteboard.resizeHint')).map((line, index) => (
          <span key={index}>{line}</span>
        ))}
      </div>

      <svg className="whiteboard-resize-frame__border">
        <rect x="0" y="0" width="100%" height="100%" rx="20" ry="20" />
      </svg>

      {RESIZE_HANDLES.map((handle) => (
        <div
          key={handle}
          className={`whiteboard-resize-frame__handle whiteboard-resize-frame__handle--${handle}`}
          onPointerDown={(event) => onStartResize(event, handle)}
        />
      ))}

      {[CENTER_SNAP_HANDLE, ...RESIZE_HANDLES].map((handle) => (
        <div
          key={handle}
          className={`whiteboard-resize-frame__snap whiteboard-resize-frame__snap--${handle}`}
          onPointerDown={(event) => onSnapResize(event, handle)}
          onDoubleClick={(event) => event.stopPropagation()}
        >
          <div className="whiteboard-resize-frame__snap-preview">
            <div className="whiteboard-resize-frame__snap-preview-fill" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default WhiteboardResizeFrame
