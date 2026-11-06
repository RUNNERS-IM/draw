import { createRoot } from 'react-dom/client'
import Settings from './components/Settings'
import { applyTextDirection } from '../i18n'

applyTextDirection()

console.log('[DRAW]: Settings page loading...')

const root = createRoot(document.getElementById('root')!)

window.electronAPI.getConfiguration().then((config) => {
  console.log('[DRAW]: Settings page config: ', config)

  root.render(<Settings {...config} />)
})
