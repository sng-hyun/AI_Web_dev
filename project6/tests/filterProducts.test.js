import assert from 'node:assert/strict'
import test from 'node:test'

import { mockProducts } from '../src/data/mockProducts.js'
import {
  filterProducts,
  getProductCategories,
} from '../src/utils/filterProducts.js'

const products = [
  {
    id: 1,
    name: 'Blue Cotton Shirt',
    price: 20,
    image: '/shirt.png',
    category: 'clothing',
    description: '숨겨진 검색 문구',
  },
  {
    id: 2,
    name: 'Desk Lamp',
    price: 30,
    image: '/lamp.png',
    category: 'electronics',
    description: '밝은 조명',
  },
  {
    id: 3,
    name: 'Black Cotton Jacket',
    price: 50,
    image: '/jacket.png',
    category: 'clothing',
    description: '가벼운 재킷',
  },
]

test('category 중복을 제거한다', () => {
  assert.deepEqual(getProductCategories(products), ['clothing', 'electronics'])
})

test('category를 일관된 순서로 정렬하고 all은 추가하지 않는다', () => {
  const categories = getProductCategories([
    { category: 'zeta' },
    { category: 'alpha' },
  ])

  assert.deepEqual(categories, ['alpha', 'zeta'])
  assert.equal(categories.includes('all'), false)
})

test('category 파생 시 원본 배열 순서와 객체를 변경하지 않는다', () => {
  const snapshot = structuredClone(products)

  getProductCategories(products)

  assert.deepEqual(products, snapshot)
})

test('빈 검색어이면 새로운 전체 상품 배열을 반환한다', () => {
  const result = filterProducts(products, '', 'all')

  assert.deepEqual(result, products)
  assert.notStrictEqual(result, products)
})

test('검색어 앞뒤 공백을 무시한다', () => {
  assert.deepEqual(
    filterProducts(products, '  Desk Lamp  ', 'all').map(({ id }) => id),
    [2],
  )
})

test('상품명을 대소문자 구분 없이 검색한다', () => {
  assert.deepEqual(
    filterProducts(products, 'cOtToN', 'all').map(({ id }) => id),
    [1, 3],
  )
})

test('description에만 존재하는 문구는 검색하지 않는다', () => {
  assert.deepEqual(filterProducts(products, '숨겨진 검색 문구', 'all'), [])
})

test('all category이면 모든 상품을 반환한다', () => {
  assert.equal(filterProducts(products, '', 'all').length, products.length)
})

test('특정 category와 정확히 일치하는 상품만 반환한다', () => {
  assert.deepEqual(
    filterProducts(products, '', 'electronics').map(({ id }) => id),
    [2],
  )
})

test('검색과 category 조건을 동시에 적용한다', () => {
  assert.deepEqual(
    filterProducts(products, 'black', 'clothing').map(({ id }) => id),
    [3],
  )
})

test('조건에 맞지 않으면 빈 배열을 반환한다', () => {
  assert.deepEqual(filterProducts(products, 'missing', 'electronics'), [])
})

test('API형 Product와 mock Product에 같은 함수를 사용한다', () => {
  assert.equal(filterProducts(products, 'lamp', 'electronics').length, 1)
  assert.equal(filterProducts(mockProducts, '스피커', 'electronics').length, 1)
})

test('잘못된 배열 입력은 안전하게 빈 배열로 처리한다', () => {
  assert.deepEqual(getProductCategories(null), [])
  assert.deepEqual(filterProducts({}, '', 'all'), [])
})

test('필터링 과정에서 원본 배열과 Product 객체를 변경하지 않는다', () => {
  const snapshot = structuredClone(products)

  filterProducts(products, 'cotton', 'clothing')

  assert.deepEqual(products, snapshot)
})
