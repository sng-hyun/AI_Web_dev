export const PRODUCTS_ENDPOINT = 'https://fakestoreapi.com/products'
export const PRODUCT_PLACEHOLDER_IMAGE = '/product-placeholder.svg'

export const PRODUCT_ERROR_CODES = Object.freeze({
  HTTP_ERROR: 'HTTP_ERROR',
  JSON_ERROR: 'JSON_ERROR',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  NETWORK_ERROR: 'NETWORK_ERROR',
  FETCH_UNAVAILABLE: 'FETCH_UNAVAILABLE',
})

/**
 * @typedef {object} Product
 * @property {number|string} id
 * @property {string} name
 * @property {number} price
 * @property {string} image
 * @property {string} category
 * @property {string} description
 */

/** Error raised by the product data service. */
export class ProductApiError extends Error {
  /**
   * @param {string} message
   * @param {{ code: string, status?: number|null, cause?: unknown }} options
   */
  constructor(message, { code, status = null, cause } = {}) {
    super(message, { cause })
    this.name = 'ProductApiError'
    this.code = code
    this.status = status
  }
}

function invalidResponse(message, cause) {
  return new ProductApiError(message, {
    code: PRODUCT_ERROR_CODES.INVALID_RESPONSE,
    cause,
  })
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function normalizeId(id) {
  if (typeof id === 'number' && Number.isFinite(id)) {
    return id
  }

  if (typeof id === 'string' && id.trim() !== '') {
    return id.trim()
  }

  throw invalidResponse('Product id is invalid.')
}

function normalizePrice(price) {
  const isNumber = typeof price === 'number'
  const isNumericString = typeof price === 'string' && price.trim() !== ''

  if (!isNumber && !isNumericString) {
    throw invalidResponse('Product price is invalid.')
  }

  const normalizedPrice = Number(price)
  if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
    throw invalidResponse('Product price is invalid.')
  }

  return normalizedPrice
}

function normalizedText(value, fallback) {
  if (typeof value !== 'string') {
    return fallback
  }

  const trimmedValue = value.trim()
  return trimmedValue === '' ? fallback : trimmedValue
}

/**
 * Convert one Fake Store API item into the internal Product structure.
 *
 * @param {unknown} rawProduct
 * @returns {Product}
 * @throws {ProductApiError} When a required field has an invalid structure.
 */
export function normalizeProduct(rawProduct) {
  if (!isPlainObject(rawProduct)) {
    throw invalidResponse('Product data must be a plain object.')
  }

  return {
    id: normalizeId(rawProduct.id),
    name: normalizedText(rawProduct.title, '이름 없는 상품'),
    price: normalizePrice(rawProduct.price),
    image: normalizedText(rawProduct.image, PRODUCT_PLACEHOLDER_IMAGE),
    category: normalizedText(rawProduct.category, 'uncategorized'),
    description: normalizedText(rawProduct.description, ''),
  }
}

/**
 * Normalize a complete Fake Store API response without mutating it.
 *
 * @param {unknown} rawProducts
 * @returns {Product[]}
 * @throws {ProductApiError} When the response is not a valid product array.
 */
export function normalizeProducts(rawProducts) {
  if (!Array.isArray(rawProducts)) {
    throw invalidResponse('Product response must be an array.')
  }

  const normalizedProducts = rawProducts.map(normalizeProduct)
  const productIds = new Set()

  for (const product of normalizedProducts) {
    if (productIds.has(product.id)) {
      throw invalidResponse('Product ids must be unique.')
    }

    productIds.add(product.id)
  }

  return normalizedProducts
}

/**
 * Fetch and normalize products from the Fake Store API.
 *
 * @param {{ signal?: AbortSignal, fetchImpl?: typeof fetch }} [options]
 * @returns {Promise<Product[]>}
 */
export async function fetchProducts({ signal, fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new ProductApiError('The Fetch API is unavailable.', {
      code: PRODUCT_ERROR_CODES.FETCH_UNAVAILABLE,
    })
  }

  let response

  try {
    response = await fetchImpl(PRODUCTS_ENDPOINT, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error
    }

    throw new ProductApiError('The product request could not be completed.', {
      code: PRODUCT_ERROR_CODES.NETWORK_ERROR,
      cause: error,
    })
  }

  if (
    response === null ||
    typeof response !== 'object' ||
    typeof response.ok !== 'boolean'
  ) {
    throw invalidResponse('The product response object is invalid.')
  }

  if (!response.ok) {
    const status = Number.isInteger(response.status) ? response.status : null
    throw new ProductApiError('The product request returned an HTTP error.', {
      code: PRODUCT_ERROR_CODES.HTTP_ERROR,
      status,
    })
  }

  if (typeof response.json !== 'function') {
    throw invalidResponse('The product response object is invalid.')
  }

  let rawProducts

  try {
    rawProducts = await response.json()
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error
    }

    throw new ProductApiError('The product response could not be parsed.', {
      code: PRODUCT_ERROR_CODES.JSON_ERROR,
      cause: error,
    })
  }

  return normalizeProducts(rawProducts)
}
