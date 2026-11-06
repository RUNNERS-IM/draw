// THIRD_PARTY_NOTICES.md 를 만든다: Draw 안에 들어가는 모든 오픈소스 패키지의 라이선스 고지.
// Why: Draw 는 DrawPen(MIT)을 바탕으로 만들었고 여러 패키지를 함께 싣는다. 이들의 고지는 앱과 함께 다녀야 하므로
// 정보 창의 「오픈소스 고지」가 이 파일을 보여 준다. 의존성을 바꾼 뒤 다시 돌린다: node scripts/third-party-notices.mjs
import { existsSync, readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const root = join(import.meta.dirname, '..')
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))

/** 패키지 폴더에서 위로 올라가며 node_modules/<이름> 을 찾는다. npm · pnpm 어느 쪽 배치에서도 찾을 수 있다. */
function findPackage(name, from) {
  for (let dir = from; ; dir = dirname(dir)) {
    const candidate = join(dir, 'node_modules', name)
    if (existsSync(join(candidate, 'package.json'))) {
      return realpathSync(candidate)
    }
    if (dir === dirname(dir)) {
      return null
    }
  }
}

function licenseText(dir) {
  const file = readdirSync(dir).find((f) => /^(licen[cs]e|copying|notice)/i.test(f))
  return file ? readFileSync(join(dir, file), 'utf8').trim() : null
}

function licenseName(pkg) {
  if (typeof pkg.license === 'string') {
    return pkg.license
  }
  return pkg.license?.type ?? 'see file'
}

// 실행 때 쓰는 의존성만 따라간다(빌드 도구는 앱에 실리지 않는다).
const seen = new Set()
const packages = new Map()
const queue = Object.keys(readJson(join(root, 'package.json')).dependencies ?? {}).map((name) => [
  name,
  root
])
while (queue.length) {
  const [name, from] = queue.pop()
  const dir = findPackage(name, from)
  if (!dir || seen.has(dir)) {
    continue
  }
  const pkg = readJson(join(dir, 'package.json'))
  seen.add(dir)
  packages.set(`${pkg.name}@${pkg.version}`, {
    name: pkg.name,
    version: pkg.version,
    license: licenseName(pkg),
    text: licenseText(dir)
  })
  for (const dep of Object.keys(pkg.dependencies ?? {})) {
    queue.push([dep, dir])
  }
}
const entries = [...packages.values()]

// Why: 앱의 실행 환경인 Electron 은 package.json 에서 빌드 도구로 적혀 있지만 electron-builder 가 앱에 넣어 준다.
const electronDir = findPackage('electron', root)
const electron = readJson(join(electronDir, 'package.json'))
entries.push({
  name: 'electron',
  version: electron.version,
  license: electron.license,
  text:
    `${licenseText(
      electronDir
    )}\n\nElectron includes Chromium and other open source software; their notices are in LICENSES.chromium.html, ` +
    `published with Electron ${electron.version} at https://github.com/electron/electron/releases/tag/v${electron.version}.`
})

entries.sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version))

const parts = [
  '# Third-Party Notices',
  '',
  'Draw includes software from the projects below. Their copyright and license notices follow.',
  '',
  '# DrawPen',
  '',
  'License: MIT',
  'Draw is built on DrawPen by Dmytro Vasin: https://github.com/DmytroVasin/DrawPen',
  '',
  readFileSync(join(root, 'LICENSE'), 'utf8').trim()
]
for (const e of entries) {
  parts.push('', `# ${e.name} ${e.version}`, '', `License: ${e.license}`)
  if (e.text) {
    parts.push('', e.text)
  }
  // Why: 라이선스 파일을 싣지 않은 패키지는 그 내용과 원본이 올라간 곳을 대신 적는다.
  else {
    parts.push(
      '',
      `The package ships no license file. Its license text and source are at https://www.npmjs.com/package/${e.name}/v/${e.version}.`
    )
  }
}
writeFileSync(join(root, 'THIRD_PARTY_NOTICES.md'), `${parts.join('\n')}\n`)
console.log(`패키지 ${entries.length}개를 THIRD_PARTY_NOTICES.md 에 적었습니다`)
