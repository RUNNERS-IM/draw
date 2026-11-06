import assert from 'node:assert'
import { test } from 'vitest'
import { loginItemsAllowed } from '../src/main/loginItems'

const released = { isLinux: false, isPackaged: true, isTestBuild: false }

test('출시판만 로그인 항목을 쓴다', () => {
  assert.equal(loginItemsAllowed(released), true)
})

test('개발 실행 · 시험판 · 리눅스는 로그인 항목을 건드리지 않는다', () => {
  assert.equal(loginItemsAllowed({ ...released, isPackaged: false }), false)
  assert.equal(loginItemsAllowed({ ...released, isTestBuild: true }), false)
  assert.equal(loginItemsAllowed({ ...released, isLinux: true }), false)
})
