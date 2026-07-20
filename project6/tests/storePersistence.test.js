import assert from 'node:assert/strict'
import test from 'node:test'

import { createAppStore } from '../src/app/store.js'
import {
  addToCart,
  clearCart,
  increaseQuantity,
  removeFromCart,
} from '../src/features/cart/cartSlice.js'
import { CART_STORAGE_KEY } from '../src/utils/cartStorage.js'

const firstProduct = {
  id: 1,
  name: '첫 번째 상품',
  price: 10,
  image: '/first.png',
  category: 'home',
  description: '설명',
}

const secondProduct = {
  id: 2,
  name: '두 번째 상품',
  price: 5,
  image: '/second.png',
  category: 'electronics',
  description: '설명',
}

function createMemoryStorage(initialItems, { throwOnSet = false } = {}) {
  let value = initialItems === undefined ? null : JSON.stringify(initialItems)

  return {
    setCalls: 0,
    getItem(key) {
      assert.equal(key, CART_STORAGE_KEY)
      return value
    },
    setItem(key, nextValue) {
      assert.equal(key, CART_STORAGE_KEY)
      this.setCalls += 1
      if (throwOnSet) throw new Error('quota')
      value = nextValue
    },
    read() {
      return value === null ? null : JSON.parse(value)
    },
  }
}

function createStoreForTest(t, storage) {
  const app = createAppStore(storage)
  t.after(app.unsubscribe)
  return app.store
}

test('저장된 items로 초기 store를 복원한다', (t) => {
  const storage = createMemoryStorage([{ ...firstProduct, quantity: 2 }])
  const store = createStoreForTest(t, storage)

  assert.equal(store.getState().cart.items[0].quantity, 2)
})

test('복원 시 잘못된 항목을 제외한다', (t) => {
  const storage = createMemoryStorage([
    { ...firstProduct, quantity: 2 },
    { ...secondProduct, name: '', quantity: 1 },
  ])
  const store = createStoreForTest(t, storage)

  assert.deepEqual(store.getState().cart.items.map(({ id }) => id), [1])
})

test('복원 시 quantity를 1~99로 보정한다', (t) => {
  const storage = createMemoryStorage([
    { ...firstProduct, id: 'high', quantity: 999 },
    { ...firstProduct, id: 'low', quantity: 0 },
    { ...firstProduct, id: 'invalid', quantity: 'two' },
  ])
  const store = createStoreForTest(t, storage)

  assert.deepEqual(
    store.getState().cart.items.map(({ quantity }) => quantity),
    [99, 1, 1],
  )
})

test('복원 시 중복 id를 병합하고 수량을 99로 제한한다', (t) => {
  const storage = createMemoryStorage([
    { ...firstProduct, quantity: 60 },
    { ...firstProduct, quantity: 60 },
  ])
  const store = createStoreForTest(t, storage)

  assert.equal(store.getState().cart.items.length, 1)
  assert.equal(store.getState().cart.items[0].quantity, 99)
})

test('addToCart 후 storage를 저장한다', (t) => {
  const storage = createMemoryStorage()
  const store = createStoreForTest(t, storage)

  store.dispatch(addToCart(firstProduct))

  assert.equal(storage.read()[0].quantity, 1)
})

test('increaseQuantity 후 storage를 갱신한다', (t) => {
  const storage = createMemoryStorage([{ ...firstProduct, quantity: 1 }])
  const store = createStoreForTest(t, storage)

  store.dispatch(increaseQuantity(firstProduct.id))

  assert.equal(storage.read()[0].quantity, 2)
})

test('removeFromCart 후 storage를 갱신한다', (t) => {
  const storage = createMemoryStorage([
    { ...firstProduct, quantity: 1 },
    { ...secondProduct, quantity: 1 },
  ])
  const store = createStoreForTest(t, storage)

  store.dispatch(removeFromCart(firstProduct.id))

  assert.deepEqual(storage.read().map(({ id }) => id), [2])
})

test('clearCart 후 빈 배열을 저장한다', (t) => {
  const storage = createMemoryStorage([{ ...firstProduct, quantity: 1 }])
  const store = createStoreForTest(t, storage)

  store.dispatch(clearCart())

  assert.deepEqual(storage.read(), [])
})

test('store를 새로 생성하면 이전 cart를 복원한다', (t) => {
  const storage = createMemoryStorage()
  const firstApp = createAppStore(storage)
  firstApp.store.dispatch(addToCart(firstProduct))
  firstApp.store.dispatch(increaseQuantity(firstProduct.id))
  firstApp.unsubscribe()

  const secondStore = createStoreForTest(t, storage)

  assert.equal(secondStore.getState().cart.items[0].quantity, 2)
})

test('저장 실패가 dispatch를 중단하지 않는다', (t) => {
  const storage = createMemoryStorage(undefined, { throwOnSet: true })
  const store = createStoreForTest(t, storage)

  assert.doesNotThrow(() => store.dispatch(addToCart(firstProduct)))
  assert.equal(store.getState().cart.items.length, 1)
})

test('Redux 전체 state가 아닌 cart items 배열만 저장된다', (t) => {
  const storage = createMemoryStorage()
  const store = createStoreForTest(t, storage)

  store.dispatch(addToCart(firstProduct))

  assert.equal(Array.isArray(storage.read()), true)
  assert.equal('cart' in storage.read(), false)
})

test('cart items 참조가 같으면 불필요하게 저장하지 않는다', (t) => {
  const storage = createMemoryStorage()
  const store = createStoreForTest(t, storage)

  store.dispatch({ type: 'future/unchanged' })

  assert.equal(storage.setCalls, 0)
})
