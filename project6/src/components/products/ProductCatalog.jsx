import { useEffect, useMemo, useState } from 'react'

import { useProducts } from '../../hooks/useProducts.js'
import {
  filterProducts,
  getProductCategories,
} from '../../utils/filterProducts.js'
import ProductFilters from './ProductFilters.jsx'
import ProductList from './ProductList.jsx'

const SKELETON_ITEMS = ['loading-1', 'loading-2', 'loading-3', 'loading-4']

function LoadingProducts() {
  return (
    <div className="products-loading" role="status" aria-live="polite">
      <p>상품을 불러오는 중입니다.</p>
      <div className="skeleton-grid" aria-hidden="true">
        {SKELETON_ITEMS.map((item) => (
          <div className="skeleton-card" key={item}>
            <div className="skeleton-image" />
            <div className="skeleton-line skeleton-line-short" />
            <div className="skeleton-line" />
            <div className="skeleton-line skeleton-line-medium" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductCatalog() {
  const { products, isLoading, error, dataSource, retry } = useProducts()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const categories = useMemo(
    () => getProductCategories(products),
    [products],
  )
  const filteredProducts = useMemo(
    () => filterProducts(products, searchTerm, selectedCategory),
    [products, searchTerm, selectedCategory],
  )
  const hasActiveFilters =
    searchTerm.trim() !== '' || selectedCategory !== 'all'

  useEffect(() => {
    if (
      selectedCategory !== 'all' &&
      !categories.includes(selectedCategory)
    ) {
      setSelectedCategory('all')
    }
  }, [categories, selectedCategory])

  if (isLoading) {
    return <LoadingProducts />
  }

  const isApiEmpty =
    error === null && dataSource === 'api' && products.length === 0
  const hasNoFilterResults =
    products.length > 0 && filteredProducts.length === 0

  function resetFilters() {
    setSearchTerm('')
    setSelectedCategory('all')
  }

  return (
    <div className="product-catalog" data-source={dataSource ?? undefined}>
      {error && dataSource === 'mock' && (
        <div className="products-error" role="alert">
          <div>
            <h3>상품 정보를 가져오지 못했습니다.</h3>
            <p>{error.message}</p>
            <p className="mock-notice">현재 대체 상품 6개를 표시합니다.</p>
          </div>
          <button className="retry-button" type="button" onClick={retry}>
            다시 시도
          </button>
        </div>
      )}

      {isApiEmpty && (
        <p className="products-empty" role="status">
          표시할 상품이 없습니다.
        </p>
      )}

      {products.length > 0 && (
        <>
          <ProductFilters
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
            onReset={resetFilters}
            hasActiveFilters={hasActiveFilters}
          />

          {hasNoFilterResults ? (
            <p className="filter-results-empty" role="status">
              검색 조건에 맞는 상품이 없습니다.
            </p>
          ) : (
            <ProductList products={filteredProducts} />
          )}
        </>
      )}
    </div>
  )
}

export default ProductCatalog
