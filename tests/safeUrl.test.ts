import { test } from 'vitest';
import assert from 'node:assert/strict';
import { safeUrl } from '../src/shared/safeUrl';

test('https 주소는 앞뒤 공백만 빼고 그대로 돌려준다', () => {
  assert.equal(safeUrl(' https://runners.im/split '), 'https://runners.im/split');
});

test('https 가 아닌 주소와 빈 값은 빈 문자열이 된다', () => {
  for (const value of ['http://runners.im', 'file:///etc/passwd', 'javascript:alert(1)', '', '   ', 'runners.im', null, undefined]) {
    assert.equal(safeUrl(value), '');
  }
});
