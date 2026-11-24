// 시험판 전용(DRAW_TEST_BUILD): 키보드 · 마우스를 흉내 내지 않고, 앱의 처리 함수를 불러 상태를 띄워 창마다 그림을 저장한다.
// 쓰는 법: RUNNERS_TEST_SHOTS=<폴더> [RUNNERS_TEST_LANG=ko,en] [RUNNERS_TEST_SCOPE=all] Draw 실행.
// 켜고 끄기 · 파일 이름 · 밝은 · 어두운 화면 · shots.json 은 kit 의 공통 도우미(runners/test-shots.ts)가 맡고,
// 여기는 언어마다 · 테마마다 어느 화면을 어떻게 여는지만 적는다(규약: ~/git/runners/_docs/[PROGRAM] 시험 촬영 규약.md).
// 모든 창은 투명하게 두어 이 맥에서 일하는 사람의 화면을 가리지 않는다.
// DRAW_API_URL 로 이 컴퓨터 안의 시험 서버를 주면 계정 칸에서 로그인 · 로그아웃까지 해 본다.
// RUNNERS_TEST_ACCOUNT=signed-in 이면 로그인한 채로 끝내, 계정 파일이 암호화되어 남는지 본다.
import { BrowserWindow, Menu, app as electronApp, nativeTheme, screen } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import {
  keepHidden,
  runTestShots,
  type TestShotPass,
  type TestShotsConfig
} from './runners/test-shots'
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

// 글이 칸보다 넓어 잘린 곳, 줄의 설명 칸과 단추 칸이 겹친 곳, 창 밖으로 나간 곳을 찾는다.
const inspectLayout = `(() => {
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

export async function runDrawTestShots(config: TestShotsConfig, app: any) {
  // 창을 보이고 숨길 때 앱이 투명도를 1 로 되돌리므로, 시험 동안은 늘 0 이 되게 막는다.
  BrowserWindow.getAllWindows().forEach(keepHidden)
  electronApp.on('browser-window-created', (_event, window) => keepHidden(window))

  // 화면 코드 오류를 notes 에 남긴다. 그렇지 않으면 창이 비어 있는 까닭을 알 수 없다.
  const errors: string[] = []
  const watch = (window: Electron.BrowserWindow) => {
    window.webContents.on('console-message', (details) => {
      if (details.level === 'error') {
        errors.push(`[화면 오류] ${details.message} (${details.sourceId}:${details.lineNumber})`)
      }
    })
  }
  BrowserWindow.getAllWindows().forEach(watch)
  electronApp.on('browser-window-created', (_event, window) => watch(window))

  let firstPass = true

  await runTestShots({
    config,
    app: electronApp,
    nativeTheme,
    setLanguage: (lang) => app.setLanguage(lang),
    scenes: async (pass) => {
      if (firstPass) {
        firstPass = false
        await wait(2500)
        const labels = (items: Electron.MenuItem[], depth = 0): string[] =>
          items.flatMap((item) => [
            `${'  '.repeat(depth)}${item.type === 'separator' ? '—' : `${item.label}${item.accelerator ? ` (${item.accelerator})` : ''}`}`,
            ...labels(item.submenu?.items ?? [], depth + 1)
          ])
        pass.note(`화면들: ${JSON.stringify(screen.getAllDisplays().map((d) => d.bounds))}`)
        pass.note(`앱 메뉴:\n${labels(Menu.getApplicationMenu()?.items ?? []).join('\n')}`)
      }
      await drawScenes(pass, app)
      await settingsScenes(pass, app)
      await popupScenes(pass)
      errors.splice(0).forEach((line) => pass.note(line))
    }
  })
}

// 그림판 · 클릭 모드 작은 막대 · 메뉴 막대 패널 · 그리기 테두리.
async function drawScenes(pass: TestShotPass, app: any) {
  const { mainWindow, extendedToolbarWindow, panelWindow } = app.getWindows()
  const { note, shot } = pass

  note(
    `시작: 그리는 중=${app.isDrawing()}, 그림판 창 보임=${mainWindow.isVisible()}, 작은 막대 보임=${extendedToolbarWindow.isVisible()}, 설정 창 보임=${Boolean(app.getWindows().settingsWindow?.isVisible())}`
  )
  await shot(mainWindow, 'main', '시작-그림판')

  app.enablePointerMode()
  await wait(1500)
  note(
    `클릭 모드: 그림판 창 보임=${mainWindow.isVisible()}, 작은 막대 보임=${extendedToolbarWindow.isVisible()}, 작은 막대 크기=${JSON.stringify(extendedToolbarWindow.getBounds())}`
  )
  await shot(extendedToolbarWindow, 'main', '클릭모드-작은막대')

  app.showPanel()
  await wait(800)
  await shot(panelWindow, 'menu', '패널-클릭모드')
  const panelRows = () =>
    panelWindow.webContents.executeJavaScript(
      "[...document.querySelectorAll('.rm-head, .rm-item, .rm-separator')].map((node) => node.classList.contains('rm-separator') ? '—' : node.textContent).join(' | ')"
    )
  note(`패널 줄(클릭 모드): ${await panelRows()}`)

  // 패널 맨 위 「그리기 시작」 줄을 누르면 패널이 닫히고 그리기 모드가 된다.
  await panelWindow.webContents.executeJavaScript("document.querySelector('.rm-item').click()")
  await wait(1200)
  note(
    `패널 「그리기 시작」 누름: 패널 보임=${panelWindow.isVisible()}, 그리는 중=${app.isDrawing()}`
  )

  app.enableDrawMode()
  await wait(400)
  note(`그리기 모드: 그림판 창 보임=${mainWindow.isVisible()}, 그리는 중=${app.isDrawing()}`)
  await shot(mainWindow, 'main', '그리기-빈화면')

  const send = (action: unknown) => mainWindow.webContents.send('test_action', action)
  const count = () => mainWindow.webContents.executeJavaScript('window.__drawFigureCount')

  const list = figures()
  send({ type: 'figures', figures: list })
  await wait(500)
  note(`그림 넣기: 그림 수=${await count()}`)
  await shot(mainWindow, 'main', '그리기-그림')

  // 그림이 있을 때 클릭 모드로 바꾸면 그림은 남고 큰 막대만 사라져야 한다.
  app.enablePointerMode()
  await wait(800)
  const toolbarShown = () =>
    mainWindow.webContents.executeJavaScript("Boolean(document.getElementById('toolbar'))")
  note(
    `그림 있는 클릭 모드: 그림판 창 보임=${mainWindow.isVisible()}, 그림 수=${await count()}, 큰 막대 있음=${await toolbarShown()}, 작은 막대 보임=${extendedToolbarWindow.isVisible()}, 그림판 창 키 받음=${mainWindow.isFocusable()}`
  )
  await shot(mainWindow, 'main', '클릭모드-그림남음')
  app.enableDrawMode()
  await wait(800)
  note(`다시 그리기 모드: 그림 수=${await count()}, 큰 막대 있음=${await toolbarShown()}`)

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
    note(`도구 ${tool}: 막대에서 켜진 칸 번호=${active}`)
  }

  const hit = await mainWindow.webContents.executeJavaScript(`
    [...document.querySelectorAll('#toolbar .toolbar__panel--full .toolbar__body li:not(.cross-line)')].map((li) => {
      const r = li.getBoundingClientRect();
      return li.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    })`)
  note(`막대 칸을 누르면 그 칸이 받는가(도구 7 · 색 · 되돌리기 · 지우기): ${JSON.stringify(hit)}`)
  const rect = await mainWindow.webContents.executeJavaScript(
    "(() => { const r = document.getElementById('toolbar').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })()"
  )
  note(`막대 자리: ${JSON.stringify(rect)}`)

  send({ type: 'slide', slide: 'color-slide' })
  await wait(500)
  await shot(mainWindow, 'main', '색고르기')
  send({ type: 'slide', slide: 'main-slide' })
  await wait(400)

  const before = await count()
  send({ type: 'undo' })
  await wait(200)
  const undone = await count()
  send({ type: 'redo' })
  await wait(200)
  const redone = await count()
  note(`되돌리기: ${before} -> ${undone}, 다시 하기 -> ${redone}`)
  // 고른 그림의 테두리가 흰 · 어두운 · 연두 바탕 위에서도 보이는지.
  const selected = { 사각형: list[3].id, 글자: list[5].id }
  for (const [name, color] of [
    ['흰바탕', '#ffffff'],
    ['어두운바탕', '#1e1e1e'],
    ['연두바탕', '#b7e4c0']
  ]) {
    const key = await mainWindow.webContents.insertCSS(`html { background: ${color} !important; }`)
    for (const [label, id] of Object.entries(selected)) {
      send({ type: 'select', id })
      await wait(500)
      await shot(mainWindow, 'main', `테두리-${name}-${label}선택`)
    }
    await mainWindow.webContents.removeInsertedCSS(key)
  }
  send({ type: 'clear' })
  await wait(300)
  note(`전체 지우기 뒤 그림 수=${await count()}`)

  app.showPanel()
  await wait(800)
  await shot(panelWindow, 'menu', '패널-그리는중')
  note(`패널 줄(그리는 중): ${await panelRows()}`)
  app.hidePanel()
  await wait(400)

  // 화이트보드: 켠 모습, 설정 칸(바탕색 · 진하기 · 무늬 간격 · 무늬), 크기 · 자리 바꾸기 틀. 글이 언어마다 나오는지 본다.
  const board = (script: string) => mainWindow.webContents.executeJavaScript(script)
  mainWindow.webContents.send('toggle_whiteboard')
  await wait(600)
  await shot(mainWindow, 'main', '화이트보드')
  await board("document.querySelector('.whiteboard-toggle')?.click()")
  await wait(500)
  note(
    `화이트보드 설정 칸: ${await board("[...document.querySelectorAll('.whiteboard-sidebar__head, .whiteboard-sidebar__label, .whiteboard-sidebar__theme, .whiteboard-sidebar__style')].map((el) => el.textContent.trim()).join(' | ')")}`
  )
  await shot(mainWindow, 'main', '화이트보드-설정')
  await board("document.querySelector('.whiteboard-sidebar__label-link')?.click()")
  await wait(500)
  note(
    `화이트보드 크기 틀 안내: ${await board("document.querySelector('.whiteboard-resize-frame__hint')?.textContent ?? '(없음)'")}`
  )
  await shot(mainWindow, 'main', '화이트보드-크기바꾸기')
  await board(
    "document.querySelector('.whiteboard-resize-frame')?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))"
  )
  await wait(400)
  mainWindow.webContents.send('toggle_whiteboard')
  await wait(400)

  app.enablePointerMode()
  await wait(600)
}

// 설정 창 하나(2026-11-08 창 통일): 그리기 · 일반 · 계정 · 정보 탭, 메뉴 막대 아이콘 끄기 · 켜기, ⌘, 메뉴, 가장 작은 높이.
async function settingsScenes(pass: TestShotPass, app: any) {
  const { note, shot } = pass
  app.showSettingsWindow()
  await wait(1500)
  const { settingsWindow } = app.getWindows()
  const page = (code: string) => settingsWindow.webContents.executeJavaScript(code)
  const tab = async (index: number) => {
    await page(`document.querySelectorAll('.settings-toolbar-item')[${index}].click()`)
    await wait(500)
  }
  const scrollDown = async () => {
    await page("document.querySelector('.settings-scroll').scrollTop = 99999")
    await wait(300)
  }
  note(
    `설정 창: 크기=${JSON.stringify(settingsWindow.getContentSize())}, 탭=${await page("[...document.querySelectorAll('.settings-toolbar-item')].map((b) => b.textContent).join(' · ')")}, 제목 줄=${await page("document.querySelector('.settings-titlebar')?.textContent ?? '(없음)'")}`
  )
  note(
    `설정 탭 줄: ${await page(`(() => {
      const bar = document.querySelector('.settings-toolbar').getBoundingClientRect();
      const tabs = [...document.querySelectorAll('.settings-toolbar-item')].map((b) => b.getBoundingClientRect());
      return 'toolbar 폭=' + Math.round(bar.width)
        + ', 탭 폭=' + tabs.map((r) => Math.round(r.width)).join('/')
        + ', 왼쪽 여백=' + Math.round(tabs[0].left - bar.left)
        + ', 오른쪽 여백=' + Math.round(bar.right - tabs[tabs.length - 1].right);
    })()`)}`
  )
  note(
    `설정 › 그리기 첫 줄: 설명 칸 높이=${await page("document.querySelector('.settings-item-description').offsetHeight")}, 단축키 칸 방향=${await page("getComputedStyle(document.querySelector('.hotkey-pill')).direction")}, 글꼴 들어옴=${await page("document.fonts.check('13px Pretendard')")}, 단추 글꼴=${await page("getComputedStyle(document.querySelector('.settings-item-control .button, .settings-item-control select') ?? document.body).fontFamily.split(',')[0]")}`
  )
  note(`설정 › 그리기 위: ${await page(inspectLayout)}`)
  // 단축키 칸을 누르면 키를 기다리는 동안 「키를 누르세요…」가 그 언어로 나오는지(사진 번호를 바꾸지 않으려고 글로만 본다).
  await page("document.querySelector('.record-block')?.click()")
  await wait(300)
  note(
    `단축키 칸 누름: ${await page("document.querySelector('.record-block .placeholder')?.textContent ?? '(글 없음)'")}`
  )
  await page('document.activeElement?.blur()')
  await wait(400)
  await shot(settingsWindow, 'settings', '그리기-위')
  await scrollDown()
  note(`설정 › 그리기 아래: ${await page(inspectLayout)}`)
  await shot(settingsWindow, 'settings', '그리기-아래')

  await tab(1)
  note(`설정 › 일반: ${await page(inspectLayout)}`)
  await shot(settingsWindow, 'settings', '일반')
  note(
    `설정 › 일반 줄: ${await page("[...document.querySelectorAll('.settings-item-title')].map((el) => el.textContent).join(' | ')")}`
  )

  // 메뉴 막대 아이콘 끄기: 스위치를 누르면 묻는 창이 뜨고, 확인을 누르면 메인이 아이콘을 없앤다.
  const toggle =
    "document.querySelectorAll('.settings-section')[0].querySelectorAll('.settings-item')[2].querySelector('.toggle')"
  await page(`${toggle}.click()`)
  await wait(400)
  note(
    `아이콘 끄기 누름: 묻는 창=${await page("document.querySelector('.alert-message')?.textContent ?? '(없음)'")}, 아이콘 보임=${app.isTrayShown()}, ${await page(inspectLayout)}`
  )
  await shot(settingsWindow, 'settings', '일반-아이콘끄기확인')
  await page("document.querySelector('.alert-buttons .rw-button.default').click()")
  await wait(600)
  note(
    `아이콘 끄기 확인: 아이콘 보임=${app.isTrayShown()}, 스위치 켜짐=${await page(`${toggle}.classList.contains('active')`)}`
  )

  // 아이콘을 숨긴 채 Draw 를 다시 열면(두 번째 실행 · 맥 activate) 설정 › 일반이 열린다.
  await tab(0)
  app.openedAgain()
  await wait(800)
  note(
    `아이콘 숨김 중 다시 열기: 설정 창 보임=${settingsWindow.isVisible()}, 탭=${await page("document.querySelector('.settings-toolbar-item.rw-selected')?.textContent")}, 그리는 중=${app.isDrawing()}`
  )
  await page(`${toggle}.click()`)
  await wait(600)
  note(
    `아이콘 다시 켜기: 아이콘 보임=${app.isTrayShown()}, 묻는 창=${await page("Boolean(document.querySelector('.alert'))")}`
  )

  await accountScenes(pass, app, settingsWindow)

  await tab(3)
  await wait(100)
  note(`설정 › 정보: ${await page(inspectLayout)}`)
  await shot(settingsWindow, 'settings', '정보')
  await page("document.querySelector('.about-notices-link').click()")
  await wait(600)
  await shot(settingsWindow, 'settings', '정보-오픈소스고지')
  await page("document.querySelector('.notices-close').click()")
  await wait(300)

  // 가장 작은 높이로 줄여도 탭마다 내용이 스크롤로 다 보이는지.
  const size = settingsWindow.getSize()
  settingsWindow.setSize(size[0], 1)
  await wait(400)
  note(`가장 작은 창: 크기=${JSON.stringify(settingsWindow.getContentSize())}`)
  for (const [index, name] of ['그리기', '일반', '계정', '정보'].entries()) {
    await tab(index)
    note(
      `가장 작은 창 › ${name}: ${await page("(() => { const s = document.querySelector('.settings-scroll'); return '스크롤 높이=' + s.scrollHeight + ', 보이는 높이=' + s.clientHeight + ', 가로 넘침=' + (document.documentElement.scrollWidth > innerWidth) })()")}`
    )
    await shot(settingsWindow, 'settings', `최소높이-${name}`)
  }
  settingsWindow.close()
  await wait(400)

  // ⌘, : 맥은 앱 메뉴 단축키로 연다. 메뉴 줄의 단축키와 처리 함수를 불러 설정 창이 뜨는지 본다.
  const settingsItem = Menu.getApplicationMenu()
    ?.items.flatMap((item) => item.submenu?.items ?? [])
    .find((item) => item.accelerator === app.settingsAccelerator)
  note(
    `⌘, 메뉴 줄: 글=${settingsItem?.label ?? '(없음)'}, 단축키=${settingsItem?.accelerator ?? '(없음)'}`
  )
  settingsItem?.click()
  await wait(1500)
  const reopened = app.getWindows().settingsWindow
  note(
    `⌘, 처리 함수: 설정 창 열림=${Boolean(reopened?.isVisible())}, 탭=${reopened ? await reopened.webContents.executeJavaScript("document.querySelector('.settings-toolbar-item.rw-selected')?.textContent") : '(없음)'}`
  )
  reopened?.close()
  await wait(400)
}

// 설정 › 계정 칸. 서버 없이 되는 것(로그인 창 · 비밀번호 모양 검사)은 언제나 보고,
// DRAW_API_URL 로 이 컴퓨터 안의 시험 서버를 줬을 때만 틀린 비밀번호 · 로그인 · 로그아웃까지 창으로 해 본다.
async function accountScenes(pass: TestShotPass, app: any, settingsWindow: Electron.BrowserWindow) {
  const { note, shot } = pass
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
  await shot(settingsWindow, 'account', '설정-계정')
  await page("document.querySelector('.account-empty .rw-button').click()")
  await wait(500)
  note(`로그인 창: ${await page(inspectLayout)}`)
  await shot(settingsWindow, 'account', '로그인창')

  // 시트가 좁아져도 한국어 안내 글은 낱말 사이에서만 줄이 바뀐다(kit 0.1.34 word-break: keep-all).
  // 설정 창은 기본 폭보다 좁힐 수 없어 시트 폭만 줄여 찍고, 글마다 줄을 나눠 적는다.
  const lines = () =>
    page(`[...document.querySelectorAll('.ra-sheet :is(.ra-title, .ra-sub, .ra-intro, .ra-note, .ra-hint, .ra-forgot, .ra-submit, .ra-link)')]
      .filter((el) => el.textContent.trim())
      .map((el) => {
        const rows = []
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          for (let i = 0; i < node.length; i++) {
            const range = document.createRange()
            range.setStart(node, i)
            range.setEnd(node, i + 1)
            const top = Math.round(range.getBoundingClientRect().top)
            const row = rows.find((r) => Math.abs(r.top - top) < 4)
            if (row) row.text += node.data[i]
            else rows.push({ top, text: node.data[i] })
          }
        }
        return rows.map((r) => r.text.trim()).filter(Boolean).join(' / ')
      })
      .join(' | ')`) as Promise<string>
  note(`로그인 창 줄(360): ${await lines()}`)
  await page("document.querySelector('.ra-sheet').style.width = '240px'")
  await wait(300)
  note(`로그인 창 줄(240): ${await lines()}`)
  await shot(settingsWindow, 'account', '로그인창-좁은폭')
  await page("document.querySelector('.ra-sheet').style.width = ''")
  await wait(200)

  // 빈 칸이어도 단추는 밝고, 누르면 칸 아래에 무엇이 빠졌는지 알린다(kit 0.1.32, 휴대폰 앱과 같은 규칙).
  note(`로그인 창 빈 칸: 단추 막힘=${await page("document.querySelector('.ra-submit').disabled")}`)
  await page("document.querySelector('.ra-submit').click()")
  await wait(400)
  note(`로그인 창 빈 칸 누름: 알림=${await problem()}`)
  await shot(settingsWindow, 'account', '로그인창-빈칸누름')

  // 계정 만들기에서 모양이 틀린 비밀번호는 메일을 보내기 전에 창이 막는다(서버에 가지 않음).
  await page("[...document.querySelectorAll('.ra-link')].at(-1).click()")
  await wait(300)
  await fill('.ra-field[type=email]', 'kim@example.com')
  await fill('.ra-field[type=password]', 'abc')
  await page("document.querySelector('.ra-submit').click()")
  await wait(400)
  note(`계정 만들기 · 비밀번호 abc: 알림=${await problem()}`)
  await shot(settingsWindow, 'account', '계정만들기-비밀번호모양')

  if (!process.env.DRAW_API_URL) {
    note('시험 서버 없음(DRAW_API_URL): 로그인 · 로그아웃은 건너뜀')
    return
  }
  await page("[...document.querySelectorAll('.ra-link')].at(-1).click()")
  await wait(300)
  await fill('.ra-field[type=email]', 'kim@example.com')
  await fill('.ra-field[type=password]', 'wrong1234')
  await page("document.querySelector('.ra-submit').click()")
  await wait(800)
  note(`로그인 · 틀린 비밀번호: 알림=${await problem()}`)
  await shot(settingsWindow, 'account', '로그인-비밀번호틀림')

  // kit 0.1.50 시험 서버(relay-dev)는 wrong1234 만 거절한다. 옛 시험 서버는 어떤 비밀번호로도 로그인시켜 창이 이미 닫혀 있다.
  if (await page("Boolean(document.querySelector('.ra-sheet'))")) {
    await fill('.ra-field[type=password]', 'draw1234')
    await page("document.querySelector('.ra-submit').click()")
    await wait(1000)
  }
  note(
    `로그인: 메인 계정=${app.account().current()}, 창 제목 줄=${await page("document.querySelector('.settings-item-title')?.textContent")}, 로그인 창 남음=${await page("Boolean(document.querySelector('.ra-sheet'))")}`
  )
  await shot(settingsWindow, 'account', '로그인됨')
  // 별명 칸(2026-11-19 결정 2B): 30자를 넘기면 서버에 보내기 전에 칸 아래에 알린다.
  await fill('.account-nickname', '가'.repeat(31))
  await page(
    "document.querySelector('.account-nickname').closest('.settings-item').querySelector('.rw-button').click()"
  )
  await wait(300)
  note(
    `별명 31자: 알림=${await page("document.querySelector('.account-nickname').closest('.settings-item').querySelector('.ra-error')?.textContent ?? '(없음)'")}, 칸 기본 글=${await page("document.querySelector('.account-nickname').placeholder")}`
  )
  await shot(settingsWindow, 'account', '별명-너무김')
  // 시험 서버(kit 0.1.50 relay-dev)의 별명 API 로 실제로 저장하고, 비워 저장하면 기본 이름(이메일 앞부분)으로 돌아오는지 본다.
  const saveNickname = async (name: string) => {
    await fill('.account-nickname', name)
    await page(
      "document.querySelector('.account-nickname').closest('.settings-item').querySelector('.rw-button').click()"
    )
    await wait(800)
    return `제목 줄=${await page("document.querySelector('.settings-item-title')?.textContent")}, 동그라미=${await page("document.querySelector('.ra-badge')?.textContent")}, 설명 줄=${await page("document.querySelector('.account-nickname').closest('.settings-item').querySelector('.settings-item-description')?.textContent")}`
  }
  note(`별명 저장(김러너): ${await saveNickname('김러너')}`)
  await shot(settingsWindow, 'account', '별명-저장됨')
  note(`별명 비워 저장: ${await saveNickname('')}`)
  await page("document.querySelector('.ra-badge').click()")
  await wait(400)
  await shot(settingsWindow, 'account', '계정메뉴')
  note(
    `계정 동그라미: 판다 그림 폭=${await page("[...document.querySelectorAll('.ra-badge img')].map((img) => img.naturalWidth).join('/')")}, 로그아웃 화살표=${await page("getComputedStyle(document.querySelector('.ra-out')).transform")}`
  )
  const file = path.join(electronApp.getPath('userData'), 'account.bin')
  const bytes = fs.existsSync(file) ? fs.readFileSync(file) : null
  note(
    `계정 파일: 설치한 판=${electronApp.isPackaged}, 파일=${bytes ? (bytes.toString('utf8').includes('kim@example.com') ? '평문' : '암호화') : '없음'}`
  )
  if (pass.account === 'signed-in') {
    note('RUNNERS_TEST_ACCOUNT=signed-in: 로그인한 채로 둔다')
    return
  }
  await page("[...document.querySelectorAll('.ra-menu-item')].at(-1).click()")
  await wait(800)
  note(
    `로그아웃: 메인 계정=${app.account().current()}, 로그인 단추=${await page("Boolean(document.querySelector('.account-empty .rw-button'))")}`
  )
}

// 앱 위에 따로 뜨는 것: 업데이트 창(다 받음 · 받는 중 · 깔린 뒤), 그림판 알림.
async function popupScenes(pass: TestShotPass) {
  const { note, shot } = pass
  // 한 줄은 실제 출시 노트만큼 길게 두어, 낱말 중간에서 줄이 바뀌지 않는지(kit 0.1.43 keep-all) 사진으로 본다.
  const notes = [
    '켜진 스위치와 고른 탭 · 도구 · 색을 파랑으로 표시하고, 카드와 창의 둘레 선을 또렷하게 해 무엇이 켜지고 골라졌는지 한눈에 보이게 했습니다.',
    '패널 글을 다듬었습니다.'
  ]
  const updateWindow = () =>
    BrowserWindow.getAllWindows().find((window) =>
      window.webContents.getURL().includes('update_page')
    )!
  const ready = askUpdate({ version: '2.6.110602', notes, downloading: false, percent: 100 }, false)
  await wait(1500)
  await shot(updateWindow(), 'popups', '업데이트창')
  ready.close()
  await wait(300)

  const downloading = askUpdate(
    { version: '2.6.110602', notes, downloading: true, percent: 42 },
    false
  )
  await wait(1500)
  await shot(updateWindow(), 'popups', '업데이트창-받는중')
  downloading.close()
  await wait(300)

  // 저절로 깔린 뒤 처음 열 때의 알림. 「바뀐 점 보기」를 누르면 새 소식이 펼쳐진다.
  const installed = askUpdate(
    { version: '2.6.110602', notes, downloading: false, percent: 100, installed: true },
    false
  )
  await wait(1500)
  await shot(updateWindow(), 'popups', '업데이트창-깔린뒤')
  await updateWindow().webContents.executeJavaScript(
    `document.querySelector('.update-buttons .rw-button:not(.default)')?.click()`
  )
  await wait(800)
  await shot(updateWindow(), 'popups', '업데이트창-깔린뒤-바뀐점')
  installed.close()
  await wait(300)

  const mainWindow = BrowserWindow.getAllWindows().find((window) =>
    window.webContents.getURL().includes('app_page')
  )!
  const wasShown = mainWindow.isVisible()
  mainWindow.showInactive()
  mainWindow.webContents.send('show_notification', {
    title: 'Draw',
    body: `그리기 모드가 켜졌습니다. (${pass.lang} ${pass.theme})`
  })
  // 숨겼다 다시 띄운 창은 알림을 늦게 그릴 때가 있어, 이번 알림 글이 보일 때까지 기다린 뒤 찍는다.
  for (let tries = 0; tries < 20; tries += 1) {
    await wait(300)
    const shown = await mainWindow.webContents.executeJavaScript(
      `document.querySelector('#toast-block')?.textContent.includes('(${pass.lang} ${pass.theme})') ?? false`
    )
    if (shown) {
      break
    }
  }
  await wait(400)
  note(
    `알림: ${await mainWindow.webContents.executeJavaScript(
      `(() => { const t = document.querySelector('#toast-block'); if (!t) return '없음'; const s = getComputedStyle(t); return t.textContent + ' 투명도=' + s.opacity + ' 움직임=' + s.animationName + ' 보임=' + document.visibilityState })()`
    )}`
  )
  await shot(mainWindow, 'popups', '알림')
  // 알림은 5초 뒤 스스로 사라진다. 사라지기 전에 숨기면 다음 알림이 그려지지 않아, 다 사라진 뒤 숨긴다.
  for (let tries = 0; tries < 30; tries += 1) {
    if (
      !(await mainWindow.webContents.executeJavaScript("!!document.querySelector('#toast-block')"))
    ) {
      break
    }
    await wait(300)
  }
  if (!wasShown) {
    mainWindow.hide()
  }
  await wait(300)
}
