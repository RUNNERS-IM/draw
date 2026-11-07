// 설정 › 계정 칸(2026-11-07 결정 2A): RUNNERS 계정 로그인은 하고 싶을 때만 한다. 로그인하지 않아도 그리기는 그대로다.
// 로그인 창과 로그인 뒤 동그라미 · 메뉴는 kit 부품을 그대로 써서 다른 RUNNERS 앱과 같은 모양이다.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AccountButton,
  SignInSheet,
  accountText,
  type CodePurpose,
  type SignMode
} from '../../../runners-account/runners-account'

const api = window.electronAPI

const AccountTab = () => {
  const { t } = useTranslation()
  const lang = api.locale
  const [email, setEmail] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => {
    void api.accountEmail().then(setEmail)
    return api.onAccountChanged(setEmail)
  }, [])

  return (
    <div className="settings-container">
      <div className="settings-header">
        <div className="settings-title">{t('settings.tabAccount')}</div>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <div className="settings-item">
            <div className="settings-item-info">
              <div className="settings-item-title">{email ?? accountText(lang, 'title')}</div>
              <div className="settings-item-description">
                {email ? accountText(lang, 'title') : t('settings.accountOptional')}
              </div>
            </div>

            <div className="settings-item-control">
              {email ? (
                <AccountButton lang={lang} account={email} onSignOut={() => void api.signOut()} />
              ) : (
                <button className="button" onClick={() => setSigningIn(true)}>
                  {accountText(lang, 'signIn')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {signingIn && !email && (
        <SignInSheet
          lang={lang}
          signIn={(mode: SignMode, address, password, code) =>
            api.signIn(mode, address, password, code)
          }
          sendCode={(purpose: CodePurpose, address) => api.sendCode(purpose, address)}
          resetPassword={(address, code, password) => api.resetPassword(address, code, password)}
          onClose={() => setSigningIn(false)}
        />
      )}
    </div>
  )
}

export default AccountTab
