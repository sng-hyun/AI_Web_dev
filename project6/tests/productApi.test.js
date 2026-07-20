import assert from 'node:assert/strict'
import test from 'node:test'

import { mockProducts } from '../src/data/mockProducts.js'
import {
  PRODUCTS_ENDPOINT,
  PRODUCT_ERROR_CODES,
  PRODUCT_PLACEHOLDER_IMAGE,
  ProductApiError,
  fetchProducts,
  normalizeProduct,
  normalizeProducts,
} from '../src/services/productApi.js'

const validRawProduct = {
  id: 1,
  title: '  기본 상품  ',
  price: 12.5,
  image: '  https://example.test/product.png  ',
  category: '  home  ',
  description: '  상품 설명  ',
}

function assertInvalidResponse(callback) {
  assert.throws(callback, (error) => {
    assert.ok(error instanceof ProductApiError)
    assert.equal(error.code, PRODUCT_ERROR_CODES.INVALID_RESPONSE)
    return true
  })
}

test('정상 API 상품을 내부 Product 구조로 변환한다', () => {
  assert.deepEqual(normalizeProduct(validRawProduct), {
    id: 1,
    name: '기본 상품',
    price: 12.5,
    image: 'https://example.test/product.png',
    category: 'home',
    description: '상품 설명',
  })
})

test('정규화 과정에서 원본 객체를 변경하지 않는다', () => {
  const rawProduct = structuredClone(validRawProduct)
  const snapshot = structuredClone(rawProduct)

  const normalizedProduct = normalizeProduct(rawProduct)

  assert.deepEqual(rawProduct, snapshot)
  assert.notStrictEqual(normalizedProduct, rawProduct)
})

test('문자열 price를 number로 변환한다', () => {
  const product = normalizeProduct({ ...validRawProduct, price: '19.95' })

  assert.equal(product.price, 19.95)
  assert.equal(typeof product.price, 'number')
})

test('title이 없으면 기본 상품명을 사용한다', () => {
  assert.equal(
    normalizeProduct({ ...validRawProduct, title: undefined }).name,
    '이름 없는 상품',
  )
})

test('category가 없으면 uncategorized를 사용한다', () => {
  assert.equal(
    normalizeProduct({ ...validRawProduct, category: undefined }).category,
    'uncategorized',
  )
})

test('description이 없으면 빈 문자열을 사용한다', () => {
  assert.equal(
    normalizeProduct({ ...validRawProduct, description: undefined }).description,
    '',
  )
})

test('image가 없으면 로컬 placeholder를 사용한다', () => {
  assert.equal(
    normalizeProduct({ ...validRawProduct, image: '  ' }).image,
    PRODUCT_PLACEHOLDER_IMAGE,
  )
})

test('유효하지 않은 id를 INVALID_RESPONSE로 거부한다', () => {
  for (const id of [null, undefined, Number.NaN, Number.POSITIVE_INFINITY, '', {}, []]) {
    assertInvalidResponse(() => normalizeProduct({ ...validRawProduct, id }))
  }
})

test('음수 price를 INVALID_RESPONSE로 거부한다', () => {
  assertInvalidResponse(() =>
    normalizeProduct({ ...validRawProduct, price: -0.01 }),
  )
})

test('숫자가 아닌 price를 INVALID_RESPONSE로 거부한다', () => {
  for (const price of ['not-a-number', '', null, {}, []]) {
    assertInvalidResponse(() => normalizeProduct({ ...validRawProduct, price }))
  }
})

test('배열이 아닌 전체 응답을 INVALID_RESPONSE로 거부한다', () => {
  assertInvalidResponse(() => normalizeProducts({ products: [] }))
})

test('빈 배열은 정상 결과로 반환한다', () => {
  assert.deepEqual(normalizeProducts([]), [])
})

test('중복 id가 있으면 INVALID_RESPONSE로 거부한다', () => {
  assertInvalidResponse(() =>
    normalizeProducts([
      validRawProduct,
      { ...validRawProduct, title: '다른 상품' },
    ]),
  )
})

test('fetch 성공 응답을 내부 Product 배열로 정규화한다', async () => {
  const fetchImpl = async (url, options) => {
    assert.equal(url, PRODUCTS_ENDPOINT)
    assert.equal(options.method, 'GET')
    return {
      ok: true,
      status: 200,
      json: async () => [validRawProduct],
    }
  }

  const products = await fetchProducts({ fetchImpl })

  assert.equal(products.length, 1)
  assert.deepEqual(Object.keys(products[0]), [
    'id',
    'name',
    'price',
    'image',
    'category',
    'description',
  ])
})

test('HTTP 실패를 HTTP_ERROR와 status로 분류한다', async () => {
  const fetchImpl = async () => ({ ok: false, status: 503 })

  await assert.rejects(fetchProducts({ fetchImpl }), (error) => {
    assert.equal(error.code, PRODUCT_ERROR_CODES.HTTP_ERROR)
    assert.equal(error.status, 503)
    return true
  })
})

test('JSON 파싱 실패를 JSON_ERROR로 분류한다', async () => {
  const cause = new SyntaxError('invalid json')
  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    json: async () => {
      throw cause
    },
  })

  await assert.rejects(fetchProducts({ fetchImpl }), (error) => {
    assert.equal(error.code, PRODUCT_ERROR_CODES.JSON_ERROR)
    assert.equal(error.cause, cause)
    return true
  })
})

test('네트워크 실패를 NETWORK_ERROR로 분류한다', async () => {
  const cause = new TypeError('network unavailable')
  const fetchImpl = async () => {
    throw cause
  }

  await assert.rejects(fetchProducts({ fetchImpl }), (error) => {
    assert.equal(error.code, PRODUCT_ERROR_CODES.NETWORK_ERROR)
    assert.equal(error.cause, cause)
    return true
  })
})

test('fetch를 사용할 수 없으면 FETCH_UNAVAILABLE로 분류한다', async () => {
  await assert.rejects(fetchProducts({ fetchImpl: null }), (error) => {
    assert.equal(error.code, PRODUCT_ERROR_CODES.FETCH_UNAVAILABLE)
    return true
  })
})

test('AbortError는 NETWORK_ERROR로 변환하지 않고 그대로 전달한다', async () => {
  const abortError = new DOMException('The request was aborted.', 'AbortError')
  const fetchImpl = async () => {
    throw abortError
  }

  await assert.rejects(fetchProducts({ fetchImpl }), (error) => {
    assert.strictEqual(error, abortError)
    assert.equal(error.name, 'AbortError')
    return true
  })
})

test('mock 상품은 내부 Product 구조를 따르고 변경할 수 없다', () => {
  const productKeys = [
    'id',
    'name',
    'price',
    'image',
    'category',
    'description',
  ]

  assert.equal(mockProducts.length, 6)
  assert.ok(Object.isFrozen(mockProducts))

  for (const product of mockProducts) {
    assert.deepEqual(Object.keys(product), productKeys)
    assert.match(product.id, /^mock-\d+$/)
    assert.equal(typeof product.price, 'number')
    assert.ok(product.price >= 0)
    assert.equal(product.image, PRODUCT_PLACEHOLDER_IMAGE)
    assert.ok(Object.isFrozen(product))
  }

  assert.equal(new Set(mockProducts.map(({ category }) => category)).size, 3)
})

test('null, 배열, 일반 객체가 아닌 단일 상품을 거부한다', () => {
  for (const rawProduct of [null, [], new Date()]) {
    assertInvalidResponse(() => normalizeProduct(rawProduct))
  }
})

test('잘못된 fetch 응답 객체를 INVALID_RESPONSE로 분류한다', async () => {
  await assert.rejects(
    fetchProducts({ fetchImpl: async () => ({ status: 200 }) }),
    (error) => {
      assert.equal(error.code, PRODUCT_ERROR_CODES.INVALID_RESPONSE)
      return true
    },
  )
})
