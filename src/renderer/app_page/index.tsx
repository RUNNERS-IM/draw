import { createRoot } from 'react-dom/client'
import Application from './components/Application'

console.log('[DRAW]: Main page loading...')

const root = createRoot(document.getElementById('root')!)

window.electronAPI.invokeGetSettings().then((settings) => {
  console.log('[DRAW]: Main page settings: ', settings)

  root.render(<Application {...settings} />)
})
