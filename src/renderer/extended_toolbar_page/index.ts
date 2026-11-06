export {}

console.log('[DRAW]: Extended toolbar page loading...')

const toolbar = document.getElementById('toolbar')!

toolbar.querySelector<HTMLElement>('.toolbar__main-button button')!.title =
  window.electronAPI.locale?.toLowerCase().startsWith('ko')
    ? '그리기 모드로 바꾸기'
    : 'Switch to Draw Mode'
const closeAppButton = toolbar!.querySelector('.toolbar__close')
const switchToDrawButtons = toolbar!.querySelectorAll(
  '.toolbar__main-button button, .toolbar__slider'
)

closeAppButton!.addEventListener('click', () => {
  window.electronAPI.invokeCloseApp()
})

switchToDrawButtons.forEach((button: any) => {
  button.addEventListener('click', () => {
    window.electronAPI.invokeDrawMode()
  })
})

const setDirection = (isReversed: boolean) =>
  toolbar!.classList.toggle('toolbar--reversed', isReversed)
window.electronAPI.onToolbarDirection(setDirection)

window.electronAPI.getConfiguration().then((config) => {
  toolbar!.classList.add(`toolbar--${config.tool_bar_orientation}`)
  setDirection(config.isReversed)
})
