import assert from 'node:assert/strict'
import test from 'node:test'

import { formatUsdPrice } from '../src/utils/formatCurrency.js'

test('USD 가격을 두 자리 소수 통화 형식으로 표시한다', () => {
  assert.equal(formatUsdPrice(109.95), '$109.95')
})

test('0을 $0.00으로 표시하고 원본 값을 변경하지 않는다', () => {
  const price = 0

  assert.equal(formatUsdPrice(price), '$0.00')
  assert.equal(price, 0)
})
