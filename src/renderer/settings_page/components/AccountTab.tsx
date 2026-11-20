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

// kit NICKNAME_MAX 와 같은 값. 넘으면 서버에 보내기 전에 칸 아래에 알린다.
const NICKNAME_MAX = 30

type Profile = { email: string | null; nickname: string | null; custom: boolean }

// 별명 줄(2026-11-19 결정 2B): 모든 RUNNERS 앱이 같이 쓰는 이름이고 계정 서버에 둔다. 비우고 저장하면 이메일 @ 앞부분으로 돌아간다.
// 칸과 단추 모양 · 문구는 Remotrol 설정 › 계정 칸과 같다.
const Nickname = ({ profile }: { profile: Profile }) => {
  const { t } = useTranslation()
  const shown = profile.custom ? (profile.nickname ?? '') : ''
  const [draft, setDraft] = useState(shown)
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'long' | 'failed'>('idle')

  // Why: 탭을 연 뒤 서버에서 받은 별명이 칸을 채운다. 다만 고치는 중이면 덮지 않는다.
  useEffect(() => {
    if (state === 'idle' || state === 'saved') {
      setDraft(shown)
    }
  }, [shown]) // eslint-disable-line react-hooks/exhaustive-deps

  const changed = draft.trim() !== shown
  const save = () => {
    if (draft.trim().length > NICKNAME_MAX) {
      setState('long')
      return
    }
    setState('saving')
    api.setNickname(draft).then(
      () => setState('saved'),
      (error: Error) => setState(error.message === 'format' ? 'long' : 'failed')
    )
  }
  const note =
    state === 'long' ? t('account.nicknameLong') : state === 'failed' ? t('account.network') : null

  return (
    <div className="settings-item">
      <div className="settings-item-info">
        <div className="settings-item-title">{t('account.nickname')}</div>
        <div className={note ? 'settings-item-description ra-error' : 'settings-item-description'}>
          {note ?? t('account.nicknameHint')}
        </div>
      </div>

      <div className="settings-item-control">
        <input
          className="ra-field account-nickname"
          value={draft}
          maxLength={NICKNAME_MAX + 10}
          placeholder={profile.email?.split('@')[0] ?? ''}
          aria-label={t('account.nickname')}
          onChange={(event) => {
            setDraft(event.target.value)
            setState('idle')
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && changed) {
              save()
            }
          }}
        />
        <button
          type="button"
          className="rw-button"
          disabled={!changed || state === 'saving'}
          onClick={save}
        >
          {t(state === 'saved' && !changed ? 'account.saved' : 'account.save')}
        </button>
      </div>
    </div>
  )
}

const AccountTab = () => {
  const { t } = useTranslation()
  const lang = api.locale
  const [profile, setProfile] = useState<Profile>({ email: null, nickname: null, custom: false })
  const [signingIn, setSigningIn] = useState(false)
  const email = profile.email

  useEffect(() => {
    const load = () => void api.accountProfile().then(setProfile)
    load()
    // 로그인 · 로그아웃과 별명이 바뀔 때 모두 account_changed 가 온다.
    return api.onAccountChanged(load)
  }, [])

  return (
    <>
      <section className="settings-group">
        <h2 className="settings-group-title">{t('settings.tabAccount')}</h2>
        {email ? (
          <div className="settings-section">
            <div className="settings-item">
              <div className="settings-item-info">
                <div className="settings-item-title">{profile.nickname ?? email}</div>
                <div className="settings-item-description">{email}</div>
              </div>

              <div className="settings-item-control">
                <AccountButton
                  lang={lang}
                  account={email}
                  nickname={profile.nickname}
                  onSignOut={() => void api.signOut()}
                />
              </div>
            </div>
            <Nickname profile={profile} />
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
