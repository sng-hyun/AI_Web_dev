import assert from 'node:assert/strict'
import test from 'node:test'

import cartReducer, { restoreCart } from '../src/features/cart/cartSlice.js'
import {
  CART_STORAGE_KEY,
  loadCartFromStorage,
  saveCartToStorage,
} from '../src/utils/cartStorage.js'

const item = {
  id: 1,
  name: '테스트 상품',
  price: 12.5,
  image: '/product.png',
  quantity: 2,
}

function createMemoryStorage(initialValue = null) {
  let value = initialValue

  return {
    getItem(key) {
      assert.equal(key, CART_STORAGE_KEY)
      return value
    },
    setItem(key, nextValue) {
      assert.equal(key, CART_STORAGE_KEY)
      value = nextValue
    },
    read() {
      return value
    },
  }
}

test('CART_STORAGE_KEY는 project6.cart.v1이다', () => {
  assert.equal(CART_STORAGE_KEY, 'project6.cart.v1')
})

test('저장값이 없으면 빈 배열을 반환한다', () => {
  assert.deepEqual(loadCartFromStorage(createMemoryStorage()), [])
})

test('정상 JSON 배열을 읽는다', () => {
  const storage = createMemoryStorage(JSON.stringify([item]))

  assert.deepEqual(loadCartFromStorage(storage), [item])
})

test('손상된 JSON이면 빈 배열을 반환한다', () => {
  assert.deepEqual(loadCartFromStorage(createMemoryStorage('{broken')), [])
})

test('배열이 아닌 JSON은 restoreCart에서 빈 cart로 정제된다', () => {
  const storage = createMemoryStorage(JSON.stringify({ items: [item] }))
  const state = cartReducer(undefined, restoreCart(loadCartFromStorage(storage)))

  assert.deepEqual(state.items, [])
})

test('storage가 없으면 빈 배열을 반환한다', () => {
  assert.deepEqual(loadCartFromStorage(null), [])
})

test('localStorage getter가 throw해도 기본 읽기와 쓰기가 안전하다', (t) => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const throwingWindow = {}
  Object.defineProperty(throwingWindow, 'localStorage', {
    get() {
      throw new Error('access denied')
    },
  })
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: throwingWindow,
  })
  t.after(() => {
    if (previousWindow) {
      Object.defineProperty(globalThis, 'window', previousWindow)
    } else {
      delete globalThis.window
    }
  })

  assert.deepEqual(loadCartFromStorage(), [])
  assert.equal(saveCartToStorage([item]), false)
})

test('getItem이 throw해도 빈 배열을 반환한다', () => {
  const storage = { getItem: () => { throw new Error('denied') } }

  assert.deepEqual(loadCartFromStorage(storage), [])
})

test('정상 cart items를 저장한다', () => {
  const storage = createMemoryStorage()

  assert.equal(saveCartToStorage([item], storage), true)
  assert.deepEqual(JSON.parse(storage.read()), [item])
})

test('저장 JSON에는 CartItem의 5개 필드만 포함한다', () => {
  const storage = createMemoryStorage()
  saveCartToStorage(
    [{ ...item, category: 'home', description: '설명', email: 'hidden' }],
    storage,
  )

  assert.deepEqual(Object.keys(JSON.parse(storage.read())[0]), [
    'id',
    'name',
    'price',
    'image',
    'quantity',
  ])
})

test('total과 totalQuantity를 저장하지 않는다', () => {
  const storage = createMemoryStorage()
  saveCartToStorage([{ ...item, total: 25, totalQuantity: 2 }], storage)
  const savedItem = JSON.parse(storage.read())[0]

  assert.equal('total' in savedItem, false)
  assert.equal('totalQuantity' in savedItem, false)
})

test('email, uid, token을 저장하지 않는다', () => {
  const storage = createMemoryStorage()
  saveCartToStorage(
    [{ ...item, email: 'private@example.com', uid: 'uid', token: 'token' }],
    storage,
  )
  const savedItem = JSON.parse(storage.read())[0]

  assert.equal('email' in savedItem, false)
  assert.equal('uid' in savedItem, false)
  assert.equal('token' in savedItem, false)
})

test('setItem이 throw해도 오류를 전파하지 않는다', () => {
  const storage = { setItem: () => { throw new Error('quota') } }

  assert.equal(saveCartToStorage([item], storage), false)
})

test('stringify가 실패해도 오류를 전파하지 않는다', () => {
  const storage = createMemoryStorage()

  assert.equal(saveCartToStorage([{ ...item, id: 1n }], storage), false)
})

test('저장 과정에서 입력 items를 변경하지 않는다', () => {
  const storage = createMemoryStorage()
  const items = [{ ...item, category: 'home' }]
  const snapshot = structuredClone(items)

  saveCartToStorage(items, storage)

  assert.deepEqual(items, snapshot)
})
