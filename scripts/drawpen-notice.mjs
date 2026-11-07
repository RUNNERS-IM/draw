// THIRD_PARTY_NOTICES.md 맨 앞에 DrawPen 고지를 넣는다. kit 의 third-party-notices.mjs 다음에 돈다.
// Why: Draw 는 DrawPen(MIT)을 바탕으로 만들었다. DrawPen 은 설치한 꾸러미가 아니라서 kit 스크립트의 목록에 나오지 않지만,
// MIT 저작권 고지는 앱과 함께 다녀야 한다.
import { readFileSync, writeFileSync } from 'node:fs'

const file = 'THIRD_PARTY_NOTICES.md'
const text = readFileSync(file, 'utf8')
const firstEntry = text.indexOf('\n# ')
const notice = [
  '',
  '# DrawPen',
  '',
  'License: MIT',
  '',
  'Draw is built on DrawPen by Dmytro Vasin: https://github.com/DmytroVasin/DrawPen',
  '',
  readFileSync('LICENSE', 'utf8').trim(),
  ''
].join('\n')
writeFileSync(file, `${text.slice(0, firstEntry)}${notice}${text.slice(firstEntry)}`)
