// THIRD_PARTY_NOTICES.md 맨 앞에 DrawPen 고지를 넣는다. kit 의 third-party-notices.mjs 다음에 돈다.
// Why: Draw 는 DrawPen(MIT)을 바탕으로 만들었다. DrawPen 은 설치한 꾸러미가 아니라서 kit 스크립트의 목록에 나오지 않지만,
// MIT 저작권 고지는 앱과 함께 다녀야 한다. 저장소 LICENSE.md 는 RUNNERS 글이라(2026-11-07 결정 1A) 원본 글을 여기에 둔다.
import { readFileSync, writeFileSync } from 'node:fs'

const file = 'THIRD_PARTY_NOTICES.md'
const drawPenLicense = `MIT License

Copyright (c) 2024 Dmytro Vasin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`
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
  drawPenLicense,
  ''
].join('\n')
writeFileSync(file, `${text.slice(0, firstEntry)}${notice}${text.slice(firstEntry)}`)
