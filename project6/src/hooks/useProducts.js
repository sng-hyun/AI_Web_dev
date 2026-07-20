import { useCallback, useEffect, useRef, useState } from 'react'

import { mockProducts } from '../data/mockProducts.js'
import {
  PRODUCT_ERROR_CODES,
  fetchProducts,
} from '../services/productApi.js'

const UNKNOWN_ERROR_CODE = 'UNKNOWN_ERROR'

const ERROR_MESSAGES = Object.freeze({
  [PRODUCT_ERROR_CODES.NETWORK_ERROR]:
    '상품 정보를 불러오지 못했습니다. 현재 대체 상품을 표시합니다.',
  [PRODUCT_ERROR_CODES.HTTP_ERROR]:
    '상품 서버가 요청을 처리하지 못했습니다. 현재 대체 상품을 표시합니다.',
  [PRODUCT_ERROR_CODES.JSON_ERROR]:
    '상품 데이터 형식을 확인할 수 없습니다. 현재 대체 상품을 표시합니다.',
  [PRODUCT_ERROR_CODES.INVALID_RESPONSE]:
    '상품 데이터 형식을 확인할 수 없습니다. 현재 대체 상품을 표시합니다.',
  [PRODUCT_ERROR_CODES.FETCH_UNAVAILABLE]:
    '상품 요청 기능을 사용할 수 없습니다. 현재 대체 상품을 표시합니다.',
  [UNKNOWN_ERROR_CODE]:
    '상품을 불러오는 중 문제가 발생했습니다. 현재 대체 상품을 표시합니다.',
})

function createSafeError(error) {
  const knownCodes = Object.values(PRODUCT_ERROR_CODES)
  const code = knownCodes.includes(error?.code)
    ? error.code
    : UNKNOWN_ERROR_CODE

  return {
    code,
    message: ERROR_MESSAGES[code],
  }
}

function createInitialState() {
  return {
    products: [],
    isLoading: true,
    error: null,
    dataSource: null,
  }
}

export function useProducts() {
  const [state, setState] = useState(createInitialState)
  const activeRequestRef = useRef(null)
  const requestSequenceRef = useRef(0)
  const isMountedRef = useRef(false)

  const requestProducts = useCallback(async () => {
    activeRequestRef.current?.controller.abort()

    const controller = new AbortController()
    const requestId = ++requestSequenceRef.current
    activeRequestRef.current = { controller, requestId }

    if (isMountedRef.current) {
      setState(createInitialState())
    }

    try {
      const products = await fetchProducts({ signal: controller.signal })
      const isLatestRequest =
        activeRequestRef.current?.requestId === requestId

      if (!isMountedRef.current || !isLatestRequest) {
        return
      }

      setState({
        products,
        isLoading: false,
        error: null,
        dataSource: 'api',
      })
    } catch (error) {
      const isLatestRequest =
        activeRequestRef.current?.requestId === requestId

      if (
        error?.name === 'AbortError' ||
        !isMountedRef.current ||
        !isLatestRequest
      ) {
        return
      }

      setState({
        products: mockProducts,
        isLoading: false,
        error: createSafeError(error),
        dataSource: 'mock',
      })
    } finally {
      if (activeRequestRef.current?.requestId === requestId) {
        activeRequestRef.current = null
      }
    }
  }, [])

  const retry = useCallback(() => {
    void requestProducts()
  }, [requestProducts])

  useEffect(() => {
    isMountedRef.current = true
    void requestProducts()

    return () => {
      isMountedRef.current = false
      activeRequestRef.current?.controller.abort()
      activeRequestRef.current = null
    }
  }, [requestProducts])

  return { ...state, retry }
}
