// 시험판 전용(DRAW_TEST_BUILD): 키보드 · 마우스를 흉내 내지 않고, 앱의 처리 함수를 불러 상태를 띄워 창마다 그림을 저장한다.
// 쓰는 법: DRAW_TEST_SHOTS=<폴더> [DRAW_TEST_LANG=<언어 코드>] Draw --use-mock-keychain 실행. 끝나면 스스로 꺼지고 그 폴더에 result.txt 를 남긴다.
// --use-mock-keychain: 서명 없는 시험판이 진짜 키체인에 항목을 만들거나 묻는 창을 띄우지 않게 한다.
// DRAW_TEST_ACCOUNT=signin|check 를 주면 그림은 찍지 않고 로그인 또는 로그인 유지만 보고 끝난다.
// DRAW_TEST_MIN_HEIGHT=1 을 주면 설정 창을 보이지 않게(투명) 띄워 가장 작은 높이의 탭마다 찍고 끝난다.
// DRAW_TEST_BORDER=1 을 주면 밝은 · 어두운 · 연두 바탕 위의 그리기 테두리와 선택 표시만 찍고 끝난다.
// DRAW_TEST_ICON=1 을 주면 창을 보이지 않게(투명) 띄워 앱 아이콘이 나오는 자리(정보 탭 · 묻는 창 · 업데이트 창 · 알림)만 찍고 끝난다.
// DRAW_TEST_HIDDEN=1 을 함께 주면 모든 창을 투명하게 두어 화면을 가리지 않고 찍는다. 앱 메뉴 글자도 result.txt 에 남긴다.
// DRAW_TEST_TABS=1 을 주면 설정 창을 보이지 않게(투명) 띄워 탭 4개를 위 · 아래로 찍고, 잘린 글 · 겹친 줄 · 글 방향을 result.txt 에 남긴다.
import { BrowserWindow, Menu, app as electronApp, nativeTheme, screen } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { askUpdate } from './updates'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const figures = () => {
  const now = Date.now()
  const base = { rainbowColorDeg: 120 }
  const stroke = Array.from({ length: 40 }, (_, i) => [
    260 + i * 9,
    170 + Math.sin(i / 4) * 34,
    0.5
  ])
  return [
    { ...base, id: now, type: 'pen', colorIndex: 2, widthIndex: 2, points: stroke },
    {
      ...base,
      id: now + 1,
      type: 'highlighter',
      colorIndex: 4,
      widthIndex: 2,
      points: [
        [260, 280],
        [660, 280]
      ]
    },
    {
      ...base,
      id: now + 2,
      type: 'arrow',
      colorIndex: 2,
      widthIndex: 2,
      points: [
        [260, 360],
        [560, 430]
      ]
    },
    {
      ...base,
      id: now + 3,
      type: 'rectangle',
      colorIndex: 1,
      widthIndex: 2,
      points: [
        [720, 150],
        [1040, 320]
      ],
      ratio: 1,
      strokeIndex: 0
    },
    {
      ...base,
      id: now + 4,
      type: 'oval',
      colorIndex: 3,
      widthIndex: 2,
      points: [
        [720, 380],
        [1040, 560]
      ],
      ratio: 1
    },
    {
      ...base,
      id: now + 5,
      type: 'text',
      colorIndex: 2,
      widthIndex: 2,
      points: [[260, 500]],
      text: '여기를 보세요',
      width: 400,
      height: 60,
      scale: 1
    }
  ]
}

export async function runTestShots(app: any) {
  const log: string[] = []
  const note = (line: string) => log.push(line)
  fs.mkdirSync(app.dir, { recursive: true })

  // 설정 › 계정 칸. 서버 없이 되는 것(로그인 창 · 비밀번호 모양 검사)은 언제나 보고,
  // DRAW_API_URL 로 이 컴퓨터 안의 시험 서버를 줬을 때만 틀린 비밀번호 · 로그인 · 로그아웃까지 창으로 해 본다.
  const accountScenes = async (settingsWindow: Electron.BrowserWindow, theme: string) => {
    const page = (code: string) => settingsWindow.webContents.executeJavaScript(code)
    const fill = (selector: string, value: string) =>
      page(`(() => {
        const field = document.querySelector(${JSON.stringify(selector)});
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(field, ${JSON.stringify(value)});
        field.dispatchEvent(new Event('input', { bubbles: true }));
      })()`)
    const problem = () =>
      page("document.querySelector('.ra-error')?.textContent ?? '(없음)'") as Promise<string>

    await page("document.querySelectorAll('.settings-toolbar-item')[2].click()")
    await wait(500)
    await shot(settingsWindow, `${theme}-8-설정-계정`)
    await page("document.querySelector('.settings-item-control .button').click()")
    await wait(500)
    await shot(settingsWindow, `${theme}-8-계정-로그인창`)

    // 계정 만들기에서 모양이 틀린 비밀번호는 메일을 보내기 전에 창이 막는다(서버에 가지 않음).
    await page("[...document.querySelectorAll('.ra-link')].at(-1).click()")
    await wait(300)
    await fill('.ra-field[type=email]', 'kim@example.com')
    await fill('.ra-field[type=password]', 'abc')
    await page("document.querySelector('.ra-submit').click()")
    await wait(400)
    note(`[${theme}] 계정 만들기 · 비밀번호 abc: 알림=${await problem()}`)
    await shot(settingsWindow, `${theme}-8-계정-비밀번호모양`)

    if (!process.env.DRAW_API_URL) {
      note(`[${theme}] 시험 서버 없음: 로그인 · 로그아웃은 건너뜀`)
      return
    }
    await page("[...document.querySelectorAll('.ra-link')].at(-1).click()")
    await wait(300)
    await fill('.ra-field[type=email]', 'kim@example.com')
    await fill('.ra-field[type=password]', 'wrong123')
    await page("document.querySelector('.ra-submit').click()")
    await wait(800)
    note(`[${theme}] 로그인 · 틀린 비밀번호: 알림=${await problem()}`)
    await shot(settingsWindow, `${theme}-8-계정-비밀번호틀림`)

    await fill('.ra-field[type=password]', 'draw1234')
    await page("document.querySelector('.ra-submit').click()")
    await wait(1000)
    note(
      `[${theme}] 로그인: 메인 계정=${app.account().current()}, 창 제목 줄=${await page("document.querySelector('.settings-item-title')?.textContent")}, 로그인 창 남음=${await page("Boolean(document.querySelector('.ra-sheet'))")}`
    )
    await shot(settingsWindow, `${theme}-8-계정-로그인됨`)
    await page("document.querySelector('.ra-badge').click()")
    await wait(400)
    await shot(settingsWindow, `${theme}-8-계정-메뉴`)
    note(
      `[${theme}] 계정 동그라미: 판다 그림 폭=${await page("[...document.querySelectorAll('.ra-badge img')].map((img) => img.naturalWidth).join('/')")}, 로그아웃 화살표=${await page("getComputedStyle(document.querySelector('.ra-out')).transform")}`
    )
    await page("[...document.querySelectorAll('.ra-menu-item')].at(-1).click()")
    await wait(800)
    note(
      `[${theme}] 로그아웃: 메인 계정=${app.account().current()}, 로그인 단추=${await page("Boolean(document.querySelector('.settings-item-control .button'))")}`
    )
  }

  // 설정 창 하나(2026-11-08 창 통일): 그리기 · 일반 · 계정 · 정보 탭, 메뉴 막대 아이콘 끄기 · 켜기, ⌘, 메뉴.
  const settingsScenes = async (theme: string) => {
    app.showSettingsWindow()
    await wait(1500)
    const { settingsWindow } = app.getWindows()
    const page = (code: string) => settingsWindow.webContents.executeJavaScript(code)
    const tab = async (index: number) => {
      await page(`document.querySelectorAll('.settings-toolbar-item')[${index}].click()`)
      await wait(500)
    }
    note(
      `[${theme}] 설정 창: 크기=${JSON.stringify(settingsWindow.getContentSize())}, 탭=${await page("[...document.querySelectorAll('.settings-toolbar-item')].map((b) => b.textContent).join(' · ')")}, 제목 줄=${await page("document.querySelector('.settings-titlebar')?.textContent ?? '(없음)'")}`
    )
    note(
      `[${theme}] 설정 탭 줄: ${await page(`(() => {
        const bar = document.querySelector('.settings-toolbar').getBoundingClientRect();
        const tabs = [...document.querySelectorAll('.settings-toolbar-item')].map((b) => b.getBoundingClientRect());
        return 'toolbar 폭=' + Math.round(bar.width)
          + ', 탭 폭=' + tabs.map((r) => Math.round(r.width)).join('/')
          + ', 왼쪽 여백=' + Math.round(tabs[0].left - bar.left)
          + ', 오른쪽 여백=' + Math.round(bar.right - tabs[tabs.length - 1].right);
      })()`)}`
    )
    note(
      `[${theme}] 설정 › 그리기 첫 줄: 설명 칸 높이=${await page("document.querySelector('.settings-item-description').offsetHeight")}, 설명 글자 넘침=${await page("[...document.querySelectorAll('.settings-item-info')].filter((el) => el.scrollWidth > el.clientWidth).length")}, 단축키 칸 방향=${await page("getComputedStyle(document.querySelector('.hotkey-pill')).direction")}, 글꼴 들어옴=${await page("document.fonts.check('13px Pretendard')")}, 단추 글꼴=${await page("getComputedStyle(document.querySelector('.settings-item-control .button, .settings-item-control select') ?? document.body).fontFamily.split(',')[0]")}`
    )
    await shot(settingsWindow, `${theme}-8-설정-그리기-위`)
    await page("document.querySelector('.settings-scroll').scrollTop = 99999")
    await wait(300)
    await shot(settingsWindow, `${theme}-8-설정-그리기-아래`)

    await tab(1)
    await shot(settingsWindow, `${theme}-8-설정-일반`)
    note(
      `[${theme}] 설정 › 일반: 묻는 창=${await page("Boolean(document.querySelector('.ra-usage-sheet'))")}, 줄=${await page("[...document.querySelectorAll('.settings-item-title')].map((el) => el.textContent).join(' | ')")}`
    )

    // 메뉴 막대 아이콘 끄기: 스위치를 누르면 묻는 창이 뜨고, 확인을 누르면 메인이 아이콘을 없앤다.
    const toggle =
      "document.querySelectorAll('.settings-section')[0].querySelectorAll('.settings-item')[2].querySelector('.toggle')"
    await page(`${toggle}.click()`)
    await wait(400)
    note(
      `[${theme}] 아이콘 끄기 누름: 묻는 창=${await page("document.querySelector('.alert-message')?.textContent ?? '(없음)'")}, 아이콘 보임=${app.isTrayShown()}`
    )
    await shot(settingsWindow, `${theme}-8-설정-일반-아이콘끄기확인`)
    await page("document.querySelector('.alert-buttons .rw-button.default').click()")
    await wait(600)
    note(
      `[${theme}] 아이콘 끄기 확인: 아이콘 보임=${app.isTrayShown()}, 스위치 켜짐=${await page(`${toggle}.classList.contains('active')`)}`
    )

    // 아이콘을 숨긴 채 Draw 를 다시 열면(두 번째 실행 · 맥 activate) 설정 › 일반이 열린다.
    await tab(0)
    app.openedAgain()
    await wait(800)
    note(
      `[${theme}] 아이콘 숨김 중 다시 열기: 설정 창 보임=${settingsWindow.isVisible()}, 탭=${await page("document.querySelector('.settings-toolbar-item.selected')?.textContent")}, 그리는 중=${app.isDrawing()}`
    )
    await page(`${toggle}.click()`)
    await wait(600)
    note(
      `[${theme}] 아이콘 다시 켜기: 아이콘 보임=${app.isTrayShown()}, 묻는 창=${await page("Boolean(document.querySelector('.alert'))")}`
    )

    await accountScenes(settingsWindow, theme)

    await tab(3)
    await wait(600)
    await shot(settingsWindow, `${theme}-8-설정-정보`)
    await page("document.querySelector('.about-notices-link').click()")
    await wait(600)
    await shot(settingsWindow, `${theme}-8-설정-정보-오픈소스고지`)
    await page("document.querySelector('.notices-close').click()")
    await wait(300)
    settingsWindow.close()
    await wait(400)

    // ⌘, : 맥은 앱 메뉴 단축키로 연다. 메뉴 줄의 단축키와 처리 함수를 불러 설정 창이 뜨는지 본다.
    const settingsItem = Menu.getApplicationMenu()
      ?.items.flatMap((item) => item.submenu?.items ?? [])
      .find((item) => item.accelerator === app.settingsAccelerator)
    note(
      `[${theme}] ⌘, 메뉴 줄: 글=${settingsItem?.label ?? '(없음)'}, 단축키=${settingsItem?.accelerator ?? '(없음)'}`
    )
    settingsItem?.click()
    await wait(1500)
    const reopened = app.getWindows().settingsWindow
    note(
      `[${theme}] ⌘, 처리 함수: 설정 창 열림=${Boolean(reopened?.isVisible())}, 탭=${reopened ? await reopened.webContents.executeJavaScript("document.querySelector('.settings-toolbar-item.selected')?.textContent") : '(없음)'}`
    )
    reopened?.close()
    await wait(400)
  }

  const shot = async (window: Electron.BrowserWindow, name: string) => {
    note(
      `  [${name}] 숨김=${electronApp.isHidden()} 보임=${window.isVisible()} 자리=${JSON.stringify(window.getBounds())} 맨앞=${window.isFocused()}`
    )
    const image = await window.webContents.capturePage()
    fs.writeFileSync(path.join(app.dir, `${name}.png`), image.toPNG())
    fs.writeFileSync(path.join(app.dir, 'step.txt'), name)
  }

  try {
    // 화면 코드 오류를 result.txt 에 남긴다. 그렇지 않으면 창이 비어 있는 까닭을 알 수 없다.
    const watch = (window: Electron.BrowserWindow) => {
      window.webContents.on('console-message', (details) => {
        if (details.level === 'error') {
          note(`  [화면 오류] ${details.message} (${details.sourceId}:${details.lineNumber})`)
        }
      })
    }
    ;(Object.values(app.getWindows()) as Electron.BrowserWindow[]).forEach(
      (window) => window && watch(window)
    )
    electronApp.on('browser-window-created', (_event, window) => watch(window))
    if (process.env.DRAW_TEST_HIDDEN) {
      // 창을 보이고 숨길 때 앱이 투명도를 1 로 되돌리므로, 시험 동안은 늘 0 이 되게 막는다.
      const hide = (window: Electron.BrowserWindow) => {
        const setOpacity = window.setOpacity.bind(window)
        window.setOpacity = () => setOpacity(0)
        setOpacity(0)
      }
      BrowserWindow.getAllWindows().forEach(hide)
      electronApp.on('browser-window-created', (_event, window) => hide(window))
      const labels = (items: Electron.MenuItem[], depth = 0): string[] =>
        items.flatMap((item) => [
          `${'  '.repeat(depth)}${item.type === 'separator' ? '—' : `${item.label}${item.accelerator ? ` (${item.accelerator})` : ''}`}`,
          ...labels(item.submenu?.items ?? [], depth + 1)
        ])
      note(`앱 메뉴:\n${labels(Menu.getApplicationMenu()?.items ?? []).join('\n')}`)
    }
    if (process.env.DRAW_TEST_MIN_HEIGHT) {
      electronApp.on('browser-window-created', (_event, window) => window.setOpacity(0))
      for (const theme of ['light', 'dark'] as const) {
        nativeTheme.themeSource = theme
        app.showSettingsWindow()
        await wait(1500)
        const { settingsWindow } = app.getWindows()
        settingsWindow.setSize(656, 1)
        await wait(400)
        const page = (code: string) => settingsWindow.webContents.executeJavaScript(code)
        note(`[${theme}] 가장 작은 창: 크기=${JSON.stringify(settingsWindow.getContentSize())}`)
        for (let index = 0; index < 4; index += 1) {
          await page(`document.querySelectorAll('.settings-toolbar-item')[${index}].click()`)
          await wait(500)
          note(
            `[${theme}] 탭 ${index}: ${await page("(() => { const s = document.querySelector('.settings-scroll'); return '스크롤 높이=' + s.scrollHeight + ', 보이는 높이=' + s.clientHeight + ', 가로 넘침=' + (document.documentElement.scrollWidth > innerWidth) })()")}`
          )
          await shot(settingsWindow, `${theme}-최소높이-탭${index}`)
        }
        await page("document.querySelector('.settings-scroll').scrollTop = 99999")
        settingsWindow.close()
        await wait(400)
      }
      note('끝')
      fs.writeFileSync(path.join(app.dir, 'result.txt'), `${log.join('\n')}\n`)
      app.quit()
      return
    }
    if (process.env.DRAW_TEST_TABS) {
      electronApp.on('browser-window-created', (_event, window) => window.setOpacity(0))
      nativeTheme.themeSource = 'light'
      app.showSettingsWindow()
      await wait(1500)
      const { settingsWindow } = app.getWindows()
      const page = (code: string) => settingsWindow.webContents.executeJavaScript(code)
      // 글이 칸보다 넓어 잘린 곳, 줄의 설명 칸과 단추 칸이 겹친 곳, 창 밖으로 나간 곳을 찾는다.
      const inspect = `(() => {
        const rtl = document.documentElement.dir === 'rtl'
        const name = (el) => (el.textContent || '').trim().slice(0, 40)
        const found = []
        for (const el of document.querySelectorAll('body *')) {
          const own = [...el.childNodes].some((node) => node.nodeType === 3 && node.textContent.trim())
          if (!own || !el.getClientRects().length) continue
          const rect = el.getBoundingClientRect()
          if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== 'visible') found.push('잘림: ' + name(el))
          if (rect.right > innerWidth + 1 || rect.left < -1) found.push('창 밖: ' + name(el))
        }
        for (const item of document.querySelectorAll('.settings-item')) {
          const info = item.querySelector('.settings-item-info')
          const control = item.querySelector('.settings-item-control')
          if (!info || !control) continue
          const a = info.getBoundingClientRect()
          const b = control.getBoundingClientRect()
          if (rtl ? a.left < b.right - 1 : a.right > b.left + 1) found.push('겹침: ' + name(info))
        }
        return '방향=' + document.documentElement.dir + ', 가로 넘침=' + (document.documentElement.scrollWidth > innerWidth) + (found.length ? ', ' + found.join(' / ') : ', 문제 없음')
      })()`
      for (let index = 0; index < 4; index += 1) {
        await page(`document.querySelectorAll('.settings-toolbar-item')[${index}].click()`)
        await wait(600)
        note(`탭 ${index}: ${await page(inspect)}`)
        await shot(settingsWindow, `탭${index}-위`)
        if (
          await page(
            "(() => { const s = document.querySelector('.settings-scroll'); return s.scrollHeight > s.clientHeight })()"
          )
        ) {
          await page("document.querySelector('.settings-scroll').scrollTop = 99999")
          await wait(300)
          note(`탭 ${index} 아래: ${await page(inspect)}`)
          await shot(settingsWindow, `탭${index}-아래`)
        }
        if (index === 1) {
          await page("document.querySelector('.settings-scroll').scrollTop = 0")
          await page(
            "document.querySelectorAll('.settings-section')[0].querySelectorAll('.settings-item')[2].querySelector('.toggle').click()"
          )
          await wait(400)
          note(`아이콘 끄기 묻는 창: ${await page(inspect)}`)
          await shot(settingsWindow, '탭1-묻는창')
          await page("document.querySelector('.alert-buttons .rw-button:not(.default)').click()")
        }
        if (index === 2) {
          await page("document.querySelector('.settings-item-control .button')?.click()")
          await wait(600)
          note(`로그인 창: ${await page(inspect)}`)
          await shot(settingsWindow, '탭2-로그인창')
        }
      }
      settingsWindow.close()
      await wait(400)
      note('끝')
      fs.writeFileSync(path.join(app.dir, 'result.txt'), `${log.join('\n')}\n`)
      app.quit()
      return
    }
    if (process.env.DRAW_TEST_ICON) {
      electronApp.on('browser-window-created', (_event, window) => window.setOpacity(0))
      for (const theme of ['light', 'dark'] as const) {
        nativeTheme.themeSource = theme
        app.showSettingsWindow()
        await wait(1500)
        const { settingsWindow, mainWindow } = app.getWindows()
        const page = (code: string) => settingsWindow.webContents.executeJavaScript(code)
        const tab = (index: number) =>
          page(`document.querySelectorAll('.settings-toolbar-item')[${index}].click()`)
        await tab(3)
        await wait(600)
        await shot(settingsWindow, `${theme}-정보탭`)
        await tab(1)
        await wait(500)
        await page(
          "document.querySelectorAll('.settings-section')[0].querySelectorAll('.settings-item')[2].querySelector('.toggle').click()"
        )
        await wait(400)
        await shot(settingsWindow, `${theme}-아이콘끄기확인`)
        await page("document.querySelector('.alert-buttons .rw-button:not(.default)').click()")
        settingsWindow.close()
        await wait(400)

        const prompt = askUpdate(
          {
            version: '2.6.110602',
            notes: ['왼쪽 도구 막대를 고쳤습니다.'],
            downloading: false,
            percent: 100
          },
          false
        )
        await wait(1500)
        await shot(
          BrowserWindow.getAllWindows().find((window) =>
            window.webContents.getURL().includes('update_page')
          )!,
          `${theme}-업데이트창`
        )
        prompt.close()
        await wait(300)

        mainWindow.setOpacity(0)
        mainWindow.showInactive()
        mainWindow.webContents.send('show_notification', {
          title: 'Draw',
          body: `그리기 모드가 켜졌습니다. (${theme})`
        })
        // 숨겼다 다시 띄운 창은 알림을 늦게 그릴 때가 있어, 이번 알림 글이 보일 때까지 기다린 뒤 찍는다.
        for (let tries = 0; tries < 20; tries += 1) {
          await wait(300)
          const shown = await mainWindow.webContents.executeJavaScript(
            `document.querySelector('#toast-block')?.textContent.includes('(${theme})') ?? false`
          )
          if (shown) {
            break
          }
        }
        await wait(400)
        note(
          `[${theme}-알림] ${await mainWindow.webContents.executeJavaScript(
            `(() => { const t = document.querySelector('#toast-block'); if (!t) return '없음'; const s = getComputedStyle(t); return t.textContent + ' 투명도=' + s.opacity + ' 움직임=' + s.animationName + ' 보임=' + document.visibilityState })()`
          )}`
        )
        await shot(mainWindow, `${theme}-알림`)
        // 알림은 5초 뒤 스스로 사라진다. 사라지기 전에 숨기면 다음 테마 알림이 그려지지 않아, 다 사라진 뒤 숨긴다.
        for (let tries = 0; tries < 30; tries += 1) {
          if (
            !(await mainWindow.webContents.executeJavaScript(
              "!!document.querySelector('#toast-block')"
            ))
          ) {
            break
          }
          await wait(300)
        }
        mainWindow.hide()
        await wait(300)
      }
      note('끝')
      fs.writeFileSync(path.join(app.dir, 'result.txt'), `${log.join('\n')}\n`)
      app.quit()
      return
    }
    if (process.env.DRAW_TEST_BORDER) {
      nativeTheme.themeSource = 'light'
      const { mainWindow } = app.getWindows()
      app.enableDrawMode()
      await wait(1500)
      const list = figures()
      const send = (action: unknown) => mainWindow.webContents.send('test_action', action)
      send({ type: 'figures', figures: list })
      await wait(500)
      const selected = { 사각형: list[3].id, 글자: list[5].id }
      for (const [name, color] of [
        ['흰바탕', '#ffffff'],
        ['어두운바탕', '#1e1e1e'],
        ['연두바탕', '#b7e4c0']
      ]) {
        const key = await mainWindow.webContents.insertCSS(
          `html { background: ${color} !important; }`
        )
        for (const [label, id] of Object.entries(selected)) {
          send({ type: 'select', id })
          await wait(500)
          await shot(mainWindow, `${name}-${label}선택`)
        }
        await mainWindow.webContents.removeInsertedCSS(key)
      }
      note('끝')
      fs.writeFileSync(path.join(app.dir, 'result.txt'), `${log.join('\n')}\n`)
      app.quit()
      return
    }
    if (process.env.DRAW_TEST_ACCOUNT) {
      await wait(1000)
      if (process.env.DRAW_TEST_ACCOUNT === 'signin') {
        await app.account().signIn('login', 'kim@example.com', 'draw1234')
      }
      const file = path.join(electronApp.getPath('userData'), 'account.bin')
      const bytes = fs.existsSync(file) ? fs.readFileSync(file) : null
      note(
        `계정: 설치한 판=${electronApp.isPackaged}, 로그인=${app.account().current()}, 파일=${bytes ? (bytes.toString('utf8').includes('kim@example.com') ? '평문' : '암호화') : '없음'}`
      )
      fs.writeFileSync(path.join(app.dir, 'result.txt'), `${log.join('\n')}\n`)
      app.quit()
      return
    }
    await wait(2500)
    note(`화면들: ${JSON.stringify(screen.getAllDisplays().map((d) => d.bounds))}`)
    {
      const { mainWindow, extendedToolbarWindow } = app.getWindows()
      note(
        `켠 직후: 그리는 중=${app.isDrawing()}, 그림판 창 보임=${mainWindow.isVisible()}, 작은 막대 보임=${extendedToolbarWindow.isVisible()}, 설정 창 보임=${Boolean(app.getWindows().settingsWindow?.isVisible())}`
      )
      await shot(mainWindow, '0-켠직후-그림판')
    }

    for (const theme of ['light', 'dark'] as const) {
      nativeTheme.themeSource = theme
      const { mainWindow, extendedToolbarWindow, panelWindow } = app.getWindows()

      app.enablePointerMode()
      await wait(1500)
      note(
        `[${theme}] 클릭 모드: 그림판 창 보임=${mainWindow.isVisible()}, 작은 막대 보임=${extendedToolbarWindow.isVisible()}, 작은 막대 크기=${JSON.stringify(extendedToolbarWindow.getBounds())}`
      )
      await shot(extendedToolbarWindow, `${theme}-1-클릭모드-작은막대`)
      await wait(Number(process.env.DRAW_TEST_HOLD_MS || 0))

      app.showPanel()
      await wait(800)
      await shot(panelWindow, `${theme}-2-패널-클릭모드`)
      await wait(Number(process.env.DRAW_TEST_HOLD_MS || 0))
      const panelRows = () =>
        panelWindow.webContents.executeJavaScript(
          "[...document.querySelectorAll('.rm-head, .rm-item, .rm-separator')].map((node) => node.classList.contains('rm-separator') ? '—' : node.textContent).join(' | ')"
        )
      note(`[${theme}] 패널 줄(클릭 모드): ${await panelRows()}`)

      // 패널 맨 위 「그리기 시작」 줄을 누르면 패널이 닫히고 그리기 모드가 된다.
      await panelWindow.webContents.executeJavaScript("document.querySelector('.rm-item').click()")
      await wait(1200)
      note(
        `[${theme}] 패널 「그리기 시작」 누름: 패널 보임=${panelWindow.isVisible()}, 그리는 중=${app.isDrawing()}`
      )

      app.enableDrawMode()
      await wait(400)
      note(
        `[${theme}] 그리기 모드: 그림판 창 보임=${mainWindow.isVisible()}, 그리는 중=${app.isDrawing()}`
      )
      await shot(mainWindow, `${theme}-3-그리기-빈화면`)

      const send = (action: unknown) => mainWindow.webContents.send('test_action', action)
      const count = () => mainWindow.webContents.executeJavaScript('window.__drawFigureCount')

      send({ type: 'figures', figures: figures() })
      await wait(500)
      note(`[${theme}] 그림 넣기: 그림 수=${await count()}`)
      await shot(mainWindow, `${theme}-4-그리기-그림`)
      await wait(Number(process.env.DRAW_TEST_HOLD_MS || 0))

      // 그림이 있을 때 클릭 모드로 바꾸면 그림은 남고 큰 막대만 사라져야 한다.
      app.enablePointerMode()
      await wait(800)
      const toolbarShown = () =>
        mainWindow.webContents.executeJavaScript("Boolean(document.getElementById('toolbar'))")
      note(
        `[${theme}] 그림 있는 클릭 모드: 그림판 창 보임=${mainWindow.isVisible()}, 그림 수=${await count()}, 큰 막대 있음=${await toolbarShown()}, 작은 막대 보임=${extendedToolbarWindow.isVisible()}, 그림판 창 키 받음=${mainWindow.isFocusable()}`
      )
      await shot(mainWindow, `${theme}-4-클릭모드-그림남음`)
      app.enableDrawMode()
      await wait(800)
      note(
        `[${theme}] 다시 그리기 모드: 그림 수=${await count()}, 큰 막대 있음=${await toolbarShown()}`
      )

      for (const tool of [
        'highlighter',
        'arrow',
        'rectangle',
        'oval',
        'text',
        'eraser',
        'pen',
        'laser',
        'brush'
      ]) {
        send({ type: 'tool', tool })
        await wait(150)
        const active = await mainWindow.webContents.executeJavaScript(
          "[...document.querySelectorAll('#toolbar .toolbar__panel--full .toolbar__body li')].findIndex((li) => li.classList.contains('active'))"
        )
        note(`[${theme}] 도구 ${tool}: 막대에서 켜진 칸 번호=${active}`)
      }

      const hit = await mainWindow.webContents.executeJavaScript(`
        [...document.querySelectorAll('#toolbar .toolbar__panel--full .toolbar__body li:not(.cross-line)')].map((li) => {
          const r = li.getBoundingClientRect();
          return li.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
        })`)
      note(
        `[${theme}] 막대 칸을 누르면 그 칸이 받는가(도구 7 · 색 · 되돌리기 · 지우기): ${JSON.stringify(hit)}`
      )
      const rect = await mainWindow.webContents.executeJavaScript(
        "(() => { const r = document.getElementById('toolbar').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })()"
      )
      note(`[${theme}] 막대 자리: ${JSON.stringify(rect)}`)

      send({ type: 'slide', slide: 'color-slide' })
      await wait(500)
      await shot(mainWindow, `${theme}-5-색고르기`)
      send({ type: 'slide', slide: 'main-slide' })
      await wait(400)

      const before = await count()
      send({ type: 'undo' })
      await wait(200)
      const undone = await count()
      send({ type: 'redo' })
      await wait(200)
      const redone = await count()
      note(`[${theme}] 되돌리기: ${before} -> ${undone}, 다시 하기 -> ${redone}`)
      send({ type: 'clear' })
      await wait(300)
      note(`[${theme}] 전체 지우기 뒤 그림 수=${await count()}`)

      app.showPanel()
      await wait(800)
      await shot(panelWindow, `${theme}-6-패널-그리는중`)
      note(`[${theme}] 패널 줄(그리는 중): ${await panelRows()}`)
      app.hidePanel()

      await settingsScenes(theme)

      const notes = ['왼쪽 도구 막대를 고쳤습니다.', '패널 글을 다듬었습니다.']
      const updateWindow = () =>
        BrowserWindow.getAllWindows().find((window) =>
          window.webContents.getURL().includes('update_page')
        )!
      const prompt = askUpdate(
        { version: '2.6.110602', notes, downloading: false, percent: 100 },
        false
      )
      await wait(1500)
      await shot(updateWindow(), `${theme}-9-업데이트창`)
      prompt.close()
      await wait(300)

      const downloading = askUpdate(
        { version: '2.6.110602', notes, downloading: true, percent: 42 },
        false
      )
      await wait(1500)
      await shot(updateWindow(), `${theme}-9-업데이트창-받는중`)
      downloading.close()
      await wait(300)
    }
    note('끝')
  } catch (error) {
    note(`오류: ${(error as Error)?.stack || error}`)
  }

  fs.writeFileSync(path.join(app.dir, 'result.txt'), `${log.join('\n')}\n`)
  app.quit()
}
