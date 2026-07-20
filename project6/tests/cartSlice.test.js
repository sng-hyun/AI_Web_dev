import assert from 'node:assert/strict'
import test from 'node:test'

import cartReducer, {
  MAX_CART_QUANTITY,
  addToCart,
  clearCart,
  decreaseQuantity,
  increaseQuantity,
  removeFromCart,
  restoreCart,
  selectCartItems,
  selectCartQuantityByProductId,
  selectCartTotal,
  selectCartTotalQuantity,
  selectIsCartEmpty,
} from '../src/features/cart/cartSlice.js'

const firstProduct = {
  id: 1,
  name: '첫 번째 상품',
  price: 10.25,
  image: '/first.png',
  category: 'home',
  description: '설명',
}

const secondProduct = {
  id: 2,
  name: '두 번째 상품',
  price: 4.5,
  image: '/second.png',
  category: 'electronics',
  description: '설명',
}

function initialCartState() {
  return cartReducer(undefined, { type: 'test/init' })
}

function addProducts(...products) {
  return products.reduce(
    (state, product) => cartReducer(state, addToCart(product)),
    initialCartState(),
  )
}

function rootState(cart) {
  return { cart }
}

test('초기 items는 빈 배열이다', () => {
  assert.deepEqual(initialCartState(), { items: [] })
})

test('새 상품을 quantity 1로 담는다', () => {
  const state = addProducts(firstProduct)

  assert.equal(state.items.length, 1)
  assert.equal(state.items[0].quantity, 1)
})

test('CartItem에는 허용된 5개 필드만 저장한다', () => {
  const state = addProducts(firstProduct)

  assert.deepEqual(Object.keys(state.items[0]), [
    'id',
    'name',
    'price',
    'image',
    'quantity',
  ])
})

test('동일 상품을 다시 담으면 quantity가 증가한다', () => {
  const state = addProducts(firstProduct, firstProduct)

  assert.equal(state.items[0].quantity, 2)
})

test('동일 상품을 다시 담아도 새 행이 생기지 않는다', () => {
  const state = addProducts(firstProduct, firstProduct)

  assert.equal(state.items.length, 1)
})

test('중복 담기에서 기존 name, price, image를 유지한다', () => {
  let state = addProducts(firstProduct)
  state = cartReducer(
    state,
    addToCart({
      ...firstProduct,
      name: '변경된 이름',
      price: 999,
      image: '/changed.png',
    }),
  )

  assert.deepEqual(state.items[0], {
    id: 1,
    name: firstProduct.name,
    price: firstProduct.price,
    image: firstProduct.image,
    quantity: 2,
  })
})

test('addToCart는 quantity 99를 초과하지 않는다', () => {
  let state = cartReducer(
    undefined,
    restoreCart([{ ...firstProduct, quantity: MAX_CART_QUANTITY }]),
  )

  state = cartReducer(state, addToCart(firstProduct))

  assert.equal(state.items[0].quantity, MAX_CART_QUANTITY)
})

test('유효하지 않은 product payload를 무시한다', () => {
  const invalidProducts = [
    null,
    {},
    { ...firstProduct, id: null },
    { ...firstProduct, name: ' ' },
    { ...firstProduct, price: -1 },
    { ...firstProduct, price: '10.25' },
    { ...firstProduct, image: '' },
  ]
  const state = invalidProducts.reduce(
    (currentState, product) =>
      cartReducer(currentState, addToCart(product)),
    initialCartState(),
  )

  assert.deepEqual(state.items, [])
})

test('increaseQuantity가 해당 상품 수량을 증가시킨다', () => {
  const state = cartReducer(addProducts(firstProduct), increaseQuantity(1))

  assert.equal(state.items[0].quantity, 2)
})

test('increaseQuantity는 99에서 no-op이다', () => {
  const state = cartReducer(
    undefined,
    restoreCart([{ ...firstProduct, quantity: 99 }]),
  )
  const nextState = cartReducer(state, increaseQuantity(1))

  assert.strictEqual(nextState, state)
})

test('존재하지 않는 id 증가는 no-op이다', () => {
  const state = addProducts(firstProduct)
  const nextState = cartReducer(state, increaseQuantity('missing'))

  assert.strictEqual(nextState, state)
})

test('decreaseQuantity가 해당 상품 수량을 감소시킨다', () => {
  let state = addProducts(firstProduct, firstProduct)
  state = cartReducer(state, decreaseQuantity(1))

  assert.equal(state.items[0].quantity, 1)
})

test('decreaseQuantity는 quantity 1을 유지한다', () => {
  const state = addProducts(firstProduct)
  const nextState = cartReducer(state, decreaseQuantity(1))

  assert.strictEqual(nextState, state)
})

test('decreaseQuantity는 quantity 1에서 상품을 삭제하지 않는다', () => {
  const state = cartReducer(addProducts(firstProduct), decreaseQuantity(1))

  assert.equal(state.items.length, 1)
})

test('개별 삭제 후 다른 항목은 유지한다', () => {
  const state = cartReducer(
    addProducts(firstProduct, secondProduct),
    removeFromCart(1),
  )

  assert.deepEqual(state.items.map(({ id }) => id), [2])
})

test('존재하지 않는 id 삭제는 no-op이다', () => {
  const state = addProducts(firstProduct)
  const nextState = cartReducer(state, removeFromCart('missing'))

  assert.strictEqual(nextState, state)
})

test('clearCart가 모든 항목을 제거한다', () => {
  const state = cartReducer(
    addProducts(firstProduct, secondProduct),
    clearCart(),
  )

  assert.deepEqual(state.items, [])
})

test('restoreCart가 정상 CartItem 배열을 복원한다', () => {
  const state = cartReducer(
    undefined,
    restoreCart([{ ...firstProduct, quantity: 3 }]),
  )

  assert.deepEqual(state.items[0], {
    id: firstProduct.id,
    name: firstProduct.name,
    price: firstProduct.price,
    image: firstProduct.image,
    quantity: 3,
  })
})

test('restoreCart payload가 배열이 아니면 빈 배열로 복원한다', () => {
  const state = cartReducer(addProducts(firstProduct), restoreCart(null))

  assert.deepEqual(state.items, [])
})

test('restoreCart는 잘못된 항목을 제외한다', () => {
  const state = cartReducer(
    undefined,
    restoreCart([
      { ...firstProduct, quantity: 2 },
      { ...secondProduct, name: '' },
    ]),
  )

  assert.deepEqual(state.items.map(({ id }) => id), [1])
})

test('restoreCart는 잘못된 quantity를 1로 보정한다', () => {
  const state = cartReducer(
    undefined,
    restoreCart([{ ...firstProduct, quantity: '3' }]),
  )

  assert.equal(state.items[0].quantity, 1)
})

test('restoreCart는 1 미만 quantity를 1로 보정한다', () => {
  const state = cartReducer(
    undefined,
    restoreCart([{ ...firstProduct, quantity: 0 }]),
  )

  assert.equal(state.items[0].quantity, 1)
})

test('restoreCart는 99 초과 quantity를 99로 보정한다', () => {
  const state = cartReducer(
    undefined,
    restoreCart([{ ...firstProduct, quantity: 100 }]),
  )

  assert.equal(state.items[0].quantity, 99)
})

test('restoreCart는 소수 quantity를 정수로 보정한다', () => {
  const state = cartReducer(
    undefined,
    restoreCart([{ ...firstProduct, quantity: 4.9 }]),
  )

  assert.equal(state.items[0].quantity, 4)
})

test('restoreCart는 중복 id를 한 행으로 병합한다', () => {
  const state = cartReducer(
    undefined,
    restoreCart([
      { ...firstProduct, quantity: 2 },
      { ...firstProduct, quantity: 3 },
    ]),
  )

  assert.equal(state.items.length, 1)
  assert.equal(state.items[0].quantity, 5)
})

test('restoreCart 중복 quantity 합은 99를 넘지 않는다', () => {
  const state = cartReducer(
    undefined,
    restoreCart([
      { ...firstProduct, quantity: 60 },
      { ...firstProduct, quantity: 60 },
    ]),
  )

  assert.equal(state.items[0].quantity, 99)
})

test('restoreCart는 원본 payload를 변경하지 않는다', () => {
  const payload = [{ ...firstProduct, quantity: 2 }]
  const snapshot = structuredClone(payload)

  cartReducer(undefined, restoreCart(payload))

  assert.deepEqual(payload, snapshot)
})

test('selectCartItems가 items를 반환한다', () => {
  const cart = addProducts(firstProduct)

  assert.strictEqual(selectCartItems(rootState(cart)), cart.items)
})

test('selectCartTotal이 price × quantity 합계를 계산한다', () => {
  const cart = cartReducer(
    undefined,
    restoreCart([
      { ...firstProduct, quantity: 2 },
      { ...secondProduct, quantity: 3 },
    ]),
  )
  const expectedTotal = firstProduct.price * 2 + secondProduct.price * 3

  assert.ok(Math.abs(selectCartTotal(rootState(cart)) - expectedTotal) < 1e-10)
})

test('빈 장바구니 total은 숫자 0이다', () => {
  assert.equal(selectCartTotal(rootState(initialCartState())), 0)
})

test('selectCartTotalQuantity가 상품 전체 수량 합계를 반환한다', () => {
  const cart = cartReducer(
    undefined,
    restoreCart([
      { ...firstProduct, quantity: 2 },
      { ...secondProduct, quantity: 3 },
    ]),
  )

  assert.equal(selectCartTotalQuantity(rootState(cart)), 5)
})

test('selectIsCartEmpty가 빈 여부를 반환한다', () => {
  assert.equal(selectIsCartEmpty(rootState(initialCartState())), true)
  assert.equal(selectIsCartEmpty(rootState(addProducts(firstProduct))), false)
})

test('selectCartQuantityByProductId가 수량 또는 0을 반환한다', () => {
  const cart = cartReducer(
    undefined,
    restoreCart([{ ...firstProduct, quantity: 7 }]),
  )

  assert.equal(selectCartQuantityByProductId(rootState(cart), 1), 7)
  assert.equal(selectCartQuantityByProductId(rootState(cart), 'missing'), 0)
})

test('reducer는 기존 state를 직접 변경하지 않는다', () => {
  const item = Object.freeze({
    id: 1,
    name: firstProduct.name,
    price: firstProduct.price,
    image: firstProduct.image,
    quantity: 1,
  })
  const state = Object.freeze({ items: Object.freeze([item]) })

  const nextState = cartReducer(state, increaseQuantity(1))

  assert.equal(state.items[0].quantity, 1)
  assert.equal(nextState.items[0].quantity, 2)
  assert.notStrictEqual(nextState, state)
})

test('restoreCart 중복 id는 첫 번째 유효 항목의 메타데이터를 유지한다', () => {
  const state = cartReducer(
    undefined,
    restoreCart([
      { ...firstProduct, quantity: 1 },
      {
        ...firstProduct,
        name: '변경 이름',
        price: 999,
        image: '/changed.png',
        quantity: 1,
      },
    ]),
  )

  assert.equal(state.items[0].name, firstProduct.name)
  assert.equal(state.items[0].price, firstProduct.price)
  assert.equal(state.items[0].image, firstProduct.image)
})
