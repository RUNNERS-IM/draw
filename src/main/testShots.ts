// 시험판 전용(DRAW_TEST_BUILD): 키보드 · 마우스를 흉내 내지 않고, 앱의 처리 함수를 불러 상태를 띄워 창마다 그림을 저장한다.
// 쓰는 법: DRAW_TEST_SHOTS=<폴더> [DRAW_TEST_LANG=<언어 코드>] Draw 실행. 끝나면 스스로 꺼지고 그 폴더에 result.txt 를 남긴다.
import { BrowserWindow, app as electronApp, nativeTheme, screen } from 'electron'
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
    await wait(2500)
    note(`화면들: ${JSON.stringify(screen.getAllDisplays().map((d) => d.bounds))}`)

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
      app.hidePanel()

      app.enableDrawMode()
      await wait(1200)
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
      app.hidePanel()

      app.showAboutWindow()
      await wait(1800)
      const { aboutWindow } = app.getWindows()
      await shot(aboutWindow, `${theme}-7-정보창`)
      note(`[${theme}] 정보 창 크기=${JSON.stringify(aboutWindow.getContentSize())}`)
      await aboutWindow.webContents.executeJavaScript(
        "document.querySelector('.about-notices-link').click()"
      )
      await wait(600)
      await shot(aboutWindow, `${theme}-7-정보창-오픈소스고지`)
      await wait(Number(process.env.DRAW_TEST_HOLD_MS || 0))
      aboutWindow.close()
      await wait(400)

      app.showSettingsWindow()
      await wait(1500)
      const { settingsWindow } = app.getWindows()
      await shot(settingsWindow, `${theme}-8-설정-단축키`)
      for (const [index, name] of [
        [1, '모양'],
        [2, '앱']
      ]) {
        await settingsWindow.webContents.executeJavaScript(
          `document.querySelectorAll('.settings-sidebar-item')[${index}].click()`
        )
        await wait(400)
        await shot(settingsWindow, `${theme}-8-설정-${name}`)
      }
      settingsWindow.close()
      await wait(400)

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
