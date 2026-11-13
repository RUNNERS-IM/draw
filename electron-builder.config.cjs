// Draw 묶기(electron-builder). Monitor · Split 과 같은 도구 · 같은 방식이다.
//
//   pnpm dist                     이 맥에서 열어 볼 판(서명 없음, 임시 서명), dist.noindex/ 에
//   DRAW_RELEASE=1 ...            출시 판: hardened runtime, Developer ID 서명과 공증(CI)
//   DRAW_TAG=2.6.110601 ...       파일 이름에 태그를 쓴다(CI)
//
// 빌드 결과(out/)는 electron-vite 가 만든다. 원본 DrawPen 은 Electron Forge 로 묶었다.
const isRelease = process.env.DRAW_RELEASE === '1'
const tag = process.env.DRAW_TAG || '${version}'

// Why: Windows 파일 버전은 칸마다 65535 까지인 숫자 네 칸이라 2.6.110601 을 2.6.1106.1 로 적는다(version-parts.cjs).
const { versionParts } = require('./version-parts.cjs')
const { shown: shownVersion, file: buildVersion } = versionParts(require('./package.json').version)

/** @type {import('electron-builder').Configuration} */
module.exports = {
  appId: 'im.runners.draw',
  productName: 'Draw',
  buildVersion,
  copyright: '© 2026 RUNNERS. All rights reserved.',
  directories: { output: 'dist.noindex', buildResources: 'build' },
  // Why: 화면 코드(React · 아이콘)는 electron-vite 가 out/ 에 묶었으므로 앱의 node_modules 에서는 뺀다.
  files: [
    'out/**',
    'package.json',
    '!**/*.map',
    '!node_modules/{react,react-dom,react-i18next,html-parse-stringify,void-elements,use-sync-external-store,scheduler,lucide-react,react-icons,lazy-brush,perfect-freehand,ntcjs,lodash}/**'
  ],
  // Why: 원본 DrawPen 의 MIT 라이선스는 사본에 함께 넣어야 한다. THIRD_PARTY_NOTICES.md 맨 앞에 그 전문이 있다.
  extraResources: [{ from: 'THIRD_PARTY_NOTICES.md', to: 'THIRD_PARTY_NOTICES.md' }],
  npmRebuild: false,
  mac: {
    category: 'public.app-category.productivity',
    icon: 'build/icon.icns',
    // Why: macOS 26 은 Assets.car 의 아이콘을 읽어 어두운 모양일 때 블랙 판을 보인다. 그 전 macOS 는 icon.icns 를 읽는다.
    // Assets.car 는 build/icon-source/generate.sh 가 만들어 저장소에 둔다(CI 맥에 Xcode 26 이 없어도 되게).
    extraResources: [{ from: 'build/Assets.car', to: 'Assets.car' }],
    target: [
      { target: 'dmg', arch: ['arm64', 'x64'] },
      { target: 'zip', arch: ['arm64', 'x64'] }
    ],
    artifactName: `Draw-${tag}-mac-\${arch}.\${ext}`,
    hardenedRuntime: isRelease,
    notarize: isRelease,
    // Why: 이 맥에서 만든 판은 Developer ID 로 서명하지 않고 임시 서명만 해서 이 맥에서 열리게 한다.
    ...(isRelease ? {} : { identity: process.env.CSC_NAME ? undefined : null }),
    entitlements: 'build/entitlements.mac.plist',
    entitlementsInherit: 'build/entitlements.mac.plist',
    extendInfo: {
      // Draw 는 메뉴 막대에만 산다: Dock 아이콘 없음.
      LSUIElement: true,
      CFBundleIconName: 'icon',
      CFBundleShortVersionString: shownVersion
    }
  },
  dmg: { artifactName: `Draw-${tag}-mac-\${arch}.\${ext}` },
  // Why: 출시 빌드는 세 운영체제 모두 DRAW_RELEASE=1 로 돌지만 서명 인증서는 macOS 것만 있다.
  forceCodeSigning: isRelease && process.platform === 'darwin',
  win: {
    icon: 'build/icon.ico',
    target: [{ target: 'nsis', arch: ['x64'] }],
    artifactName: `draw-${tag}-windows-x64-setup.\${ext}`
  },
  nsis: { oneClick: true, perMachine: false },
  linux: {
    icon: 'build/icon.png',
    category: 'Graphics',
    target: ['AppImage', 'deb'],
    maintainer: 'RUNNERS',
    synopsis: 'Draw on your screen while you present'
  },
  appImage: { artifactName: `draw-${tag}-linux-x86_64.AppImage` },
  deb: { artifactName: `draw-${tag}-linux-amd64.deb` },
  // 앱 안의 electron-updater 가 읽는다(app-update.yml). 올리기는 CI 가 직접 한다(--publish never).
  publish: { provider: 'github', owner: 'RUNNERS-IM', repo: 'draw' }
}
