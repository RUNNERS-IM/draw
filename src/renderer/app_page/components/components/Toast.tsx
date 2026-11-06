import type { Callback } from '../types'
import './Toast.scss'

const Toast = ({
  info,
  handleToastClicked,
  handleToastHidden
}: {
  info: any
  handleToastClicked: Callback
  handleToastHidden: Callback
}) => {
  const handleAnimationEnd = (event: any) => {
    if (event.animationName !== 'toastHide') {
      return
    }

    handleToastHidden()
  }

  return (
    <div id="toast-block" key={`${info.title}-${info.body}`} onAnimationEnd={handleAnimationEnd}>
      <img src="../assets/icon.png" alt="Draw" className="toast-icon" />

      <div className="toast-main">
        <div className="toast-main-title">{info.title}</div>
        <div className="toast-main-description">{info.body}</div>
      </div>

      {info.button_label && (
        <div className="toast-action">
          <div className="toast-action-button" onClick={handleToastClicked}>
            {info.button_label}
          </div>
        </div>
      )}
    </div>
  )
}

export default Toast
