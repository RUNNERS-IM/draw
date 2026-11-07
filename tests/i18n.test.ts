import assert from 'node:assert'
import { test } from 'vitest'
import { pickLocale, setLocale, t } from '../src/shared/i18n'

test('언어 목록에서 표가 있는 첫 언어를 고른다', () => {
  assert.equal(pickLocale(['ko-KR', 'en-US']), 'ko')
  assert.equal(pickLocale(['de-AT']), 'de')
  assert.equal(pickLocale(['xx-XX', 'ja-JP']), 'ja')
  assert.equal(pickLocale(['xx-XX']), 'en')
  assert.equal(pickLocale([]), 'en')
})

test('중국어는 지역에 따라 간체와 번체로 나눈다', () => {
  assert.equal(pickLocale(['zh-CN']), 'zh-Hans')
  assert.equal(pickLocale(['zh-TW']), 'zh-Hant')
  assert.equal(pickLocale(['zh_HK']), 'zh-Hant')
  assert.equal(pickLocale(['zh-Hant-TW']), 'zh-Hant')
})

test('자리표시를 채우고 없는 열쇠는 그대로 돌려준다', () => {
  setLocale(['ko'])
  assert.equal(t('update.downloading', { percent: 42 }), '내려받는 중… 42%')
  assert.equal(t('about.line', { version: '1.0.0 <b>' }), 'Draw 1.0.0 <b> · 무료')
  assert.equal(t('없는.열쇠'), '없는.열쇠')
  setLocale(['fr-CA'])
  assert.equal(t('tool.eraser'), 'Gomme')
})
