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
import signInPanda from '../../../runners-account/assets/panda/signin.webp'

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
    <>
      <section className="settings-group">
        <h2 className="settings-group-title">{t('settings.tabAccount')}</h2>
        {email ? (
          <div className="settings-section">
            <div className="settings-item">
              <div className="settings-item-info">
                <div className="settings-item-title">{email}</div>
                <div className="settings-item-description">{accountText(lang, 'title')}</div>
              </div>

              <div className="settings-item-control">
                <AccountButton lang={lang} account={email} onSignOut={() => void api.signOut()} />
              </div>
            </div>
          </div>
        ) : (
          // 로그인 전은 가이드의 빈 화면 꼴(판다 그림 → 한 줄 → 채운 단추 하나, design.runners.im 06-2).
          // 그림은 밝은 얼굴의 signin 판다(2026-11-16 판다 자리 표, runners-wiki 803d86d).
          <div className="settings-section account-empty">
            <img className="account-empty-panda" src={signInPanda} alt="" draggable={false} />
            <div className="account-empty-title">{accountText(lang, 'title')}</div>
            <div className="account-empty-description">{t('settings.accountOptional')}</div>
            <button className="rw-button default" onClick={() => setSigningIn(true)}>
              {accountText(lang, 'signIn')}
            </button>
          </div>
        )}
      </section>

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
    </>
  )
}

export default AccountTab
